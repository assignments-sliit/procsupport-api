const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const supplierSchema = new Schema({
    _id: mongoose.Types.ObjectId,
    supplierUsername:{
        index:true,
        unique: true,
        type:String,
        required:true
    },
    supplierUserPassword:{
        required: true,
        type: String,
    },
    supplierName:{
        type: String,
        required: true
    },
    mainSupply:{
        required: true,
        type: String
    },
    address:{
        required: true,
        type: String
    },
    contactPersonName:{
        requied:true,
        type: String
    },
    contactNumber:{
        required: true,
        type: String
    }

})

module.exports = mongoose.model("Supplier", supplierSchema);