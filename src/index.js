import express from "express";
import dotenv from "dotenv"
import connectionDb from "./db/index.js"
import cors from "cors"
import cookieParser from "cookie-parser"

dotenv.config({
  path:'./.env'
})


const PORT = process.env.PORT 

const app = express()
app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.get('/',(req,res)=>{
  res.status(200).json({message:"All ok!"})
})

connectionDb()
.then(()=>{
  app.listen(PORT,()=>{
    console.log(`server running at ${PORT}`)
  })
})
.catch((err)=>{
  console.log(`error in connection ${err}`)
})

