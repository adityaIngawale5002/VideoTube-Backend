import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./.env',
});

//database connection
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000,()=>{console.log("process running at port no:- ",process.env.PORT)})
})
.catch((error)=>{
    console.log("DB connection failed from index page!!!!!!! ",error)
})


