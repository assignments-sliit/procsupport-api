const express = require("express");
const routes = express.Router();

const budgetController = require("../controller/budgetController")
const prController = require("../../po/controllers/poController");

//create budget
routes.post("/add",budgetController.createBudget)

//get entire budget
routes.get('/get/total',budgetController.getEntireBudget)

//auth
routes.get("/auth/get", prController.checkUserAndAccess, budgetController.getEntireBudget)
module.exports = routes;