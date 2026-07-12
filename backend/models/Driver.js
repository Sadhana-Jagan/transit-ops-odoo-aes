const mongoose=require("mongoose");

module.exports=mongoose.model("Driver",new mongoose.Schema({
    name:{type:String,required:true},
    licenseNumber:{type:String,required:true,unique:true},
    licenseCategory:{type:String,required:true},
    licenseExpiry:{type:Date,required:true},
    contactNumber:{type:String,required:true},
    safetyScore:{type:Number,default:100},
    status:{type:String,enum:["Available","OnTrip","OffDuty","Suspended"],default:"Available"}
},{timestamps:true}));