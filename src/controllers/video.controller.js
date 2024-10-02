import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/coudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.aggregate([
        {
            $match:{
                $or:[
                    {title:{$regex:query,$options:"i"}},
                    {description:{$regex:query,$options:"i"}}
                ]
            }
        },
        {
            $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"createdBy"
            }
        },
        {
            $unwind:"$createdBy"
        },
        {
            $project:{
                thumbnail:1,
                videoFile:1,
                title:1,
                description:1,
                createdBy:{
                    fullName:1,
                    username:1,
                    avatar:1
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType === 'asc' ? 1 : -1
            }
        },
        {
            $skip:(page - 1)*limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {videos},
            "All videos"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
        const { title, description} = req.body
        // TODO: get video, upload to cloudinary, create video
        // console.log(title);
        // console.log(description);
        
        
        if (!title || !description) {
            throw new ApiError(400,"Please fill title and description")
        }
        const videoFileLocatPath = req?.files?.videofile[0]?.path
        if (!videoFileLocatPath) {
            throw new ApiError(400,"Video File not found")
        }
        const videoFile = await uploadOnCloudinary(videoFileLocatPath)
    
        if (!videoFile.url) {
            throw new ApiError(400,"Uploding of Video file failed")
        }
    
        const thumbnailLocalPath = req?.files?.thumbnail[0]?.path
    
        if (!thumbnailLocalPath) {
            throw new ApiError(400,"Thumbnail not found")
        }
    
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        
        if (!thumbnail.url) {
            throw new ApiError(400,"Error while uploading thumbnail file")
        }
    
        const savedVideo = await Video.create({
            videofile:videoFile.url,
            thumbnail:thumbnail.url,
            title,
            description,
            duration:videoFile.duration,
            owner:req.user?._id,
        }) 
        
        if (!savedVideo) {
            throw new ApiError(500,"Error while saving video")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {savedVideo},
                "Video uploaded"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
        const { videoId } = req.params
        //TODO: get video by id
        if (!videoId) {
            throw new ApiError(400,"Video Id required to get details")
        }
        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404,"Video File Not found")
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {video},
            "Video sent")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
        const { videoId } = req.params
        //TODO: update video details like title, description, thumbnail
        const {title, description} = req.body 
        
        const video = await Video.findById(videoId)
/*
        const user = await User.findById(video.owner)

        if(req.user?.username !== user.username){
            throw new ApiError(400,"You cannot update the vedio")
        }
*/
//for Above the time taken for prosessing is larger we can use below

        if (!((video?.owner).equals(req.user?._id))) {
            throw new ApiError(400,"You cannot Update the details")
        }

        const deleteOldThumbnail = await deleteOnCloudinary(video.thumbnail)
    
        if (deleteOldThumbnail.result !== 'ok' ) {
            throw new ApiError(400,"old thumbnail not deleted")
        }

        const newThumbnailLocationFile = req?.file?.path
    
        if (!newThumbnailLocationFile) {
            throw new ApiError(400,"new Thumbnail Path not found")
        }
    
        const newThumbnail = await uploadOnCloudinary(newThumbnailLocationFile)
        
        if (!newThumbnail) {
            throw new ApiError(400,"New Thumbnail not uploaded")
        }
        const videoToupdate = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    title,
                    description,
                    thumbnail:newThumbnail.url
                }
            },
            {
                new:true
            }
        )
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            videoToupdate,
            "Updated Details of vedio"
        ))
})

const deleteVideo = asyncHandler(async (req, res) => {
        const { videoId } = req.params
        //TODO: delete video
        if (!videoId) {
            throw new ApiError(400,"Please give video Id")
        }
        const video = await Video.findById(videoId)
        if (!((video?.owner).equals(req.user?._id))) {
            throw new ApiError(400,"You cannot Update the details")
        }
        const videoDelete = await deleteOnCloudinary(video.videoFile)
        if (videoDelete.result !== 'ok') {
            throw new ApiError(400,"Not able to delete video file")
        }
        const thumdDelete = await deleteOnCloudinary(video.thumbnail)
        if (thumdDelete.result !== 'ok') {
            throw new ApiError(400,"Not able to delete thumbnail file")
        }
        const deletedVideo = await Video.findByIdAndDelete(videoId)
        return res.status(204).json(new ApiResponse(204,{deletedVideo},"video and details deleted"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if (!((video?.owner).equals(req.user?._id))) {
        throw new ApiError(400,"You cannot Update the details")
    }
    const videoChanged = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },  
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videoChanged,
        "Changed View of the Publication"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
