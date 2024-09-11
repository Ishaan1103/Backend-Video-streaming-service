import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/coudinary.js"
import {ApiResponse} from '../utils/apiResponse.js'

const generateAccessAndRefreshToken = async (userId)=>
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access Token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    //first the req will give fullname email username pass avatar and coverimage(if there is)
    const {username,email,fullName,password} = req.body
    //second we will check if anything missing from required:true
    if(
        [username,email,fullName,password].some(u=>u === '')
    ){
        throw new ApiError(400,"All Required Field must be given")
    }
    //check if he exist with same email, username
    const existedUser = await User.findOne({$or:[{username},{email}]})
    
    if (existedUser) {
        throw new ApiError(409,"User with Email and UserName exist");
    }
    //check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file required")
    }
    //upload avatar on cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(500,"avatar file not saved")
    }
    //check if cover image is there or not 
    
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    //if it is there then upload
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    //add a refresh token 
    
    //save the user data
    const user = await User.create({
        username,
        email,
        fullName,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })
    //respond the data with details without giving password and id
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500,"error while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res,)=>{
    //Take email(or username according to need) and passowrd
    const{username, email, password} = req.body
    //check if username or email is give password can be checked in bcrypt
    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    //find it in database
    const user = await User.findOne({$or:[{username},{email}]})
    //if not exist send him error
    if (!user) {
        throw new ApiError(404,"No user Found from given email and username")
    }
    //else check password using isPasswordCorrect method
    const isPasswordValid = await user.isPasswordCorrect(password)
    //if not send error
    if (!isPasswordValid) {
        throw new ApiError(400,"Incorrect password")
    }
    //if same password generate tokens
    const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)
    //send and save refresh token and access in cookies
    const option ={
        http:true,
        secure:true
    }
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //respond him with valid status code
    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User Logged In"))
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        })
        const option ={
            http:true,
            secure:true
        }
        return res
        .status(200)
        .clearCookie("accessToken",option)
        .clearCookie("refreshToken",option)
        .json(
            new ApiResponse(200,{},"User logged Out")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser
    }