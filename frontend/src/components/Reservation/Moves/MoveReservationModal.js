import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, MenuItem, Select } from "@mui/material";

const MoveReservationModal = ({ open, onClose, reservations, onMove }) => {
    const [selectedSeat, setSelectedSeat] = useState("");

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400, bgcolor: "background.paper", p: 4,
                boxShadow: 24, borderRadius: 2
            }}>
                <Typography variant="h6">Mover Reserva</Typography>

                <Select
                    fullWidth
                    value={selectedSeat}
                    onChange={(e) => setSelectedSeat(e.target.value)}
                    sx={{ mt: 2 }}
                >
                    {reservations
                        .filter(res => !res.reserva) // Só mostrar lugares vazios
                        .map((res) => (
                            <MenuItem key={res.id} value={res.id}>
                                Lugar {res.id}
                            </MenuItem>
                        ))}
                </Select>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button variant="contained" style={{ backgroundColor:"darkred",color:"white", borderColor:"darkred"}} onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="contained" style={{ backgroundColor:"darkred",color:"white", borderColor:"darkred"}}
                        color="primary"
                        onClick={() => {
                            onMove(selectedSeat);
                            onClose();
                        }}
                        disabled={!selectedSeat}
                    >
                        Confirmar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default MoveReservationModal;
