import {v2 as cloudinary} from "cloudinary"
import { extractPublicId } from 'cloudinary-build-url'
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECERET
});

const uploadOnCloudinary = async (localPath)=>{
    try {
        if(!localPath) return null
        const uploadResult = await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localPath)
        return uploadResult
    } catch (error) {
        fs.unlinkSync(localPath)
        return null
    }
}

const deleteOnCloudinary = async (url) => {
    if (!url) {
        return null
    }
    const publidId = extractPublicId(url)
    await cloudinary.uploader.destroy(publidId,function(res){return res});

}

export {
    uploadOnCloudinary,
    deleteOnCloudinary
}