const mongoose = require("mongoose");

const PurchaseRequest = require("../models/PurchaseRequest");

const moment = require("moment");

exports.checkPrExists = (req, res, next) => {
  const prid = "PR" + Math.floor(Math.random() * 50000);
  PurchaseRequest.findOne({
    prid: prid,
  })
    .exec()
    .then((foundPr) => {
      if (foundPr) {
        res.status(409).json({
          error: "The Purchase Request Exists",
          code: "PR_EXISTS",
        });
      } else {
        req.body.prid = prid;
        next();
      }
    });
};

exports.checkUserAndAccess = (req, res, next) => {
  const header = req.headers["authorization"];

  const token = header && header.split(" ")[1];

  let usertype = "";

  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "id") {
        req.body.currentUserId = entry[1].toString();
      }

      if (entry[0] == "usertype") {
        usertype = entry[1].toString();
      }
    });

    if (usertype && usertype == "REQUESTOR") {
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

exports.currentUserHasAccessToThePr = (req, res, next) => {
  PurchaseRequest.findOne({ prid: req.params.prid || req.body.prid })
    .exec()
    .then((foundPr) => {
      if (foundPr.createdBy == req.body.currentUserId) {
        next();
      } else {
        res.status(409).json({
          error: "You don't have access to the Purchase Request",
          code: "NO_ACCESS_TO_PR",
        });
      }
    });
};

exports.createPurchaseRequest = (req, res) => {
  const { prid, prName, description, currentUserId } = req.body;

  const newPr = new PurchaseRequest({
    _id: new mongoose.Types.ObjectId(),
    prid: prid,
    prName: prName,
    description: description,
    createdBy: currentUserId,
  });

  newPr
    .save()
    .then((createdPr) => {
      res.status(201).json({
        message: "New Purchase Request created",
        code: "NEW_PR_CREATED",
        createdPr: createdPr,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.fetchAllPrNoAuth = (req, res, next) => {
  PurchaseRequest.find()
    .exec()
    .then((allPrs) => {
      if (allPrs.length < 0) {
        res.status(404).json({
          error: "No Purchase Request exists",
          code: "NO_PR_EXISTS",
        });
      } else {
        res.status(200).json({
          purchase_requests: allPrs,
          code: "PR_FOUND",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
        code: "UNKNOWN_SERVER_ERROR",
      });
    });
};

exports.updateOnePrByPrId = (req, res, next) => {
  const update = req.body;
  PurchaseRequest.findOneAndUpdate(
    {
      prid: req.params.prid,
    },
    update,
    { returnOriginal: false }
  )
    .then((updatedPr) => {
      res.status(200).json({
        updated_record: updatedPr,
        code: "PR_MODIFIED",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: error,
        code: "UNKNOWN_SERVER_ERROR",
      });
    });
};
