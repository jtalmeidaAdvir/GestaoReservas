const express = require("express");
const reservationController = require("../controllers/reservationController");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/create", verifyToken,reservationController.createReservation); // Criar reserva com número automático
router.put("/:id", verifyToken,reservationController.updateReservation); // Atualizar reserva existente
router.get("/by-reserva/:reserva", verifyToken,reservationController.getReservationByReserva); // Buscar reserva pelo código
router.get("/last", verifyToken,reservationController.getLastReservation); // 📌 Nova rota para buscar a última reserva
router.put("/:reserva/place", verifyToken,reservationController.updateReservationPlace); // Novo endpoint para atualizar o lugar
router.get("/by-passageiro/:nome/:apelido", verifyToken,reservationController.getReservationByPassengerName);

// 1) Criar só a reserva de regresso
router.post("/create-return", verifyToken,reservationController.createReturnReservation);
router.get("/by-telefone/:telefone", verifyToken,reservationController.getReservationByPhone); // Buscar reserva pelo código
router.get("/trip/:tripId", verifyToken,reservationController.ReturnReservationsOfBus);
router.delete("/delete/:reserva", verifyToken,reservationController.deleteReservation);
router.get("/volta/aberto", verifyToken,reservationController.getOpenReturnReservations);
router.get("/all", verifyToken,reservationController.getAllReservations);
router.get("/lastTicket", verifyToken,reservationController.getLastTicket);







module.exports = router;
