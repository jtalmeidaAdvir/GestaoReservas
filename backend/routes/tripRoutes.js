const express = require("express");
const tripController = require("../controllers/tripController");

const router = express.Router();

console.log("🔍 tripController:", tripController); // Debug


router.put("/:tripId/motorista", tripController.updateTripMotorista); 
router.put("/:tripId/origemdestino", tripController.updateTripOrigemDestino); 
router.put("/:id/disable", tripController.disableTrip); 
router.put("/:id/reactivate", tripController.reactivateTrip); 

router.post("/create", tripController.createTrip); 

router.get("/dates", tripController.getTripsDates); 
router.get("/date", tripController.getTripsByDate); 
router.get("/summary", tripController.getTripsSummary); 
router.get("/trip/:tripId", tripController.getTripWithBus); 
router.get("/return", tripController.findOrCreateReturnTrip); 
router.get("/", tripController.getAllTrips); 
router.get("/:id", tripController.getTripById); // ✅ Agora está abaixo do `PUT /:id`- -
router.put("/:id", tripController.updateTrip); // ✅ Rota para atualizar uma viagem
router.get("/:tripId/available-seats", tripController.getAvailableSeats);


router.delete("/:id", tripController.deleteTripPermanently); 

module.exports = router;
