import dotenv from "dotenv"
import connectionDb from "./db/index.js"
import {app} from './app.js'



dotenv.config({
  path:'./.env'
})


const PORT = process.env.PORT 

connectionDb()
.then(()=>{
  app.listen(PORT,()=>{
    console.log(`server running at ${PORT}`)
  })
})
.catch((err)=>{
  console.log(`error in connection ${err}`)
})

