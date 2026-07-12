const mongoose=require("mongoose");

module.exports=mongoose.model("User",new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true,lowercase:true},
    password:{type:String,required:true},
    role:{type:String,enum:["FleetManager","Dispatcher","SafetyOfficer","FinancialAnalyst"],required:true}
},{timestamps:true}));