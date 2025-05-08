const express = require("express");
const router = express.Router();
const sendEmail = require("../controllers/sendEmail");
const verifyToken = require("../middlewares/verifyToken");

router.post("/sendmail", verifyToken,sendEmail);

module.exports = router;
