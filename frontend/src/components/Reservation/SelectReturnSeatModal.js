import React, { useState, useEffect } from "react";
import { Modal, Box, Button, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const SelectReturnSeatModal = ({ open, onClose, tripId, mainTripDate, onConfirm }) => {
    const [availableSeats, setAvailableSeats] = useState([]);
    const [busName, setBusName] = useState("");
    const [tripOrigem, setTripOrigem] = useState("");
    const [tripDestino, setTripDestino] = useState("");
    const [selectedSeat, setSelectedSeat] = useState("");

    useEffect(() => {
        if (open && tripId) {
            // Busca os lugares disponíveis para a viagem de regresso
            fetch(`https://nunes.entigra.pt/backend/trips/${tripId}/available-seats`)
                .then(res => res.json())
                .then(data => {
                    const formattedSeats = Array.isArray(data) ? data : [];
                    setAvailableSeats(formattedSeats);

                    // Seleciona automaticamente o primeiro lugar disponível
                    if (formattedSeats.length > 0) {
                        const firstSeat = formattedSeats[0];
                        setSelectedSeat(firstSeat.numero || firstSeat);
                    }
                })
                .catch(error => console.error("Erro ao buscar lugares disponíveis:", error));

            // Busca detalhes da viagem de regresso (exceto a data, que vamos obter da reserva principal)
            fetch(`https://nunes.entigra.pt/backend/trips/trip/${tripId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.trip) {
                        setBusName(data.trip.Bus?.nome || "Desconhecido");
                        setTripOrigem(data.trip.origem || "Origem não disponível");
                        setTripDestino(data.trip.destino || "Destino não disponível");
                        // Note: não estamos a utilizar a data do return trip, pois queremos a data da viagem original
                    }
                })
                .catch(error => console.error("Erro ao buscar detalhes da viagem:", error));
        }
    }, [open, tripId]);

    // Usa a prop mainTripDate para exibir a data da viagem original
    const dataFormatada = mainTripDate 
        ? new Date(mainTripDate).toLocaleDateString('pt-PT') 
        : "Data não disponível";

    const handleClose = (event, reason) => {
        if (reason === "backdropClick") return;
        onClose();
    };

    // Ao confirmar, envia o lugar selecionado e a data da viagem original (mainTripDate)
    const handleConfirm = () => {
        if (selectedSeat) {
            onConfirm(selectedSeat, mainTripDate);
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ backgroundColor: "white", padding: 3, borderRadius: 2, width: 400, margin: "auto", marginTop: "10%" }}>
                <Typography variant="h6" gutterBottom>Escolha o lugar de regresso</Typography>

                {/* Exibe as informações da viagem de regresso */}
                <Typography variant="body1"><b>Origem:</b> {tripOrigem}</Typography>
                <Typography variant="body1"><b>Destino:</b> {tripDestino}</Typography>
                <Typography variant="body1"><b>Autocarro:</b> {busName}</Typography>
                <Typography variant="body1">
                    <b>Data da viagem original:</b> {dataFormatada}
                </Typography>

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
