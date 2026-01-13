import jwt from "jsonwebtoken";
import User from "../models/userModel.js";


export const isLoggedIn = async (req, res, next) => {
    try{
        const token = req.cookies.jwt_T

        if(!token) {
            return res.status(401).json({ message: "Unauthorized-No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({ message: "Unauthorized-Token verification failed" });
        }
        const user = await User.findById(decoded.userId).select("-password");  

        if(!user) {
            return res.status(401).json({ message: "Unauthorized-No user found" });
        }

        req.user=user;
        next();


    }catch(error){
        console.log("Error in isLoggedIn middleware", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}