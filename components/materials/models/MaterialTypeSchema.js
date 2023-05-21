const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const MaterialTypeSchema = new Schema({

    _id: mongoose.Types.ObjectId,
    materialTypeId:{
        type: String,
        unique:true,
        required: true
    },
    materialType:{
        type:String,
        required:true,
    },
    uom:{
        type: String,
        required: true
    }
    
})

module.exports = mongoose.model("Material Type",MaterialTypeSchema)