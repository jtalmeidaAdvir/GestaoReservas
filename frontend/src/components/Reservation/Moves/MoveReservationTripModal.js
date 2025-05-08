import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, MenuItem, Select } from "@mui/material";
const getToken = () => localStorage.getItem("token");

const MoveReservationTripModal = ({ open, onClose, trips, onMove }) => {
    const [selectedTrip, setSelectedTrip] = useState("");
    const [availableSeats, setAvailableSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState("");

    // Quando a viagem muda, buscar os lugares disponíveis
    useEffect(() => {
        if (selectedTrip) {
            fetch(`http://192.168.1.25:3000/reservations/trip/${selectedTrip}`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`
                }
                
              })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || !Array.isArray(data.freeSeats)) {
                        console.error("Resposta inesperada:", data);
                        return;
                    }
    
                    setAvailableSeats(data.freeSeats); // ✅ Agora pega diretamente os lugares livres
                })
                .catch(error => console.error("Erro ao buscar lugares disponíveis:", error));
        }
    }, [selectedTrip]);
    

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400, bgcolor: "background.paper", p: 4,
                boxShadow: 25, borderRadius: 2
            }}>
                <Typography variant="h6">Mudar Reserva para Outra Viagem</Typography>

                {/* Escolha da viagem */}
                <Select
                    fullWidth
                    value={selectedTrip}
                    
                    onChange={(e) => {
                        setSelectedTrip(e.target.value);
                        setSelectedSeat(""); // Reset ao lugar ao mudar de viagem
                    }}
                    sx={{ mt: 2 }}
                >
                    {trips.map((trip) => (
                        <MenuItem key={trip.id} value={trip.id}>
                            {trip.origem} → {trip.destino} ({trip.Bus?.nome || "Sem autocarro"}) ({trip.formattedDate})
                        </MenuItem>
                    ))}
                </Select>

                {/* Escolha do lugar disponível */}
                {selectedTrip && (
                    <Select
                        fullWidth
                        value={selectedSeat}
                        onChange={(e) => setSelectedSeat(e.target.value)}
                        sx={{ mt: 2 }}
                    >
                        {availableSeats.length > 0 ? (
                            availableSeats.map((seat) => (
                                <MenuItem key={seat} value={seat}>
                                    Lugar {seat}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>Nenhum lugar disponível</MenuItem>
                        )}
                    </Select>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button variant="contained" style={{ backgroundColor:"darkred",color:"white", borderColor:"darkred"}} onClick={onClose}>Cancelar</Button>
                    <Button style={{ backgroundColor:"darkred",color:"white", borderColor:"darkred"}}
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            onMove(selectedTrip, selectedSeat);
                            onClose();
                        }}
                        disabled={!selectedTrip || !selectedSeat}
                    >
                        Confirmar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default MoveReservationTripModal;
