// routes/pricesRoutes.js
const express = require("express");
const router = express.Router();
const priceController = require("../controllers/priceController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/", verifyToken,priceController.createPrice);
router.get("/", verifyToken,priceController.getAllPrices);
router.get("/:id", verifyToken,priceController.getPriceById);
router.put("/:id", verifyToken,priceController.updatePrice);
router.delete("/:id", verifyToken,priceController.deletePrice);

module.exports = router;