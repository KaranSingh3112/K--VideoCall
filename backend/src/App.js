import express from "express";
import {createServer} from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import {connectToSocket} from "./controllers/socketManager.js";

import userRoutes from "./routes/user.routes.js"

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}))
app.use("/api/v1/users", userRoutes);

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://karansingh311206_db_user:eOusVBGB9qB7o26X@cluster0.vo3rbo2.mongodb.net/");
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
    
    server.listen(app.get("port"), () => {
        console.log("LISTENING ON PORT 8000");  
    })
}
start()