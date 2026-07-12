const mongoose=require("mongoose");

module.exports=mongoose.model("FuelLog",new mongoose.Schema({
    vehicle:{type:mongoose.Schema.Types.ObjectId,ref:"Vehicle",required:true},
    trip:{type:mongoose.Schema.Types.ObjectId,ref:"Trip"},
    liters:{type:Number,required:true},
    cost:{type:Number,required:true},
    date:{type:Date,default:Date.now}
},{timestamps:true}));