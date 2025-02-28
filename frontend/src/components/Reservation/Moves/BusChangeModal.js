import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Typography } from "@mui/material";

const BusChangeModal = ({ open, onClose, onChangeBus, tripId, dataviagem }) => {
    const [busId, setBusId] = useState(null);
    const [availableBuses, setAvailableBuses] = useState([]);

    // Buscar autocarros disponíveis ao abrir o modal
    useEffect(() => {
        if (open) {
            fetch(`http://192.168.1.18:3000/buses/available?date=${dataviagem}`)
                .then((response) => response.json())
                .then((buses) => setAvailableBuses(buses))
                .catch((error) => console.error("Erro ao buscar autocarros disponíveis:", error));
        }
    }, [open, dataviagem]);

    const handleConfirm = async () => {
        if (!busId) return;

        try {
            const response = await fetch(`http://192.168.1.18:3000/buses/${tripId}/bus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busId }),
            });

            if (response.ok) {
                alert("Autocarro atualizado com sucesso!");
                onClose();
                window.location.reload(); // 🔄 Atualiza automaticamente a página
            } else {
                console.error("Erro ao atualizar autocarro");
            }
        } catch (error) {
            console.error("Erro ao atualizar autocarro:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Escolher Novo Autocarro</DialogTitle>
            <DialogContent>
                <Typography>Selecione um novo autocarro para a viagem:</Typography>
                <Select
                    fullWidth
                    value={busId || ""}
                    onChange={(e) => setBusId(e.target.value)}
                    sx={{ mt: 2 }}
                >
                    {availableBuses.length > 0 ? (
                        availableBuses.map((bus) => (
                            <MenuItem key={bus.id} value={bus.id}>
                                {bus.nome} ({bus.nlugares} lugares)
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>Carregando autocarros...</MenuItem>
                    )}
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} style={{ backgroundColor: "darkred", color: "white", borderColor: "darkred" }}>
                    Cancelar
                </Button>
                <Button onClick={handleConfirm} style={{ backgroundColor: "darkred", color: "white", borderColor: "darkred" }}>
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BusChangeModal;
