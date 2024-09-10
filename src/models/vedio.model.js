import mongoose,{ Schema } from "mongoose"

const vedioSchema = new Schema(
    {
        vediofile:{
            type:String, //cloudinary
            required:true
        },
        thumbnail:{
            type:String, //cloudinary
            required:true
        },
        title:{
            type:String, 
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number, //cloudinary
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublic:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const Vedio = mongoose.model("Vedio",vedioSchema)