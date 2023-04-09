const express = require("express");
const routes = express.Router();

const prController = require("../controllers/purchaseRequestController");

//create purchase request
routes.post(
  "/create",
  prController.checkPrExists,
  prController.checkUserAndAccess,
  prController.createPurchaseRequest
);

routes.get("/get/all", prController.fetchAllPrNoAuth);

module.exports = routes;
