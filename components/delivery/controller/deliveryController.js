const mongoose = require("mongoose");
const PurchaseOrder = require("../../po/models/PurchaseOrder");

const Delivery = require("../models/DeliveryOrder");

exports.createDelivery = (req, res, next) => {
  const delid = "DEL" + Math.floor(Math.random() * 50000);

  req.body.deliveryId = delid;
  req.body._id = new mongoose.Types.ObjectId();

  const newdel = new Delivery(req.body);

  newdel
    .save()
    .then((createdDelivery) => {
      res.status(201).json({
        message: "New Delivery Order created",
        code: "NEW_DELIVERY_CREATED",
        createdDelivery: createdDelivery,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.setPaymentInfo = (req, res, next) => {
  PurchaseOrder.findOne({
    poid: req.body.poid,
  })
    .exec()
    .then((onePo) => {
      if (onePo) {
        req.body.amount = onePo.amount;
        if (!req.body.paymentMethod) {
          req.body.paymentMethod = "CASH";
          req.body.paymentStatus = "PENDING";
          next();
        }
        next();
      } else {
        res.status(404).json({
          error: "Purchase Order does not exist",
          code: "PURCHASE_ORDER_DOES_NOT_EXIST",
        });
      }
    });
};

exports.updateDeliveryOrder = (req, res, next) => {
  Delivery.findOne({
    deliveryId: req.params.deliveryId,
  })
    .exec()
    .then((foundDel) => {
      if (foundDel) {
        req.body.updatedOn = Date.now();
        Delivery.updateOne(
          {
            _id: foundDel._id,
          },
          req.body
        ).then((updatedPo) => {
          PurchaseOrder.findOne({
            _id: foundPo._id,
          })
            .exec()
            .then((updatedDelOrdBornAgain) => {
              res.status(200).json({
                updatedDeliveryOrder: updatedDelOrdBornAgain,
                code: "DELIVERY_ORDER_UPDATED",
              });
            });
        });
      } else {
        res.status(404).json({
          error: "No Delivery Order Found",
          code: "NO_DELIVERY_ORDER_FOUND",
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

exports.getAllDeliveryOrders = (req,res,next) =>{
  Delivery.find().exec().then((allorders)=>{
    if(allorders.length < 1){
      res.status(404).json({
        error: "No Delivery Order Found",
        code: "NO_DELIVERY_ORDER_FOUND",
      });
    }else {
      res.status(200).json({
        data: allorders,
        code: "DELIVERY_ORDERS_FOUND",
      });
    }
  }).catch((err)=>{
    res.status(500).json({
      error: err,
      code: "UNKNOWN_SERVER_ERROR",
    });
  })
}