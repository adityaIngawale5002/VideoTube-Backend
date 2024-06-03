import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB=async ()=>{
    try {
    console.log(process.env.MONGODB_URL)
    await mongoose.connect(process.env.MONGODB_URL);
    } catch (error) {
        console.log("mongo connection error",error)
        process.exit(1);//learn about it
    }
}
export default connectDB;