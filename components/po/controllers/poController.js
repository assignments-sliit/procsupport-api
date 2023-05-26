const mongoose = require("mongoose");

const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseRequest = require("../../pr/models/PurchaseRequest");

const Budget = require("../../budget/models/Budget");

exports.checkPoExists = (req, res, next) => {
  const poid = "PO" + Math.floor(Math.random() * 50000);
  PurchaseOrder.findOne({
    poid: poid,
  })
    .exec()
    .then((poObject) => {
      if (poObject) {
        res.status(409).json({
          error: "Purchase Order already exists",
          code: "PURCHASE_ORDER_EXISTS",
        });
      } else {
        req.body.poid = poid;
        next();
      }
    });
};

exports.checkUserAndAccess = (req, res, next) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");

    const token = bearer[1];

    req.token = token;
  }

  let usertype = "";
  const token = req.token;
  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "id") {
        req.body.createdBy = entry[1].toString();
      }

      if (entry[0] == "usertype") {
        usertype = entry[1].toString();
      }
    });

    if (usertype && usertype == "PURCHASER") {
      next();
    } else {
      res.status(409).json({
        error: "Access Denied",
        code: "ACCESS_DENIED",
      });
    }
  }
  //cannot find token
  else {
    res.status(409).json({
      error: "Cannot find auth token",
      code: "AUTH_TOKEN_NOT_FOUND",
    });
  }
};

exports.getAmount = (req, res, next) => {
  PurchaseRequest.findOne({
    prid: req.body.prid,
  })
    .exec()
    .then((foundPr) => {
      if (foundPr) {
        req.body.amount = foundPr.amount;
        next();
      } else {
        res.status(404).json({
          error: "Purchase Request not found",
          code: "PR_NOT_FOUND",
        });
      }
    });
};

