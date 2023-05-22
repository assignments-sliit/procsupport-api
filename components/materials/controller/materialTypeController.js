const mongoose = require("mongoose");
const MaterialType = require("../../materials/models/MaterialTypeSchema");

//CRUD
exports.addMaterialType = (req, res) => {
  const _id = new mongoose.Types.ObjectId();
  req.body._id = _id;
  const mt = new MaterialType(req.body);

  mt.save().then((createdmt) => {
    res.status(201).json({
      createdMaterialType: createdmt,
      code: "MATERIAL_TYPE_CREATED",
    });
  });
};

exports.deleteMaterialType = (req, res, next) => {
  MaterialType.findOne({
    materialTypeId: req.body.materialTypeId,
  })
    .exec()
    .then((foundMt) => {
      if (foundMt) {
        MaterialType.deleteOne({
          materialTypeId: req.body.materialTypeId,
        })
          .exec()
          .then(() => {
            res.status(204).json({
              message: "Material Type Deleted",
              code: "MATERIAL_TYPE_DELETED",
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

exports.getAllMaterialTypes = (req, res, next) => {
  MaterialType.find()
    .exec()
    .then((mtype) => {
      if (mtype.length < 1) {
        res.status(404).json({
          error: "No Material Type exists",
          code: "NO_MT_EXISTS",
        });
      } else {
        res.status(200).json({
          data: mtype,
          code: "MT_FOUND",
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

exports.getMaterialTypeById = (req, res, next) => {
  MaterialType.findOne({
    materialTypeId: req.params.materialTypeId,
  })
    .exec()
    .then((oneMt) => {
      if (oneMt) {
        res.status(200).json({
          data: oneMt,
          code: "MTFOUND",
        });
      } else {
        res.status(404).json({
          error: "Material Type does not exist",
          code: "NO_MT_EXISTS",
        });
      }
    });
};

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

    if (usertype && usertype == "ADMIN") {
      next();
    } else {
      res.status(409).json({
        error: "Access Denied. User not an Admin",
        code: "ACCESS_DENIED_USER_NOT_ADMIN",
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

exports.checkAccessForGet = (req, res, next) => {
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

    if (
      usertype &&
      ["ADMIN", "REQUESTOR", "PURCHASER", "RECEIVER"].includes(
        usertype.toUpperCase()
      )
    ) {
      next();
    } else {
      res.status(409).json({
        error: "Access Denied. User not an Admin",
        code: "ACCESS_DENIED_USER_NOT_ADMIN",
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

//check logic
exports.checkMaterialTypeExists = (req, res, next) => {
  const materialTypeId = req.body.materialTypeId || req.params.materialTypeId;
  MaterialType.findOne({
    materialTypeId: materialTypeId,
  })
    .exec()
    .then((foundMt) => {
      if (foundMt) {
        res.status(409).json({
          error: "The Material Type Exists",
          code: "MT_EXISTS",
        });
      } else {
        next();
      }
    });
};

//utils
exports.createNewId = (req, res, next) => {
  req.body.materialTypeId = "MATY" + Math.floor(Math.random() * 50000);

  if (req.body.materialTypeId) {
    next();
  }
};
