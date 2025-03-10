const express = require("express");
const busController = require("../controllers/busController");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("imagem"), busController.createBus);
router.get("/available", busController.getAvailableBuses); // ✅ Nova rota para listar autocarros disponíveis


router.get("/", busController.getAllBuses); // Listar autocarros
router.put("/:id", upload.single("imagem"), busController.updateBus); // Atualizar autocarro com imagem
router.delete("/:id", busController.deleteBus); // Apagar autocarro
router.put("/:id/activate", busController.reactivateBus); // Reativar autocarro
router.delete("/:id/permanent-delete", busController.permanentDeleteBus); // Eliminar permanentemente
router.get("/:id", busController.getBusById); // Obter autocarro (retorna imagem em base64)
router.put("/:tripId/bus", busController.updateTripBus);




module.exports = router;
