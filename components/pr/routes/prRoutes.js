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

//PR Status Change
routes.put(
  "/auth/status/approve",
  prController.checkIfApprover,
  prController.approvePr
);

routes.put(
  "/auth/status/decline",
  prController.checkIfApprover,
  prController.declinePr
);

routes.put(
  "/auth/status/pending",
  prController.checkIfApprover,
  prController.pendingPr
);

//fetch PRs

routes.get("/get/all", prController.fetchAllPr);

routes.get("/get/auth/all", prController.fetchAllPrWithAuth);

routes.get("/get/pr/:prid", prController.fetchPrByPrId);

routes.get("/get/auth/pr/:prid", prController.fetchPrByPrIdWithAuth);

routes.get("/get/approved/all", prController.fetchApprovedPr);

routes.get("/get/declined/all", prController.fetchDeclinedPr);

routes.get("/get/pending/all", prController.fetchPendingPr);

module.exports = routes;
