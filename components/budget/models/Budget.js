const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BudgetSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  amount: {
    type: Number,
    required: true,
  },
  currency:{
    type:String,
    required:true,
    default:'LKR'
  }

});

module.exports = mongoose.model("Budget",BudgetSchema)