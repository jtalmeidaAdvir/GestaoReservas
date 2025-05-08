const express = require("express");
const cityController = require("../controllers/cityController");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, cityController.createCity);
router.get("/", verifyToken,cityController.getAllCities);
router.put("/:id", verifyToken,cityController.updateCity);
router.delete("/:id", verifyToken,cityController.deleteCity);
router.get("/:id", verifyToken,cityController.getCityById);


module.exports = router;
