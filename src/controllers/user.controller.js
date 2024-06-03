import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import {deleteCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accesstoken=user.generateAccessToken()
        const refreshtoken=user.generateRefreshToken()

        
        user.refreshtoken=refreshtoken;
        await user.save({validateBeforeSave:false});

        return {accesstoken,refreshtoken};

    } catch (error) {
        throw new ApiError(500,"something went wrong will generating tokens")
    }
}

//register controller
const registerUser=asyncHandler(async (req,res)=>{

    const {fullname,email,username,password}=req.body;

    if(
        [fullname,email,password,username].some((field)=>field?.trim()==="")
       
    ){
        throw new ApiError(400,"All field are required to register")
    }
    
    const existedUser=await User.findOne({
        $or:[{email:email},{username:username}]
    });

    console.log("here we get if user exists alredy printed existeduser",existedUser)
    if(existedUser){
        throw new ApiError(409,"user with the email or username alraedy exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;

    let coverImageLocalPath="";
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files?.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }
    
   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=coverImageLocalPath?await uploadOnCloudinary(coverImageLocalPath):"";
   
   if(!avatar){
    throw new ApiError(400,"avatar file is required")
   }

  const user=await User.create({
    fullname,
    username:username.toLowerCase(),
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password
   })
    const createduser=await User.findById(user._id).select(
        "-password -refreshToken "
    )
    if(!createduser){
        throw new ApiError(500,"something went wrong will user register")
    }
    
   return res.status(201).json(
    new ApiResponse(200,createduser,"user successfull registered")
   )

})


//login controller
const loginUser=asyncHandler(async (req,res)=>{

    const {username,email,password}=req.body;

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    if(!password){
        throw new ApiError(400,"password is required")
    }
    
   const FindedUser=await User.findOne({
        $or:[
            {
              username
            },
            {
                email
            }
            ]
    })
    if(!FindedUser){
        throw new ApiError(404,"user does not exists")
    }

    const ispassvalid= await  FindedUser.isPasswordCorrect(password)

    if(!ispassvalid){
        throw new ApiError(401,"Invalid password")
    }

    const {accesstoken,refreshtoken}=await generateAccessAndRefreshToken(FindedUser._id);


   const loggedInUSer=await User.findById(FindedUser._id).select("-password -refreshToken")

   const options={
    httpOnly:true,
    secure:true,
   }

    return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUSer
        },
        "user logged-in successfully ")
    )

})

//logout controller
const logoutUser=asyncHandler(async (req,res)=>{

   await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken:1,
        }
    },
    {
        new:true
    }
    )


    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new ApiResponse(200,"user logged out"))
})


//refresh token controller
const refreshAccessToken=asyncHandler(async(req,res)=>{

        const incomingRefreshToken=req.cookies.refreshtoken || req.body.refreshtoken
        if(!incomingRefreshToken){
            throw new ApiError(401,"unauthorized request")
        }

       try {
        const decodecToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodecToken?._id)
        if(!user){
         throw new ApiError(401,"invalid refresh token")
        }
 
        if(incomingRefreshToken !== user?.refreshtoken){
         throw new ApiError(401,"refresh token is expired")
        }

        const options={
         httpOnly:true,
         secure:true
        }
        const {accesstoken,newrefreshtoken}=await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken",accesstoken,options)
        .cookie("refreshToken",newrefreshtoken,options)
        .json(
         new ApiResponse(200,{accesstoken,newrefreshtoken},"access token refreshed sucesfully")
        )


       } catch (error) {
            throw new ApiError(401,"invalid refresh token")
       }
})


const changeCurrentPassword=asyncHandler(async(req,res)=>{

    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id);
    const ispasswordCorrect=await user.isPasswordCorrect(oldPassword)


    if(!ispasswordCorrect){
        throw new ApiError(40,"invalid old password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"password change successfully"))

    
})


const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200).json(200,req.user,"current user fetched successfuly")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname || !email){
        throw new ApiError(400,"all fields are required")
    }
   const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
        ).select("-password ")

    return res.status(200).json(new ApiResponse(200,user,"account detailed succesfully"))

})


const updateUserAvatar=asyncHandler(async (req,res)=>{
    const newavatarLocalPath=req.file?.path;
    if(!newavatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(newavatarLocalPath)
    await deleteCloudinary(req.user.avatar)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading")
    }

    const response=await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}).select("-password");
    
    return res.status(200).json(new ApiResponse(200,response,"avatar updated successfully"))

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const newCoverimage=req.file?.path;
    if(!newCoverimage){
        throw new ApiError(400,"error while uploading image")
    }
    const coverImage=await uploadOnCloudinary(newCoverimage);
    await deleteCloudinary(req.user.coverImage);
    if(!coverImage.url){
        throw new ApiError(400,"error while uploading the file")
    }

    const response=User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
        ).select("-password -refreshtoken")

        return res.status(200).json(new ApiResponse(200,response,"coverImage updated successfully"))
})


const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{username:username?.toLowerCase()}
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"

            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"subscribers"
                },
                subscribeToCount:{
                    $size:"subscribedTo"
                },
                isSubscribed:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribeToCount:1,
                subscribersCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                eamil:1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exits")
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"user channel fetched successfuly"))
})



const getUserWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                       $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                       } 
                    }
                ]
                   
                
            }
        }
    ])

    return res.status(200).json(new ApiError(200,user[0].watchHistory,"fetched watch-history successfuly"))
})


export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getUserWatchHistory}