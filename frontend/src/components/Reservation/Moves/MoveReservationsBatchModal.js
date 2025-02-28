import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, MenuItem, Select } from "@mui/material";

const MoveReservationsBatchModal = ({ open, onClose, trips, onMove, selectedReservations }) => {
    const [selectedTrip, setSelectedTrip] = useState("");
    const [availableSeats, setAvailableSeats] = useState([]);
    const [reservationsWithSeats, setReservationsWithSeats] = useState([]);

    useEffect(() => {
        if (selectedTrip) {
            fetch(`http://192.168.1.18:3000/reservations/trip/${selectedTrip}`)
                .then(response => response.json())
                .then(data => {
                    if (data && Array.isArray(data.freeSeats)) {
                        setAvailableSeats(data.freeSeats);
                        setReservationsWithSeats(
                            selectedReservations.map(res => ({ ...res, selectedSeat: null }))
                        );
                    } else {
                        setAvailableSeats([]);
                    }
                })
                .catch(error => console.error("Erro ao buscar lugares disponíveis:", error));
        }
    }, [selectedTrip, selectedReservations]);

    const handleSeatSelection = (reservationId, seat) => {
        setReservationsWithSeats(prev =>
            prev.map(res =>
                res.id === reservationId ? { ...res, selectedSeat: seat } : res
            )
        );
    };

    const handleConfirmMove = () => {
        const reservationsToMove = reservationsWithSeats.map(res => ({
            ...res,
            newSeat: res.selectedSeat, // ✅ Certifica que passa o lugar correto
        }));

        console.log("🚀 Enviando reservas para mover:", reservationsToMove);
        
        onMove(selectedTrip, reservationsToMove);
        onClose();
    };

    const isReadyToConfirm = reservationsWithSeats.every(res => res.selectedSeat);

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, bgcolor: "background.paper", p: 4, boxShadow: 25, borderRadius: 2 }}>
                <Typography variant="h6">Mover {selectedReservations.length} Reserva(s)</Typography>

                {/* Escolha da viagem */}
                <Select
                    fullWidth
                    value={selectedTrip}
                    onChange={(e) => setSelectedTrip(e.target.value)}
                    sx={{ mt: 2 }}
                >
                    {trips
                    .filter(trip => trip.isActive) // Apenas viagens ativas
                    .map((trip) => {
                        const formattedDate = trip.dataviagem
                            ? new Date(trip.dataviagem).toLocaleDateString("pt-PT")
                            : "Sem data";

                        return (
                            <MenuItem key={trip.id} value={trip.id}>
                                {trip.origem} → {trip.destino} ({trip.Bus?.nome || "Sem autocarro"}) ({formattedDate})
                            </MenuItem>
                        );
                    })}

                </Select>

                {/* Escolha dos lugares disponíveis */}
                {selectedTrip && reservationsWithSeats.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        {reservationsWithSeats.map((res) => (
                            <Box key={res.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Typography sx={{ width: "40%" }}>
                                    {res.nomePassageiro} {res.apelidoPassageiro} (Reserva: {res.reserva})
                                </Typography>
                                <Select
                                    value={res.selectedSeat || ""}
                                    onChange={(e) => handleSeatSelection(res.id, e.target.value)}
                                    sx={{ width: "60%" }}
                                >
                                    {availableSeats.map((seat) => (
                                        <MenuItem key={seat} value={seat}>
                                            Lugar {seat}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        ))}
                    </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button
                        variant="contained"
                        style={{ backgroundColor: "darkred", color: "white", borderColor: "darkred" }}
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        style={{ backgroundColor: "darkred", color: "white", borderColor: "darkred" }}
                        onClick={handleConfirmMove} // ✅ Agora usa a função correta
                        disabled={!isReadyToConfirm}
                    >
                        Confirmar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};


export default MoveReservationsBatchModal;
