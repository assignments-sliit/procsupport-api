const DB_CONNECTION_OK = require("./constants/database.constants");

const express = require("express");

const app = express();

const PORT = process.env.PORT || 5000;
const { getDbConnection } = require("./db/DBConnection");

const cors = require("cors");

app.use(cors());
app.use(express.json());

//routes
const userRoutes = require("./components/auth/routes/userRoutes");
const prRoutes = require("./components/pr/routes/prRoutes");
const mrRoutes = require("./components/pr/routes/mrRoutes");
const mtRoutes = require("./components/materials/routes/materialTypeRoutes");
const materialRoutes = require("./components/materials/routes/materialRoutes");
const supplierRoutes = require("./components/supplier/routes/supplierRoutes");
const poRoutes = require("./components/po/routes/poRoutes")
const budgetRoutes = require("./components/budget/routes/budgetRoute")

//endpoints
app.use("/api/users", userRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/mr", mrRoutes);
app.use("/api/mt", mtRoutes);
app.use("/api/material", materialRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/po",poRoutes)
app.use("/api/budget",budgetRoutes)


//cors
app.all((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Backend server has started on port ${PORT}`);
});

getDbConnection().then(() => {
  console.log(DB_CONNECTION_OK);
});
