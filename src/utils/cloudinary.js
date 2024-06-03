import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null
        }
        const Response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        if(!Response){
            return null;
        }
        //file has been uploaded
        
        console.log("response we get from cloudinary response---> ",Response)
        fs.unlinkSync(localFilePath);
        return Response
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally save file as upload operation get failed
        console.log("error in cloudinary file upload ",error)
        return null;
    }
}

const deleteCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null
        }
        const Response=await cloudinary.uploader.destroy(localFilePath,{
            resource_type:'auto'
        })
        
        if(!Response){
            return null;
        }
        console.log("response we get from cloudinary response---> ",Response)
        return Response
    } catch (error) {
        console.log("error in cloudinary file upload ",error)
        return null;
    }
}
export {uploadOnCloudinary,deleteCloudinary}