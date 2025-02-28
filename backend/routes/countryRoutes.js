const express = require("express");
const countryController = require("../controllers/countryController");

const router = express.Router();

router.post("/", countryController.createCountry);
router.get("/", countryController.getAllCountries);
router.put("/:id", countryController.updateCountry);
router.delete("/:id", countryController.deleteCountry);

module.exports = router;
