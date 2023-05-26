const express = require("express");
const routes = express.Router();

const delController = require("../controller/deliveryController");
const { checkIfReceiver } = require("../../auth/controller/userController");
const {  validatePoForDeliveryOrder } = require("../../po/controllers/poController");
const { validateSupplierForDeliveryOrder } = require("../../supplier/controller/supplierController");

routes.post(
    "/create",
    checkIfReceiver,
    validatePoForDeliveryOrder,
    validateSupplierForDeliveryOrder,
    delController.setPaymentInfo,
    delController.createDelivery,
  );


routes.put(
  "/update/:deliveryId",
  checkIfReceiver,
  delController.updateDeliveryOrder
)

routes.get(
  "/get/all",
  delController.getAllDeliveryOrders

)
module.exports = routes;