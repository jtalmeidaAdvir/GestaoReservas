// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");


router.post("/register", verifyToken,userController.register);
router.post("/login" ,userController.login);
router.delete("/:id", verifyToken,userController.deleteUser);
router.get("/", verifyToken,userController.getAllUsers);
router.put("/:id", verifyToken,userController.updateUser);


module.exports = router;