exports.createPo = (req, res, next) => {
  const { poid, supplierId, description, amount, createdBy, prid } = req.body;

  const newPo = new PurchaseOrder({
    _id: new mongoose.Types.ObjectId(),
    poid: poid,
    supplierId: supplierId,
    description: description,
    createdBy: createdBy,
    amount: amount,
    prid: prid,
  });

  newPo
    .save()
    .then((createdPo) => {
      res.status(201).json({
        message: "New Purchase Order created",
        code: "NEW_PO_CREATED",
        createdPo: createdPo,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.fetchAllPos = (req, res, next) => {
  PurchaseOrder.find()
    .exec()
    .then((allPos) => {
      if (allPos.length > 0) {
        res.status(200).json({
          message: "All Purchase Orders",
          code: "ALL_PURCHASE_ORDERS",
          response: allPos,
        });
      } else {
        res.status(404).json({
          error: "No Purchase Orders",
          code: "NO_PURCHASE_ORDERS",
        });
      }
    });
};

//status

exports.approvePo = (req, res, next) => {
  PurchaseOrder.findOneAndUpdate(
    {
      poid: req.body.poid,
    },
    {
      status: "APPROVED",
    }
  )
    .exec()
    .then(() => {
      PurchaseOrder.findOne({
        poid: req.body.poid,
      }).then((approvedPo) => {
        res.status(200).json({
          approvedPo: approvedPo,
        });
      });
    });
};

exports.rejectPo = (req, res, next) => {
  PurchaseOrder.findOneAndUpdate(
    {
      poid: req.body.poid,
    },
    {
      status: "REJECTED",
    }
  )
    .exec()
    .then(() => {
      PurchaseOrder.findOne({
        poid: req.body.poid,
      }).then((rejectedPo) => {
        res.status(200).json({
          rejectedPo: rejectedPo,
        });
      });
    });
};

//check budget
exports.checkBudgetBeforePoInvoice = (req, res, next) => {
  let budget = 0;
  Budget.find()
    .exec()
    .then((allBudgetObjects) => {
      if (allBudgetObjects.length > 0) {
        allBudgetObjects.map((singleObject) => {
          budget = budget + parseInt(singleObject.amount);
        });

        PurchaseOrder.findOne({
          poid: req.body.poid,
        }).then((po) => {
          if (po) {
            if (budget == 0) {
              res.status(200).json({
                error: "No Budget to Invoice this Purchase Order",
                code: "NO_BUDGET_FOR_PO",
              });
            }
            if (po.amount > budget) {
              res.status(200).json({
                error: "Insufficient Budget to Invoice this Purchase Order",
                code: "INSUFFICIENT_BUDGET_FOR_PO",
              });
            } else {
              next();
            }
          } else {
            res.status(404).json({
              error: "No Purchase Orders found",
              code: "NO_PURCHASE_ORDERS_FOUND",
            });
          }
        });
      }
    });
};

exports.invoicePo = (req, res, next) => {
  PurchaseOrder.findOneAndUpdate(
    {
      poid: req.body.poid,
    },
    {
      status: "INVOICED",
    }
  )
    .exec()
    .then((po) => {
      req.body.amount = po.amount;
      next();
    });
};

exports.deductBudgetAfterInvoicePo = (req, res, next) => {
  let budget = 0;
  Budget.find()
    .exec()
    .then((allBudgetObjects) => {
      if (allBudgetObjects.length > 0) {
        allBudgetObjects.map((singleObject) => {
          budget = budget + parseInt(singleObject.amount);
        });

        if (budget > 0) {
          budget = budget - req.body.amount;
        }

        Budget.findOneAndUpdate(
          {
            _id: allBudgetObjects[0]._id,
          },
          {
            amount: budget,
          }
        ).then(() => {
          PurchaseOrder.findOne({
            poid: req.body.poid,
          }).then((invoicedPo) => {
            res.status(200).json({
              invoicedPo: invoicedPo,
            });
          });
        });

        // res.status(200).json({
        //   amount: budget,
        //   currency: "LKR",
        //   code: "ENTIRE_BUDGET",
        // });
      }
    });
};

exports.fetchAllApprovedPos = (req, res, next) => {
  PurchaseOrder.find({
    status: "APPROVED",
  })
    .exec()
    .then((allapprovedPo) => {
      if (allapprovedPo.length > 0) {
        res.status(200).json({
          message: "All Approved Purchase Orders",
          code: "ALL_APPROVED_PURCHASE_ORDERS",
          response: allapprovedPo,
        });
      } else {
        res.status(404).json({
          error: "No Approved Purchase Orders",
          code: "NO_APPROVED_PURCHASE_ORDERS",
        });
      }
    });
};

exports.fetchAllPendingPos = (req, res, next) => {
  PurchaseOrder.find({
    status: "PENDING",
  })
    .exec()
    .then((allpendingPo) => {
      if (allpendingPo.length > 0) {
        res.status(200).json({
          message: "All Pending Purchase Orders",
          code: "ALL_PENDING_PURCHASE_ORDERS",
          response: allpendingPo,
        });
      } else {
        res.status(404).json({
          error: "No Pending Purchase Orders",
          code: "NO_PENDING_PURCHASE_ORDERS",
        });
      }
    });
};

exports.fetchAllRejectedPos = (req, res, next) => {
  PurchaseOrder.find({
    status: "REJECTED",
  })
    .exec()
    .then((allRejectedPo) => {
      if (allRejectedPo.length > 0) {
        res.status(200).json({
          message: "All REJECTED Purchase Orders",
          code: "ALL_REJECTED_PURCHASE_ORDERS",
          response: allRejectedPo,
        });
      } else {
        res.status(404).json({
          error: "No Rejected Purchase Orders",
          code: "NO_REJECTED_PURCHASE_ORDERS",
        });
      }
    });
};

exports.fetchAllInvoicedPos = (req, res, next) => {
  PurchaseOrder.find({
    status: "INVOICED",
  })
    .exec()
    .then((invoicedPo) => {
      if (invoicedPo.length > 0) {
        res.status(200).json({
          message: "All Invoiced Purchase Orders",
          code: "ALL_INVOICED_PURCHASE_ORDERS",
          response: invoicedPo,
        });
      } else {
        res.status(404).json({
          error: "No Invoiced Purchase Orders",
          code: "NO_INVOICED_PURCHASE_ORDERS",
        });
      }
    });
};

exports.fetchAllDeliveredPos = (req, res, next) => {
  PurchaseOrder.find({
    status: "DELIVERED",
  })
    .exec()
    .then((deliveredPo) => {
      if (deliveredPo.length > 0) {
        res.status(200).json({
          message: "All Delivered Purchase Orders",
          code: "ALL_DELIVERED_PURCHASE_ORDERS",
          response: deliveredPo,
        });
      } else {
        res.status(404).json({
          error: "No Delivered Purchase Orders",
          code: "NO_DELIVERED_PURCHASE_ORDERS",
        });
      }
    });
};

exports.updatePo = (req, res, next) => {
  PurchaseOrder.findOne({
    poid: req.params.poid,
  })
    .exec()
    .then((foundPo) => {
      if (foundPo) {
        req.body.updatedOn = Date.now()
        PurchaseOrder.updateOne(
          {
            _id: foundPo._id,
          },
          req.body
        ).then((updatedPo) => {
          PurchaseOrder.findOne({
            _id: foundPo._id,
          })
            .exec()
            .then((updatedPoBornAgain) => {
              res.status(200).json({
                updatedPurchaseOrder: updatedPoBornAgain,
                code: "PURCHASE_ORDER_UPDATED",
              });
            });
        });
      } else {
        res.status(404).json({
          error: "No Purchase Order Found",
          code: "NO_PURCHASE_ORDER_FOUND",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_SERVER_ERROR",
      });
    });
};

exports.fetchOnePo = (req, res, next) => {
  PurchaseOrder.findOne({
    poid: req.params.poid,
  })
    .exec()
    .then((foundPo) => {
      if (foundPo) {
        res.status(200).json({
          po: foundPo,
          code: "PURCHASE_ORDER_FOUND",
        });
      } else {
        res.status(404).json({
          error: "No Purchase Order Found",
          code: "NO_PURCHASE_ORDER_FOUND",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_SERVER_ERROR",
      });
    });
};

exports.deleteOnePo = (req,res,next)=>{
  PurchaseOrder.findOne({
    poid:req.params.poid
  }).exec().then((foundPo)=>{
    if(foundPo.status == "APPROVED" || foundPo.status == "DELIVERED" || foundPo.status == "INVOICED"){
        res.status(403).json({
            error:"Cannot delete Purchase Order which is Approved, Delivered or Invoiced",
            code:"CANNOT_DELETE_PO"
        })
    }else{
        PurchaseOrder.deleteOne({
            poid:req.params.poid
        }).exec().then(()=>{
            res.status(204).json({
                message:"PO Deleted",
                code:"PO_DELETED"
            })
        })
    }
  })
}

exports.validatePoForDeliveryOrder = (req, res, next) => {
 
  PurchaseOrder.findOne({
    poid: req.body.poid,
  })
    .exec()
    .then((poObject) => {
      if (poObject) {
        next()
       
      } else {
        res.status(404).json({
          error: "Purchase Order does not exist",
          code: "PURCHASE_ORDER_DOES_NOT_EXIST"
        });
      }
    });
};

