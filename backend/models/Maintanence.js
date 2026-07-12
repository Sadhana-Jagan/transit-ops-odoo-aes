const mongoose=require("mongoose");

module.exports=mongoose.model("Maintenance",new mongoose.Schema({
    vehicle:{type:mongoose.Schema.Types.ObjectId,ref:"Vehicle",required:true},
    maintenanceType:{type:String,required:true},
    description:String,
    cost:{type:Number,required:true},
    status:{type:String,enum:["Open","Closed"],default:"Open"},
    openedAt:{type:Date,default:Date.now},
    closedAt:Date
},{timestamps:true}));