const express = require("express");
const tripController = require("../controllers/tripController");
const verifyToken = require("../middlewares/verifyToken");


const router = express.Router();

console.log("🔍 tripController:", tripController);

// Rotas específicas (estáticas) devem vir primeiro:
router.put("/:tripId/motorista", verifyToken,tripController.updateTripMotorista); 
router.put("/:tripId/notas",  verifyToken,tripController.updateTripNotas);
router.put("/:tripId/origemdestino",  verifyToken,tripController.updateTripOrigemDestino); 
router.put("/:id/disable",  verifyToken,tripController.disableTrip); 
router.put("/:id/reactivate",  verifyToken,tripController.reactivateTrip); 

router.post("/create",  verifyToken,tripController.createTrip); 

router.get("/dates",  verifyToken,tripController.getTripsDates); 
router.get("/by-date",  verifyToken,tripController.getTripsByDate);  // Coloca aqui
router.get("/date",  verifyToken,tripController.getTripsByDate);       // Se quiseres manter esta rota também
router.get("/summary",  verifyToken,tripController.getTripsSummary); 



router.get("/trip/:tripId",  verifyToken,tripController.getTripWithBus); 
router.get("/return",  verifyToken,tripController.findOrCreateReturnTrip); 
router.get("/:tripId/available-seats",  verifyToken,tripController.getAvailableSeats);
router.get("/",  verifyToken,tripController.getAllTrips); 
router.get("/summary-by-month",  verifyToken,tripController.getTripsSummaryByMonth);


// Rotas dinâmicas devem vir por último:
router.get("/:id",  verifyToken,tripController.getTripById); 
router.put("/:id",  verifyToken,tripController.updateTrip); 
router.delete("/:id",  verifyToken,tripController.deleteTripPermanently); 



module.exports = router;
