const express = require("express");
const routes = express.Router();

const materialTypeController = require('../controller/materialTypeController');

//add material type

routes.get(
    "/get/all",
    materialTypeController.checkAccessForGet,
    materialTypeController.getAllMaterialTypes
)

routes.get(
    "/get/one/:materialTypeId",
    materialTypeController.checkAccessForGet,
    materialTypeController.getMaterialTypeById
)


routes.post( 
    "/new",
    materialTypeController.checkUserAndAccess,
    materialTypeController.createNewId,
    materialTypeController.checkMaterialTypeExists,
    materialTypeController.addMaterialType)


routes.delete( 
    "/delete",
    materialTypeController.checkUserAndAccess,
    materialTypeController.checkMaterialTypeExists,
    materialTypeController.deleteMaterialType)   


module.exports = routes;