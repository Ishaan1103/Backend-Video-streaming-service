import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/coudinary.js"
import {ApiResponse} from '../utils/apiResponse.js'
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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
            $unset:{
                refreshToken:1
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

const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshTokenereq  = req.cookies.refreshToken || req.body.refreshToken
        
        if (!incomingRefreshTokenereq){
            throw new ApiError(401,"unauthorized request")
        }

        const decordedToken = jwt.verify(incomingRefreshTokenereq, process.env.REFRESH_TOKEN_SECERET)
        
        
        const user = await User.findById(decordedToken?._id)
    
        if (!user){
            throw new ApiError(401,"invalid Refresh Token")
        }
        
        if (incomingRefreshTokenereq !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const option ={
            httpOnly:true,
            secure:true
        } 
    
        const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        
        return res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newRefreshToken,option)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "error refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const verifyPassword = await user.isPasswordCorrect(oldPassword)
    if (!verifyPassword) {
        throw new ApiError(400,"Invalid password")        
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed Successfully")
    )
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current User fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const { fullName, email } = req.body

    if (!fullName || !email){
        throw new ApiError(400,"All fields mst be filled")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Accound details updated Successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file missing")
    }

    const deletingOldAvatar = await deleteOnCloudinary(req.user?.avatar)
    console.log(deletingOldAvatar)

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res.status(200).json(new ApiResponse(400,user,"updated avatar"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image file missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500,"Error while uploading on Cover Image")
    }
    
    const deletingOldCoverImage = await deleteOnCloudinary(req.user?.coverImage)
    console.log(deletingOldCoverImage)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res.status(200).json(new ApiResponse(400,user,"updated Cover Image"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if (!username?.trim()) {
        throw new ApiError(400,"Username is missing")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404,"channel do not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched Successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetch successfully"
    ))
})

export {
    registerUser,// --done and checked
    loginUser,// --done and checked
    logoutUser, // --done and checked
    refreshAccessToken, // --done and checked
    changeCurrentPassword,// --done and checked
    getCurrentUser,// --done and checked
    updateAccountDetails,// --done and checked
    updateUserAvatar,// --done and checked
    updateUserCoverImage,// --done and checked
    getUserChannelProfile,// --done and checked
    getWatchHistory// --done and checked
    }