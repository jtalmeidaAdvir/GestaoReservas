// routes/pricesRoutes.js
const express = require("express");
const router = express.Router();
const priceController = require("../controllers/priceController");

router.post("/", priceController.createPrice);
router.get("/", priceController.getAllPrices);
router.get("/:id", priceController.getPriceById);
router.put("/:id", priceController.updatePrice);
router.delete("/:id", priceController.deletePrice);

module.exports = router;