const express = require("express");
const routes = express.Router();

const materialController = require("../controller/materialController");
const userController = require("../../auth/controller/userController");

routes.post(
  "/add", 
  userController.checkIfAdmin,
  materialController.checkMaterialExists,
  materialController.getMaterialTypeDetails,
  materialController.addMaterial);

routes.patch(
  "/qty/add",
  materialController.getMaterialQty,
  materialController.addQtyToMaterial
);

routes.patch(
  "/qty/remove",
  materialController.getMaterialQty,
  materialController.removeQtyToMaterial
);

module.exports = routes;
