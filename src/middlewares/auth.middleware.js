import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt  from "jsonwebtoken";

export const verifyJWT=asyncHandler(async (req,res,next)=>{
   try {
    const token=req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","");
 
    if(!token){
     throw new ApiError(401,"unauthorized request")
    }
 
    const decodedToken=jwt.verify(token,process.env.ACCESE_TOKEN_SECRET);
    
    const findedUser= await User.findById(decodedToken?._id).select("-password  -refreshToken");
 
     if(!findedUser){
         throw new ApiError(401,"invalid access token")
     }
     req.user=findedUser;
     next();
   } catch (error) {
    
        throw new ApiError(401,error?.message || "invalid access token")
   }

})

export default verifyJWT