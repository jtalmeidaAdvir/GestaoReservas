// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.delete("/:id", userController.deleteUser);
router.get("/", userController.getAllUsers);
router.put("/:id", userController.updateUser);


module.exports = router;