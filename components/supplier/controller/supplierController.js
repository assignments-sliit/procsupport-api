const mongoose = require("mongoose");

const Supplier = require("../models/Supplier");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../../config/keys.json");
const JWT_KEY = keys.JWT_KEY;

exports.createSupplier = (req, res, next) => {
  Supplier.findOne({
    supplierUsername: req.body.supplierUsername,
  })
    .exec()
    .then((supplier) => {
      if (supplier) {
        res.status(409).json({
          message: "Supplier already exists",
          error: "Supplier already exists",
          code: "SUPPLIER_EXISTS",
        });
      } else {
        bcrypt.hash(req.body.supplierUserPassword, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
              code: "UNKNOWN_ERROR",
            });
          } else {
            req.body._id = new mongoose.Types.ObjectId();
            req.body.supplierUserPassword = hash;
            const newSupplier = new Supplier(req.body);

            newSupplier
              .save()
              .then((result) => {
                res.status(201).json({
                  message: "Supplier created",
                  record: result,
                  code: "SUPPLIER_CREATED",
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
      }
    });
};

exports.deleteSupplier = (req, res, next) => {
  Supplier.deleteOne({
    supplierUsername: req.body.supplierUsername,
  })
    .then((deleted) => {
      res.status(200).json({
        message: "Supplier Deleted",
        code: "SUPPLIER_DELETED",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.getAllSuppliers = (req, res) => {
  Supplier.find()
    .exec()
    .then((allSuppliers) => {
      if (allSuppliers.length > 0) {
        res.status(200).json({
          message: "All Suppliers",
          records: allSuppliers,
          code: "SUPPLIERS_FOUND",
        });
      } else {
        res.status(404).json({
          message: "No Suppliers found.",
          code: "NO_SUPPLIERS_FOUND",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.getSingleSupplier = (req, res, next) => {
  Supplier.findOne({
    supplierUsername: req.params.supplierUsername,
  })
    .exec()
    .then((singleSupplier) => {
      if (singleSupplier) {
        res.status(200).json({
          message: "Supplier found",
          record: singleSupplier,
          code: "SUPPLIER_FOUND",
        });
      } else {
        res.status(404).json({
          message: "No Supplier found.",
          code: "NO_SUPPLIER_FOUND",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.checkIfUserAdmin = (req, res, next) => {
  const token = req.body.token;
  let userType = "";

  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "usertype") {
        userType = entry[1];
      }
    });
  }

  if (userType == "ADMIN") {
    req.usertype = userType;
    next();
  } else {
    res.status(401).json({
      message: "Unauthorized access. Current User is not an Admin",
      code: "UNAUTHORIZED_USER_NOT_ADMIN",
    });
  }
};

exports.supplierLogin = (req, res) => {
  const { supplierUsername, supplierUserPassword } = req.body;

  Supplier.findOne({
    supplierUsername: supplierUsername,
  })
    .exec()
    .then((foundUser) => {
      if (foundUser) {
        bcrypt.compare(
          supplierUserPassword,
          foundUser.supplierUserPassword,
          (err, result) => {
            if (err) {
              return res.status(401).json({
                error: "Incorrect Password",
                code: "INCORRECT_PASSWORD",
              });
            }

            if (result) {
              //correct password
              const token = jwt.sign(
                {
                  id: foundUser._id,
                  username: foundUser.supplierUsername,
                  usertype: "SUPPLIER",
                },
                JWT_KEY,
                {
                  expiresIn: "24h",
                }
              );

              return res.status(200).json({
                message: "Authorization Success",
                data: {
                  token: token,
                  usertype: "SUPPLIER",
                },
                code: "AUTH_SUCCESS",
              });
            }
            res.status(401).json({
              error: "Authorization Failed!",
              code: "AUTH_FAILED",
            });
          }
        );
      } else {
        res.status(404).json({
          error: "Supplier not found!",
          code: "SUPPLIER_NOT_FOUND",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.checkIfSupplier = (req, res, next) => {
  const token = req.body.token;
  let userType = "";

  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "usertype") {
        userType = entry[1];
      }
    });
  }

  if (userType == "SUPPLIER") {
    req.usertype = userType;
    next();
  } else {
    res.status(401).json({
      message: "Unauthorized access. Current User is not a Supplier",
      code: "UNAUTHORIZED_USER_NOT_SUPPLIER",
    });
  }
};

exports.getSupplierUid = (req, res, next) => {
  const token = req.body.token;
  let _id = "";

  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "id") {
        _id = entry[1];
      }
    });
  }

  if (_id) {
    req.body.supplierUid = _id;
  } else {
    res.status(401).json({
      message: "User token corrupted",
      code: "SUPPLIER_TOKEN_CORRUPTED",
    });
  }
};
