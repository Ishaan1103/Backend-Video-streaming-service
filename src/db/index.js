import mongoose from "mongoose"

const connectionDb = async () =>{
  try {
    const dbResponse = await mongoose.connect(process.env.URI)
    console.log(`connected to Db at host ${dbResponse.connection.host}`)
    return dbResponse
  } catch (error) {
    console.uerror(`Error while connecting to Db`);
  }
}
export default connectionDb
