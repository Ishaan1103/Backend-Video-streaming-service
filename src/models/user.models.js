import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true
        },
        avatar:{
            type:String, //cloudinary
            required:true
        },
        coverImage:{
            type:String, //cloudinary
        },
        password:{
            type:String,
            required:[true,"password is required"]
        },
        watchHistory:{
            type:Schema.Types.ObjectId,
            ref:"Vedio"
        },
        refreshToken:{
            type:String,
        }
    },
    {
    timestamps: true
})

export const User = mongoose.model("User",userSchema) 