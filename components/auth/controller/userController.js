const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../../config/keys.json");
const JWT_KEY = keys.JWT_KEY;
const Users = require("../models/User");

//middleware pattern

exports.createUser = (req, res, next) => {
  Users.findOne({
    username: req.body.username,
  })
    .exec()
    .then((user) => {
      if (user) {
        res.status(409).json({
          message: "User already exists",
          error: "User already exists",
          code: "USER_EXISTS",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
              code: "UNKNOWN_ERROR",
            });
          } else {
            const id = new mongoose.Types.ObjectId();
            req.body._id = id;
            req.body.password = hash;
            const newUser = new Users(req.body);

            newUser
              .save()
              .then((result) => {
                res.status(201).json({
                  message: "User created",
                  createdUser: result,
                  code: "USER_CREATED",
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

exports.getUserByUsername = (req, res) => {
  const username = req.params.username;

  Users.findOne({
    username: username,
  })
    .exec()
    .then((user) => {
      if (user) {
        res.status(200).json({
          message: "User found",
          user: user,
          code: "USER_FOUND",
        });
      }

      if (!user) {
        res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
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

exports.login = (req, res) => {
  const { username, password } = req.body;

  Users.findOne({
    username: username,
  })
    .exec()
    .then((foundUser) => {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, (err, result) => {
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
                username: foundUser.username,
                usertype: foundUser.usertype,
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
                usertype: foundUser.usertype,
              },
              code: "AUTH_SUCCESS",
            });
          }
          res.status(401).json({
            error: "Authorization Failed!",
            code: "AUTH_FAILED",
          });
        });
      } else {
        res.status(404).json({
          error: "User not found!",
          code: "USER_NOT_FOUND",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.deleteUser = (req, res) => {
  Users.deleteOne({
    username: req.body.username,
  })
    .then((deleted) => {
      res.status(200).json({
        message: "User Deleted",
        code: "USER_DELETED",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.getUserType = (req, res) => {
  Users.findOne({
    username: req.params.username,
  })
    .exec()
    .then((foundUser) => {
      if (foundUser) {
        res.status(200).json({
          message: "User type",
          usertype: foundUser.usertype.toString().toUpperCase(),
          code: "USER_TYPE",
        });
      }
    });
};

exports.getUserTypeFromToken = (req, res) => {
  const token = req.body.token;

  if (token) {
    const json = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "usertype") {
        res.status(200).json({
          message: "User type",
          json: entry[1],
          code: "USER_TYPE",
        });
      }
    });
  }
};

exports.checkUserType = (req, res) => {
  const { username, usertype } = req.body;
  Users.findOne({
    username: username,
  })
    .exec()
    .then((foundUser) => {
      if (foundUser) {
        if (foundUser.usertype == usertype.toString().toUpperCase()) {
          res.status(200).json({
            message: "User type matches",
            usertype: foundUser.usertype.toString().toUpperCase(),
            code: "USER_TYPE_MATCH",
          });
        } else {
          res.status(401).json({
            message: "User type mismatch",
            code: "USER_TYPE_MISMATCH",
          });
        }
      }
    });
};

exports.getAllUsersForAdmin = (req, res) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");

    const token = bearer[1];
    console.log(token);
    req.token = token;
  }

  if (req.token) {
    const json = JSON.parse(
      Buffer.from(req.token.split(".")[1], "base64").toString()
    );

    Object.entries(json).map((entry) => {
      if (entry[0] == "usertype") {
        userType = entry[1];
      }
    });
  }

  if (userType == "ADMIN") {
    Users.find({
      usertype: { $ne: "ADMIN" },
    })
      .exec()
      .then((user) => {
        if (user) {
          res.status(200).json({
            message: "Users found",
            users: user,
            code: "USER_FOUND",
          });
        }

        if (!user) {
          res.status(404).json({
            message: "User not found",
            code: "USER_NOT_FOUND",
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          code: "UNKNOWN_ERROR",
        });
      });
  } else {
    res.status(401).json({
      message: "Unauthorized access. Current User is not an Admin",
      code: "UNAUTHORIZED_USER_NOT_ADMIN",
    });
  }
};

//check authentication
exports.checkIfAdmin = (req, res, next) => {
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