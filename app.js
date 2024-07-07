import express from "express";

import {connectDB} from "./utils/features.js";
import dotenv from "dotenv"
import {createServer} from 'http'
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { createUser } from "./seeders/user.js";
import {Server} from "socket.io"
import {v4 as uuid} from "uuid"
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import cors from "cors"
import {v2 as cloudinary }from "cloudinary"
import {corsOptions} from "./constants/config.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { socketAuthenticator } from "./middlewares/auth.js";
import userRoute from "../server/routes/user.js"
import chatRoute from "../server/routes/chat.js"
import adminRoute from  "../server/routes/admin.js"
dotenv.config({
    path:'./.env'
})

const  mongouri=process.env.MONGO_URI;
const userSocketIDs = new Map();
const onlineUsers=new Set();
connectDB(mongouri);

// createUser(10);
const port=process.env.PORT
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
const app = express();
const server =createServer(app)
const io = new Server(server, {
    cors: corsOptions,
  });
  app.set("io", io);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions))
app.use("/user", userRoute);
app.use("/chat",chatRoute);
app.use("/admin",adminRoute);
io.use((socket, next) => {
    console.log("bhencho")
    console.log(socket.request.res)
    cookieParser()(
      socket.request,
      socket.request.res,
      async (err) => await socketAuthenticator(err, socket, next)
    );
  });
  
io.on("connection", (socket) => {
    const user = socket.user;
    
    userSocketIDs.set(user._id.toString(), socket.id);
    console.log(userSocketIDs)
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
  
      const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId,
      };
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
  
      try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }
    });
    socket.on(START_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(START_TYPING, { chatId });
    });
  
    socket.on(STOP_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    });
    socket.on(CHAT_JOINED, ({ userId, members }) => {
      onlineUsers.add(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  
    socket.on(CHAT_LEAVED, ({ userId, members }) => {
      onlineUsers.delete(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
    socket.on("disconnect", () => {
      userSocketIDs.delete(user._id.toString());
      onlineUsers.delete(user._id.toString());
      socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    });
    });
  
    
  
   

app.use(errorMiddleware)

server.listen(port, () => {
    console.log(`port rrun on ${port}`);
  });  
  export {userSocketIDs}