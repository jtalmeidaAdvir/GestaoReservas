import React, { useState, useEffect } from "react";
import { Modal, Box, Button, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const SelectReturnSeatModal = ({ open, onClose, tripId, tripOriginalDate, onConfirm }) => {
    const [availableSeats, setAvailableSeats] = useState([]);
    const [busName, setBusName] = useState("");
    const [tripDate, setTripDate] = useState("");
    const [tripOrigem, setTripOrigem] = useState("");
    const [tripDestino, setTripDestino] = useState("");
    const [selectedSeat, setSelectedSeat] = useState("");

    useEffect(() => {
        if (open && tripId) {
            console.log("Fetching data for trip ID:", tripId);

            fetch(`https://backendreservasnunes.advir.pt/trips/${tripId}/available-seats`)
                .then(res => res.json())
                .then(data => {
                    console.log("Lugares disponíveis:", data);
                    setAvailableSeats(Array.isArray(data) ? data : []);
                })
                .catch(error => console.error("Erro ao buscar lugares disponíveis:", error));

            fetch(`https://backendreservasnunes.advir.pt/trips/trip/${tripId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.trip) {
                        setBusName(data.trip.Bus?.nome || "Desconhecido");
                        setTripOrigem(data.trip.origem || "Data não disponível");
                        setTripDestino(data.trip.destino || "Data não disponível");
                        setTripDate(data.trip.dataviagem || "Data não disponível");
                    }
                })
                .catch(error => console.error("Erro ao buscar detalhes da viagem:", error));
        }
    }, [open, tripId]);

    // Função para confirmar a seleção do lugar
    const handleConfirm = () => {
        if (selectedSeat) {
            onConfirm(selectedSeat, tripOriginalDate); // ✅ Agora passa a data original
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ backgroundColor: "white", padding: 3, borderRadius: 2, width: 400, margin: "auto", marginTop: "10%" }}>
                <Typography variant="h6" gutterBottom>Escolha o lugar de regresso</Typography>

                {/* Informações da viagem */}
                <Typography variant="body1"><b>Origem:</b> {tripOrigem}</Typography>
                <Typography variant="body1"><b>Destino:</b> {tripDestino}</Typography>
                <Typography variant="body1"><b>Autocarro:</b> {busName}</Typography>
                <Typography variant="body1"><b>Data da viagem original:</b> {tripOriginalDate ? new Date(tripOriginalDate).toLocaleDateString('pt-PT') : "Data não disponível"}</Typography>

                {/* Dropdown para selecionar o lugar */}
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Selecione o lugar</InputLabel>
                    <Select
                        value={selectedSeat || ""}
                        onChange={(e) => setSelectedSeat(e.target.value)}
                        disabled={availableSeats.length === 0}
                    >
                        {availableSeats.map((seat) => (
                            <MenuItem key={seat.id || seat} value={seat.numero || seat}>
                                Lugar {seat.numero || seat}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Botões */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button onClick={onClose} color="error">Cancelar</Button>
                    <Button onClick={handleConfirm} color="primary" disabled={!selectedSeat}>
                        Confirmar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default SelectReturnSeatModal;
