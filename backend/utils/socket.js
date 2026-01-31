const socket =require("socket.io");
const http =require("http");
const express=require("express");

const app=express();

const server=http.createServer(app);

const io=new socket.Server(server,{
    cors:["http://localhost:5173"]
});

const userSocketmap=new Map();//userId:socket.id

const getRecieverSocketId=(userId)=>{
    console.log("Getting socketId for userId:",userId);
    console.log("Current userSocketmap:",userSocketmap);
    return userSocketmap.get(userId).socketId;
}
// module.exports= {getRecieverSocketId};
io.on("connection",(socket)=>{
    console.log("A user is connected",socket.id);
    const userId=socket.handshake.query.userId;
    console.log("UserId from handshake query:",userId);
    if(!userId) return;
    if(userSocketmap.has(userId)){
        clearTimeout(userSocketmap.get(userId).timeout);
    }
    userSocketmap.set(userId,{socketId:socket.id,timeout:null});
    console.log("UserSocketMap after connection:",userSocketmap);

    socket.on("sendMessage",(data)=>{
        const recieverSocketInfo=userSocketmap.get(data.recieverId);
        console.log("Reciever Socket Info:", recieverSocketInfo);
        if(recieverSocketInfo){
            recieverSocketInfo.socketId.emit("newMessage",data);
        }
    })
    //io.emmit sends events to all connected users
    io.emit("getOnlineUsers",Object.keys(userSocketmap));
    socket.on("disconnect",()=>{
        console.log("A user is disconnected",socket.id);
        userSocketmap.delete(userId);
        io.emit("getOnlineUsers",Object.keys(userSocketmap));
    })
})
const emitUser=(userId,event,data)=>{
        let socketId=getRecieverSocketId(userId);
        console.log("Emitting to socketId:",socketId,"event:",event,"data:",data    );
        if(socketId){
           io.to(socketId).emit(event,data);
        }
    }
module.exports= {io,server,app,getRecieverSocketId,emitUser};
