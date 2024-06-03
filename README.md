

# Videotube Backend Project

This is the backend for a YouTube-like application built using Express.js, Node.js,  MongoDB and Mongoose for database management.

## Features

- Created routes for handling various APIs
- User routes for registration and login via `register` and `login` routes
- Users can upload profile pictures and cover images to their profiles
- Protected each route with authentication middleware
- Handled file uploads using Multer, storing files on Cloudinary cloud storage platform
- Created access and refresh token cookies for user authentication
- Created routes to handle various services like updating user info, retrieving user info, and video watch history
- Created models for users, videos, subscriptions, and comments, storing data according to schema using Mongoose
- Integrated Mongoose aggregation pipeline to modify and process data

## Technologies Used

- Express
- dotenv
- MongoDB
- Mongoose
- CORS
- cookie-parser
- JWT
- bcrypt
- Multer

## Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/adityaIngawale5002/VideoTube-Backend.git

   cd VideoTube
    ```
2. Install the required dependencies
    ```bash
    npm install
    ```
3. create a ".env" file in the root         directory and add the following environment variables:

  ```bash
    PORT=
    MONGODB_URL=
    PASSWORD=
    CORS_ORIGIN=
    ACCESE_TOKEN_SECRET=
    ACCESE_TOKEN_EXPIRY=
    REFRESH_TOKEN_SECRET=
    REFRESH_TOKEN_EXPIRY=
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
 ``` 

 4. Start the server
 ```bash
 npm start
 ```

