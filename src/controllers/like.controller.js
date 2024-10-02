import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
        const {videoId} = req.params
        //TODO: toggle like on video
        const findLike = await Like.findOne(
            {$and:[{video:videoId},{likedBy:req.user?._id}]}
        )
        if (!findLike) {
            const liked = await Like.create(
                {
                    video:videoId,
                    likedBy:req.user?._id
                }
            )
            if (!liked) {
                throw new ApiError(
                    400,
                    "Error while liking video"
                )
            }
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    liked,
                    "Liked Video"
                )
            )
        }
        const unliked = await Like.findByIdAndDelete(findLike._id)
        if (!unliked) {
            throw new ApiError(
                400,
                "Error While unlike a video"
            )
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                unliked,
                "Unliked video"
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
        const {commentId} = req.params
        //TODO: toggle like on comment
        const liked = await Like.findOne(
            {$and:[{comment:commentId},{likedBy:req.user?._id}]}
        )
        if (!liked) {
            const newliked = await Like.create(
                {
                comment:commentId,
                likedBy:req.user?._id
                }
            )
            if (!newliked) {
                throw new ApiError(500,"not able to add like to comment")
            }
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    newliked,
                    "comment Liked"
                )
            )
        }
        const unlike = await Like.findByIdAndDelete(liked._id)
        return res.status(200).json(new ApiResponse(
            200,
            unlike,
            "Unliked Comment"
        ))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
        const {tweetId} = req.params
        //TODO: toggle like on tweet
        const liked = await Like.findOne(
            {$and:[{tweet:tweetId},{likedBy:req.user?._id}]}
        )
        if (!liked) {
            const newliked = await Like.create(
                {
                tweet:tweetId,
                likedBy:req.user?._id
                }
            )
            if (!newliked) {
                throw new ApiError(500,"not able to add like to Tweet")
            }
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    newliked,
                    "Tweet Liked"
                )
            )
        }
        const unlike = await Like.findByIdAndDelete(liked._id)
        return res.status(200).json(new ApiResponse(
            200,
            unlike,
            "Unliked tweet"
        ))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVod = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"video",
                as:"video",
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
                                        avatar:1,
                                        username:1,
                                        fullName:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    },
                    {
                            $project:{
                                videoFile:1,
                                thumbnail:1,
                                title:1,
                                duration:1,
                                views:1,
                                owner:1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $project:{
                video:1,
                likedBy:1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVod,
            "fetched all liked Video"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}