let mongoose = require("mongoose");
const { type } = require("os");

let schema = mongoose.Schema({
    id:{
        type:String,
        required:true,
    },
    task:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,ref:"User",required:true
    }
})

let Task = mongoose.model('Task',schema);

module.exports = Task;