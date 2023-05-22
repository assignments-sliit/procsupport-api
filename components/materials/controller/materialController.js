const mongoose = require("mongoose");

const Material = require("../models/MaterialSchema");
const MaterialSchema = require("../models/MaterialSchema");
const MaterialTypeSchema = require("../models/MaterialTypeSchema");

exports.addMaterial = (req, res) => {
  const id = new mongoose.Types.ObjectId();
  req.body._id = id;
  req.body.materialId = "MAT" + Math.floor(Math.random() * 50000);
 
  const material = new Material(req.body);

  material
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Material created",
        createdMaterial: result,
        code: "MATERIAL_CREATED",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        code: "UNKNOWN_ERROR",
      });
    });
};

exports.getMaterialQty = (req, res, next) => {
  const materialId = req.body.materialId;
  Material.findOne({
    materialId: materialId,
  })
    .exec()
    .then((materialDocument) => {
      if (materialDocument) {
        req.body.materialId = materialDocument.materialId;
        req.body.availableQty = materialDocument.availableQty;
        next();
      } else {
        res.status(404).json({
          error: "No material found",
          code: "MATERIAL_NOT_FOUND",
        });
      }
    });
};

exports.getMaterialTypeDetails = (req,res,next) =>{
  MaterialTypeSchema.findOne({
    materialTypeId: req.body.materialTypeId
  }).exec().then((mt)=>{
    if(mt){
      req.body.materialType = mt.materialType
      req.body.uom = mt.uom
      next()
    }else{
      res.status(404).json({
        error: "The Material Type does not exist",
        code: "MT_NOT_EXIST",
      });
    }
  })
}

exports.getAllMaterials = (req,res,next) =>{
  Material.find().exec().then((allMaterials)=>{
    if(allMaterials.length < 1){
      res.status(404).json({
        error: "No Materials were found",
        code: "NO_MATERIAL_FOUND"
      })
    }else{
      res.status(200).json({
        data: allMaterials,
        code: "ALL_MATERIALS_FOUND"
      })
    }
  })
}

exports.addQtyToMaterial = (req, res) => {
  Material.updateOne(
    { materialId: req.body.materialId },
    {
      availableQty: req.body.availableQty + req.body.qty,
    }
  )
    .exec()
    .then((updatedDoc) => {
      res.status(200).json({
        updatedDocument: updatedDoc,
        message: "Material Quantity Incresed",
        code: "QUANTITY_INCREASED",
      });
    });
};

exports.removeQtyToMaterial = (req, res) => {
  Material.updateOne(
    { materialId: req.body.materialId },
    {
      availableQty: req.body.availableQty - req.body.qty,
    }
  )
    .exec()
    .then((updatedDoc) => {
      res.status(200).json({
        updatedDocument: updatedDoc,
        message: "Material Quantity Decreased",
        code: "QUANTITY_DECREASED",
      });
    });
};

exports.checkMaterialExists = (req, res, next) => {
  const materialId = req.body.materialId || req.params.materialId;
  Material.findOne({
    materialId: materialId,
  })
    .exec()
    .then((foundMat) => {
      if (foundMat) {
        res.status(409).json({
          error: "The Material Exists",
          code: "MT_EXISTS",
        });
      } else {
        next();
      }
    });
};

