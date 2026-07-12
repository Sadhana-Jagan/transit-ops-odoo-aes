const mongoose=require("mongoose");

module.exports=mongoose.model("Vehicle",new mongoose.Schema({
    registrationNumber:{type:String,required:true,unique:true,uppercase:true},
    vehicleName:{type:String,required:true},
    vehicleType:{type:String,enum:["Truck","Mini Truck","Van","Pickup","Container","Trailer"],required:true},
    maxLoadCapacity:{type:Number,required:true},
    odometer:{type:Number,default:0},
    acquisitionCost:{type:Number,required:true},
    status:{type:String,enum:["Available","OnTrip","InShop","Retired"],default:"Available"},
    region:{type:String,default:"Default"}
},{timestamps:true}));