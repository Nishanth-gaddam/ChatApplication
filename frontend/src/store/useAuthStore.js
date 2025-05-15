import {create} from 'zustand'
import {axiosInstance} from '../lib/axios'
import toast from 'react-hot-toast';
import { data, Navigate, useNavigate } from 'react-router-dom';
import {io} from "socket.io-client"
const BASE_URL=import.meta.env.MODE === "development"?"http://localhost:8080/":"/";
export const useAuthStore=create((set,get)=>({
    authUser:null,
    isSigningup:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    onlineUsers:[],
    socket:null,

    isCheckingAuth:true,
    checkAuth:async()=>{
        try {
            const responce= await axiosInstance.get("/auth/check",{withCredentials:true});
            // const {status,user}=responce;
            get().connectSocket();
            set({authUser:responce.data}) 
        } catch (error) {
            console.log("error in check/auth function in useAuthStore.js",error);
            set({authUser:null})  
        }finally{
            set({isCheckingAuth:false})
        }
    },
    signup:async (data)=>{
        set({isSigningup:true});
        try {
            const responce=await axiosInstance.post("/auth/signup",data,{withCredentials:true});
            set({authUser:responce.data});
            get().connectSocket();
            toast.success("accounted created successfully");
        } catch (error) {
            toast.error(error.responce.data.message);
        }finally{
            set({isSigningup:false})
        }
    },
    logout:async()=>{
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser:null});
            toast.success("successfully logout");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.responce?.data?.message)
        }
    },
    login:async (data)=>{
        set({isLoggingIn:true});
        try{
            const responce=await axiosInstance.post("/auth/login",data,{withCredentials:true});
           set({authUser:responce.data})
           toast.success("Login successfull");
           get().connectSocket();
           return true;
        }catch(error){
            // console.log(error.message)
            toast.error( error.response?.data?.message);
        }finally{
            set({isLoggingIn:false})
        }
    },
    updateProfile:async (profilePic) => {
        set({isUpdatingProfile:true})
        try{
           const responce=await axiosInstance.put("/auth/update-profile-pic",profilePic,{withCredentials:true});
           toast.success("Login success");
        }catch(error){
            toast.error( error.response?.data?.message);
        }finally{
            set({isUpdatingProfile:false})
        }
    },
    connectSocket:()=>{
        const {authUser}=get()
         if(!authUser || get().socket?.connected) return; 
        const socket=io(BASE_URL,{
            query:{
               userId:authUser._id,
            }
        });
        console.log("Connecting socket for user", authUser?._id);

        socket.connect();
        set({socket:socket});
        socket.on("getOnlineUsers",(userId)=>{
            set({onlineUsers:userId});
        })
    },
    disconnectSocket:()=>{
        if(get().socket?.connected) get().socket.disconnect();
    }
}))