import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req,res,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if(!token){
            throw new ApiError(401,"Unauthorised")
        }
        const decordedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECERET)
        
        const user = await User.findById(decordedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"Invalid access Token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(400, error.message || "Invalid Access Token")
    }
})

export default verifyJWT