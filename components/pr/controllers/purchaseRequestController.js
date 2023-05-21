const mongoose = require("mongoose");

const PurchaseRequest = require("../models/PurchaseRequest");
const Material = require("../../materials/models/MaterialSchema");
const MaterialType = require("../../materials/models/MaterialTypeSchema");
const MaterialRequirement = require("../models/MaterialRequirement");

//Check Auth
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

    if (usertype && usertype == "REQUESTOR") {
      next();
    } else {
      res.status(409).json({
        error: "Access Denied. User not Requestor",
        code: "ACCESS_DENIED_USER_NOT_REQUESTOR",
      });
    }
  }
  //cannot find token
  else {
    res.status(401).json({
      error: "Cannot find auth token",
      code: "AUTH_TOKEN_NOT_FOUND",
    });
  }
};

exports.checkIfApprover = (req, res, next) => {
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

    if (usertype && usertype == "APPROVER") {
      next();
    } else {
      res.status(409).json({
        error: "Access Denied. User is not Approver",
        code: "ACCESS_DENIED_NOT_APPROVER",
      });
    }
  }
  //cannot find token
  else {
    res.status(401).json({
      error: "Cannot find auth token",
      code: "AUTH_TOKEN_NOT_FOUND",
    });
  }
};

//Create
exports.createPurchaseRequest = (req, res) => {
  req.body._id = new mongoose.Types.ObjectId();
  const newPr = new PurchaseRequest(req.body);

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

exports.addMaterialRequirement = (req, res, next) => {
  const reqid = "MAR" + +Math.floor(Math.random() * 50000);
  req.body.reqid = reqid;

  const _id = new mongoose.Types.ObjectId();
  req.body._id = _id;

  const materialRequirement = new MaterialRequirement(req.body);

  materialRequirement.save().then((createdMr) => {
    res.status(201).json({
      createdMr: createdMr,
    });
  });
};

//check logics
exports.checkMaterial = (req, res, next) => {
  const material = req.body.materialId;

  Material.findOne({
    materialId: material,
  })
    .exec()
    .then((foundMaterial) => {
      if (foundMaterial) {
        req.body.material = foundMaterial.materialId;
        next();
      } else {
        res.status(404).json({
          error: "Material does not exist",
          code: "MATERIAL_DOES_NOT_EXIST",
        });
      }
    });
};

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
// exports.checkMaterialType = (req, res, next) => {
//   const materialType = req.body.materialTypeId;

//   MaterialType.findOne({
//     materialId: materialType,
//   })
//     .exec()
//     .then((foundMaterialType) => {
//       if (foundMaterialType) {
//         req.body.materialType = foundMaterialType.materialType;
//         next();
//       } else {
//         res.status(404).json({
//           error: "Material Type does not exist",
//           code: "MATERIAL_TYPE_DOES_NOT_EXIST",
//         });
//       }
//     });
// };

//Status Change
exports.approvePr = (req, res, next) => {
  PurchaseRequest.findOne({
    prid: req.body.prid,
  })
    .exec()
    .then((pr) => {
      if (pr.status == "APPROVED") {
        res.status(409).json({
          error: "The Purchase Request is already Approved",
          code: "PR_ALREADY_APPROVED",
        });
      } else if (pr.status == "DECLINED") {
        res.status(405).json({
          error: "A Declined Purchase Request cannot be Approved",
          code: "CANNOT_APPROVE_DECLINED_PR",
        });
      } else {
        PurchaseRequest.findOneAndUpdate(
          {
            prid: req.body.prid,
          },
          {
            status: "APPROVED",
          }
        )
          .exec()
          .then(() => {
            PurchaseRequest.findOne({
              prid: req.body.prid,
            }).then((approvedPr) => {
              res.status(200).json({
                approvedPr: approvedPr,
              });
            });
          });
      }
    });
};

exports.declinePr = (req, res, next) => {
  PurchaseRequest.findOne({
    prid: req.body.prid,
  })
    .exec()
    .then((pr) => {
      if (pr.status == "DECLINED") {
        res.status(409).json({
          error: "The Purchase Request is already Declined",
          code: "PR_ALREADY_DECLINED",
        });
      } else if (pr.status == "PENDING") {
        res.status(405).json({
          error: "A Pending Purchase Request cannot be Declined",
          code: "CANNOT_DECLINE_PENDING_PR",
        });
      } else {
        PurchaseRequest.findOneAndUpdate(
          {
            prid: req.body.prid,
          },
          {
            status: "DECLINED",
          }
        )
          .exec()
          .then(() => {
            PurchaseRequest.findOne({
              prid: req.body.prid,
            }).then((pendingPr) => {
              res.status(200).json({
                pendingPr: pendingPr,
              });
            });
          });
      }
    });
};

exports.pendingPr = (req, res, next) => {
  PurchaseRequest.findOne({
    prid: req.body.prid,
  })
    .exec()
    .then((pr) => {
      if (pr.status == "PENDING") {
        res.status(409).json({
          error: "The Purchase Request is already Pending",
          code: "PR_ALREADY_PENDING",
        });
      } else if (pr.status == "DECLINED") {
        res.status(405).json({
          error: "A Declined Purchase Request cannot be set to Pending",
          code: "CANNOT_PEND_DECLINED_PR",
        });
      } else {
        PurchaseRequest.findOneAndUpdate(
          {
            prid: req.body.prid,
          },
          {
            status: "PENDING",
          }
        )
          .exec()
          .then(() => {
            PurchaseRequest.findOne({
              prid: req.body.prid,
            }).then((pendingPr) => {
              res.status(200).json({
                pendingPr: pendingPr,
              });
            });
          });
      }
    });
};

// Fetch PRs
exports.fetchAllPr = (req, res, next) => {
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

exports.fetchAllPrWithAuth = (req, res, next) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");

    const token = bearer[1];
    console.log(token);
    req.token = token;
  }
  let _id;

  if (req.token) {
    const json = JSON.parse(
      Buffer.from(req.token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "id") {
        _id = entry[1];
      }
    });

    PurchaseRequest.find({ createdBy: mongoose.Types.ObjectId(_id) })
      .exec()
      .then((allPrs) => {
        if (allPrs.length < 0) {
          res.status(404).json({
            error: "No Purchase Requests exist",
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
  }
};
exports.fetchPrByPrId = (req, res, next) => {
  PurchaseRequest.findOne({
    prid: req.params.prid,
  })
    .exec()
    .then((singlePr) => {
      if (singlePr) {
        res.status(200).json({
          purchase_request: singlePr,
          code: "SINGLE_PR_FOUND",
        });
      } else {
        res.status(404).json({
          error: "Purchase Request does not exist",
          code: "NO_PR_EXISTS",
        });
      }
    });
};

exports.fetchPrByPrIdWithAuth = (req, res, next) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");

    const token = bearer[1];
    console.log(token);
    req.token = token;
  }

  let _id;

  if (req.token) {
    const json = JSON.parse(
      Buffer.from(req.token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "id") {
        _id = entry[1];
      }
    });

    PurchaseRequest.findOne({
      prid: req.params.prid,
      createdBy: mongoose.Types.ObjectId(_id),
    })
      .exec()
      .then((singlePr) => {
        if (singlePr) {
          console.log(singlePr);
          res.status(200).json({
            purchase_request: singlePr,
            code: "SINGLE_PR_FOUND",
          });
        } else {
          res.status(404).json({
            error: "Purchase Request does not exist",
            code: "NO_PR_EXISTS",
          });
        }
      });
  }
};

exports.fetchApprovedPr = (req, res, next) => {
  PurchaseRequest.find({
    status: "APPROVED",
  })
    .exec()
    .then((approvedPr) => {
      if (approvedPr.length > 0) {
        res.status(200).json({
          data: approvedPr,
          code: "APPROVED_PR_FOUND",
        });
      } else {
        res.status(404).json({
          error: "No Approved Purchase Request Found",
          code: "NO_APPROVED_PR",
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

exports.fetchDeclinedPr = (req, res, next) => {
  PurchaseRequest.find({
    status: "DECLINED",
  })
    .exec()
    .then((declinedPr) => {
      if (declinedPr.length > 0) {
        res.status(200).json({
          data: declinedPr,
          code: "DECLINED_PR_FOUND",
        });
      } else {
        res.status(404).json({
          error: "No Declined Purchase Request Found",
          code: "NO_DECLINED_PR",
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

exports.fetchPendingPr = (req, res, next) => {
  PurchaseRequest.find({
    status: "PENDING",
  })
    .exec()
    .then((pendingPr) => {
      if (pendingPr.length > 0) {
        res.status(200).json({
          data: pendingPr,
          code: "PENDING_PR_FOUND",
        });
      } else {
        res.status(404).json({
          error: "No Pending Purchase Request found",
          code: "NO_PENDING_PR",
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
