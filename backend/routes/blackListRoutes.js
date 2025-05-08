// routes/blacklistRoutes.js
const express = require("express");
const { getAllBlackList, deleteFromBlackList } = require("../controllers/blackListController");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", verifyToken,getAllBlackList); // devolve todos os registos
router.delete("/:id", verifyToken,deleteFromBlackList); // nova rota para eliminar


module.exports = router;
