const express = require("express");
const busController = require("../controllers/busController");
const multer = require("multer");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();
// Configuração do Multer para armazenar os ficheiros na memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/create",verifyToken, upload.single("imagem"), busController.createBus);  // Rota para criação de autocarro com imagem
router.get("/available",verifyToken, busController.getAvailableBuses); // ✅ Nova rota para listar autocarros disponíveis


router.get("/",verifyToken, busController.getAllBuses); // Listar autocarros
router.put("/:id",verifyToken, upload.single("imagem"), busController.updateBus); // Atualizar autocarro com imagem
router.delete("/:id",verifyToken, busController.deleteBus); // Apagar autocarro
router.put("/:id/activate", verifyToken,busController.reactivateBus); // Reativar autocarro
router.delete("/:id/permanent-delete",verifyToken, busController.permanentDeleteBus); // Eliminar permanentemente
router.get("/:id", verifyToken,busController.getBusById); // Obter autocarro (retorna imagem em base64)
router.put("/:tripId/bus", verifyToken,busController.updateTripBus);




module.exports = router;
