const express = require("express");
const tripController = require("../controllers/tripController");


const router = express.Router();

console.log("🔍 tripController:", tripController);

// Rotas específicas (estáticas) devem vir primeiro:
router.put("/:tripId/motorista", tripController.updateTripMotorista); 
router.put("/:tripId/origemdestino", tripController.updateTripOrigemDestino); 
router.put("/:id/disable", tripController.disableTrip); 
router.put("/:id/reactivate", tripController.reactivateTrip); 

router.post("/create", tripController.createTrip); 

router.get("/dates", tripController.getTripsDates); 
router.get("/by-date", tripController.getTripsByDate);  // Coloca aqui
router.get("/date", tripController.getTripsByDate);       // Se quiseres manter esta rota também
router.get("/summary", tripController.getTripsSummary); 



router.get("/trip/:tripId", tripController.getTripWithBus); 
router.get("/return", tripController.findOrCreateReturnTrip); 
router.get("/:tripId/available-seats", tripController.getAvailableSeats);
router.get("/", tripController.getAllTrips); 
router.get("/summary-by-month", tripController.getTripsSummaryByMonth);


// Rotas dinâmicas devem vir por último:
router.get("/:id", tripController.getTripById); 
router.put("/:id", tripController.updateTrip); 
router.delete("/:id", tripController.deleteTripPermanently); 



module.exports = router;
