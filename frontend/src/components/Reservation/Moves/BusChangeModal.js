import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Typography } from "@mui/material";

const BusChangeModal = ({ open, onClose, onChangeBus, tripId, dataviagem }) => {
    const [busId, setBusId] = useState(null);
    const [availableBuses, setAvailableBuses] = useState([]);
    const [activeReservations, setActiveReservations] = useState(0); // Número de reservas ativas

    // Buscar autocarros disponíveis ao abrir o modal
    useEffect(() => {
        if (open) {
            //console.log("🔄 Buscando autocarros disponíveis...");
    
            fetch(`http://localhost:3010/buses/available?date=${dataviagem}`)
                .then((response) => response.json())
                .then((buses) => {
                    //console.log("✅ Autocarros disponíveis recebidos:", buses);
                    setAvailableBuses(buses);
                })
                .catch((error) => console.error("❌ Erro ao buscar autocarros disponíveis:", error));
    
            //console.log(`🔄 Buscando informações do autocarro atual da viagem ${tripId}...`);
    
            fetch(`http://localhost:3010/trips/${tripId}`)
                .then((response) => response.json())
                .then((tripData) => {
                    //console.log("🔍 Dados recebidos da API:", tripData);
                    if (!tripData || !tripData.Bus) {
                        console.warn("⚠️ Erro: Dados do autocarro atual não encontrados.");
                        return;
                    }
    
                    const busAtual = tripData.Bus;
                    //console.log("🚌 Autocarro atual:", busAtual);
    
                    fetch(`http://localhost:3010/trips/${tripId}/available-seats`)
                        .then((response) => response.json())
                        .then((availableSeats) => {
                            if (Array.isArray(availableSeats)) {
                                const totalReservasAtuais = busAtual.nlugares - availableSeats.length;
                                //console.log(`📌 Reservas ativas na viagem atual: ${totalReservasAtuais}`);
                                setActiveReservations(totalReservasAtuais);
                            } else {
                                console.warn("❌ Resposta inesperada do servidor ao buscar reservas ativas.");
                                setActiveReservations(0);
                            }
                        })
                        .catch((error) => console.error("❌ Erro ao buscar reservas ativas:", error));
                })
                .catch((error) => console.error("❌ Erro ao buscar detalhes da viagem:", error));
        }
    }, [open, dataviagem, tripId]);

    const handleConfirm = async () => {
        if (!busId) return;

        // Pedido de confirmação adicional
        if (
            !window.confirm(
                "As reservas serão passadas com os mesmos lugares que estão neste autocarro. Deve confirmar que nenhum lugar está acima do nº lugares do autocarro destino"
            )
        ) {
            return;
        }
    
        try {
            // Buscar quantos lugares já estão ocupados no novo autocarro
            const responseSeats = await fetch(`http://localhost:3010/trips/${busId}/available-seats`);
            const dataSeats = await responseSeats.json();
            let reservasNoNovoAutocarro = Array.isArray(dataSeats) ? dataSeats.length : 0;
    
            // Encontrar o autocarro selecionado
            const selectedBus = availableBuses.find(bus => bus.id === busId);
            if (!selectedBus) {
                alert("❌ Erro: autocarro selecionado não encontrado.");
                return;
            }
    
            const capacidadeNovoAutocarro = selectedBus.nlugares;
            const availableSeatsNovoAutocarro = capacidadeNovoAutocarro - reservasNoNovoAutocarro;
    
            //console.log(`🚍 Novo Autocarro "${selectedBus.nome}" tem ${capacidadeNovoAutocarro} lugares.`);
            //console.log(`🎟️ Lugares já ocupados no novo autocarro: ${reservasNoNovoAutocarro}`);
            //console.log(`✅ Lugares disponíveis no novo autocarro: ${availableSeatsNovoAutocarro}`);
            //console.log(`📌 Reservas ativas na viagem atual: ${activeReservations}`);
    
            // Se o novo autocarro não tiver lugares suficientes, bloquear a troca
            if (activeReservations > availableSeatsNovoAutocarro) {
                alert(`❌ O novo autocarro tem apenas ${availableSeatsNovoAutocarro} lugares disponíveis, mas existem ${activeReservations} reservas ativas na viagem.`);
                return;
            }
    
            // Atualizar a viagem para o novo autocarro
            const response = await fetch(`http://localhost:3010/buses/${tripId}/bus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busId }),
            });
    
            if (response.ok) {
                alert("✅ Autocarro atualizado com sucesso!");
                onClose();
                window.location.reload(); // Atualiza automaticamente a página
            } else {
                console.error("❌ Erro ao atualizar autocarro:", await response.text());
            }
        } catch (error) {
            console.error("🔥 Erro ao verificar lugares disponíveis no novo autocarro:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Escolher Novo Autocarro</DialogTitle>
            <DialogContent>
                <Typography>Selecione um novo autocarro para a viagem:</Typography>
                <Typography variant="body2" color="textSecondary">
                </Typography>
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
