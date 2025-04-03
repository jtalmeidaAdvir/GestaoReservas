const express = require("express");
const reservationController = require("../controllers/reservationController");

const router = express.Router();

router.post("/create", reservationController.createReservation); // Criar reserva com número automático
router.put("/:id", reservationController.updateReservation); // Atualizar reserva existente
router.get("/by-reserva/:reserva", reservationController.getReservationByReserva); // Buscar reserva pelo código
router.get("/last", reservationController.getLastReservation); // 📌 Nova rota para buscar a última reserva
router.put("/:reserva/place", reservationController.updateReservationPlace); // Novo endpoint para atualizar o lugar
router.get("/by-passageiro/:nome/:apelido", reservationController.getReservationByPassengerName);

// 1) Criar só a reserva de regresso
router.post("/create-return", reservationController.createReturnReservation);
router.get("/by-telefone/:telefone", reservationController.getReservationByPhone); // Buscar reserva pelo código
router.get("/trip/:tripId", reservationController.ReturnReservationsOfBus);
router.delete("/delete/:reserva", reservationController.deleteReservation);
router.get("/volta/aberto", reservationController.getOpenReturnReservations);






module.exports = router;
