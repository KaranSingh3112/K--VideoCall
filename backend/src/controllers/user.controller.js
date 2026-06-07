import {User} from "../models/user.schema.js"
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";


export const login = async (req,res) => {
    const {username, password} = req.body;
    if(!username || !password){
        return res.status(400).json({message: "Please provide username or password"})
    }
    try {
        const user = await User.findOne({username})
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found!"})
        }

        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if(isPasswordCorrect){
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token:token })
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({ message : "Invalid username or password"})
        }
    } catch (error) {
        return res.status(500).json({message: `Something went wrong ${error}`})
    }
}

export const register = async (req,res) => {
    const {name, username, password} = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message: "User already exists!"})
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUSer = new User({
            name: name,
            username: username,
            password: hashedPassword
        })
        await newUSer.save();
        res.status(httpStatus.CREATED).json({message: "User registered!"})
    } catch (error) {
        res.json({message: `Something went wrong ${error}`})
    }
}
