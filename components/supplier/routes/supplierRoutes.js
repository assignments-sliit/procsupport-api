const express = require("express");
const routes = express.Router();

const suppierController = require("../controller/supplierController");

//create supplier
routes.post(
  "/create",
  suppierController.checkIfUserAdmin,
  suppierController.createSupplier
);

//delete single user
routes.delete(
  "/delete",
  suppierController.checkIfUserAdmin,
  suppierController.deleteSupplier
);

//fetch all suppliers
routes.get(
  "/get/all",
  suppierController.checkIfUserAdmin,
  suppierController.getAllSuppliers
);

routes.get(
  "/get/one/:supplierUsername",
  suppierController.checkIfUserAdmin,
  suppierController.getSingleSupplier
);

routes.post("/login",suppierController.supplierLogin)
module.exports = routes;
