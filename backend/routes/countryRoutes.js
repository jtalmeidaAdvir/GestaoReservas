const express = require("express");
const countryController = require("../controllers/countryController");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken,countryController.createCountry);
router.get("/", verifyToken,countryController.getAllCountries);
router.put("/:id", verifyToken,countryController.updateCountry);
router.delete("/:id", verifyToken,countryController.deleteCountry);

module.exports = router;
