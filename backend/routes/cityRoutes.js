const express = require("express");
const cityController = require("../controllers/cityController");

const router = express.Router();

router.post("/", cityController.createCity);
router.get("/", cityController.getAllCities);
router.put("/:id", cityController.updateCity);
router.delete("/:id", cityController.deleteCity);
router.get("/:id", cityController.getCityById);


module.exports = router;
