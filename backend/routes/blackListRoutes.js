// routes/blacklistRoutes.js
const express = require("express");
const { getAllBlackList, deleteFromBlackList } = require("../controllers/blackListController");

const router = express.Router();

router.get("/", getAllBlackList); // devolve todos os registos
router.delete("/:id", deleteFromBlackList); // nova rota para eliminar


module.exports = router;
