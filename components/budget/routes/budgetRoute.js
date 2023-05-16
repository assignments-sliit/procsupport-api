const express = require("express");
const routes = express.Router();

const budgetController = require("../controller/budgetController")

//create budget
routes.post("/add",budgetController.createBudget)

//get entire budget
routes.get('/get/total',budgetController.getEntireBudget)


module.exports = routes;