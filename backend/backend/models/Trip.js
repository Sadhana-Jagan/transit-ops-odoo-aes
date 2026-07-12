const mongoose=require("mongoose");

module.exports=mongoose.model("Trip",new mongoose.Schema({
    source:{type:String,required:true},
    destination:{type:String,required:true},
    vehicle:{type:mongoose.Schema.Types.ObjectId,ref:"Vehicle",required:true},
    driver:{type:mongoose.Schema.Types.ObjectId,ref:"Driver",required:true},
    cargoWeight:{type:Number,required:true},
    plannedDistance:{type:Number,required:true},
    actualDistance:{type:Number,default:0},
    revenue:{type:Number,default:0},
    fuelConsumed:{type:Number,default:0},
    finalOdometer:{type:Number,default:0},
    status:{type:String,enum:["Draft","Dispatched","Completed","Cancelled"],default:"Draft"},
    dispatchTime:Date,
    completionTime:Date
},{timestamps:true}));