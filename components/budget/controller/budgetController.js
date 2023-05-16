const mongoose = require("mongoose");

const Budget = require("../models/Budget");


//create or update budget
exports.createBudget = (req, res) => {
  Budget.find()
    .exec()
    .then((item) => {
      if (item.length > 0) {
        let amount = item[0].amount + req.body.amount;

        Budget.findOneAndUpdate(
          {
            _id: item[0]._id,
          },
          {
            amount: amount,
          }
        ).then((updatedBudget) => {
          Budget.findOne({
            _id: updatedBudget._id,
          })
            .exec()
            .then((updatedBudgetBornAgain) => {
              res.status(200).json({
                message: "Budget Updated",
                totalAmount: updatedBudgetBornAgain.amount,
                code: "BUDGET_UPDATED",
              });
            });
        });
      } else {
        const id = new mongoose.Types.ObjectId();
        req.body._id = id;
        const budget = new Budget(req.body);

        budget
          .save()
          .then((result) => {
            res.status(201).json({
              message: "Budget created",
              createdBudget: result,
              code: "BUDGET_CREATED",
            });
          })
          .catch((err) => {
            res.status(500).json({
              error: err,
              code: "UNKNOWN_ERROR",
            });
          });
      }
    });
};

//get entire budget
exports.getEntireBudget = (req, res) => {
  let budget = 0;
  Budget.find()
    .exec()
    .then((allBudgetObjects) => {
      if (allBudgetObjects.length > 0) {
        allBudgetObjects.map((singleObject) => {
          budget = budget + parseInt(singleObject.amount);
        });

        res.status(200).json({
          amount: budget,
          currency: "LKR",
          code: "ENTIRE_BUDGET",
        });
      }
    });
};


