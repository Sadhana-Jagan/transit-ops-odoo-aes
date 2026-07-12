const mongoose=require("mongoose");

module.exports=mongoose.model("Expense",new mongoose.Schema({
    vehicle:{type:mongoose.Schema.Types.ObjectId,ref:"Vehicle",required:true},
    expenseType:{type:String,enum:["Fuel","Maintenance","Toll","Insurance","Other"],required:true},
    amount:{type:Number,required:true},
    remarks:String,
    date:{type:Date,default:Date.now}
},{timestamps:true}));