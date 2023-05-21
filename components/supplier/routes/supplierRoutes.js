const express = require("express");
const routes = express.Router();

const supplierController = require("../controller/supplierController");

//create supplier
routes.post(
  "/create",
  supplierController.checkIfUserAdmin,
  supplierController.createSupplier
);

//delete single user
routes.delete(
  "/delete",
  supplierController.checkIfUserAdmin,
  supplierController.deleteSupplier
);

//fetch all suppliers
routes.get(
  "/get/all",
  supplierController.checkIfUserAdmin,
  supplierController.getAllSuppliers
);

routes.get(
  "/get/one/:supplierUsername",
  supplierController.checkIfUserAdmin,
  supplierController.getSingleSupplier
);

routes.post("/login",supplierController.supplierLogin)

routes.put("/auth/update/:supplierUsername", 
supplierController.checkIfUserAdmin,
supplierController.updateSupplierDetails)
module.exports = routes;
