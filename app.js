const express = require("express");
const mongoose = require("mongoose");
const app = express()
const Task = require("../backend/models/taskModel.js");
const cors = require('cors');
const flatted = require("flatted");
const { error } = require("console");
const auth = require("../backend/middleware/auth.js");
const User = require("../backend/models/userModel");
const bycryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {body,validationResult} = require("express-validator");


app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const port = 1234;

async function main(){
    await mongoose.connect("mongodb://localhost:27017/task-manager");
}

main().then(()=>{
    console.log("DATABASE CONNECTED SUCCESSFULLY");
})
.catch((err)=>{
    console.log(err);
})


app.listen(port,()=>{
    console.log(`Server is running on port:-${port}`);
})

app.get("/",(req,res)=>{
    res.send("Task Manager is preparing bro");
})

app.get("/tasks",auth,async(req,res)=>{
    console.log(req.user);
    try{
        const tasks = await Task.find({userId:req.user.id});
        res.status(200).json(tasks);
    }
    catch(err){
        console.log(err);
    }
})

app.post("/tasks",auth,async(req,res)=>{
    let data = req.body;
    console.log(data);
    console.log(req.user);
    let {id,task,completed} = req.body;
    const userIdbro = req.user.id;
    try {
        const newTask = new Task({id,task,completed,userId:userIdbro});
        await newTask.save();
        
        res.status(201).json({ message: "Task created successfully" });
      } catch (error) {
        console.error("Error saving task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
})

app.delete("/tasks/:id",auth,async (req,res)=>{
    try{
        console.log("Task ID:", req.params.id);
        console.log("User ID:", req.user.id);

        const task = await Task.deleteOne({id:req.params.id, userId: req.user.id})
        if (task.deletedCount === 0) {
            return res.status(404).json({message:"deletion error bro"});
          }
          res.status(200).json(task);
          console.log("deleted bro");
          console.log(task);
    }
    catch (error) {
        res.status(500).json({"error:-":error});
    }
})


app.put("/tasks/:id",auth,async(req,res)=>{
    try{
        console.log("Task ID:", req.params.id);
        console.log("User ID:", req.user.id);
        const {task,completed} = req.body;
        const updatedTask = await Task.findOneAndUpdate(
            {id:req.params.id,userId:req.user.id},
            {task:req.body.task,completed:req.body.completed},
            {new:true},
        );
        if(!updatedTask){
            return res.status(404).json({message:"task not found"});
        }
        res.status(200).json({message:"task completed successfully",task:updatedTask});
        console.log("successfully updated bro");
        console.log(updatedTask);
    }
    catch(error){
        console.log("errro updating failed",error);
        res.status(500).json({message:"failed to task",error});
    }
})


app.post("/api/user/register",[body("name").notEmpty(),body("email").isEmail(),body("password").isLength({min:6})],
        async(req,res)=>{
            const err = validationResult(req);
            console.log(err);
            if(!err.isEmpty()){
                
                return res.status(400).json({err:err.array()})
            }

            try{
                const {name,email,password} = req.body;
                let user = await User.findOne({email});
                console.log(`user:-${user}`)
                if(user){
                    return res.status(400).json({message:"user already exists"});
                }

                user = new User({name,email,password});
                
                await user.save();
                res.status(201).json({message:"user registered successfully"});
            }
            catch(err){
                console.log(err);        
                res.status(500).json({message:"server error"});
            }
        }
);

app.post("/api/user/login",async(req,res)=>{

    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }
        console.log(user);

        const isMatch = await bycryptjs.compare(password,user.password);
        console.log(isMatch);
        if(!isMatch){
            console.log("almost bro")
            return res.status(400).json({message:"Invalid credentials"});
        }

        const token = jwt.sign({id:user._id},"secretkey",{expiresIn:"1h"});
        console.log(token);
        res.json({token,user:{id:user._id,name:user.name,email:user.email}});
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Server error"});
    }
})