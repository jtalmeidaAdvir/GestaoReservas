

export const handleMoveReservation = async (newSeat, reservationToMove, reservations, setReservations, handleRowEdit) => {
    setReservations((prevReservations) => {
        let updatedReservations = [...prevReservations];

        // Encontrar a reserva original
        const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMove.id);
        const newPositionIndex = updatedReservations.findIndex(res => res.id === newSeat);

        if (originalIndex !== -1 && newPositionIndex !== -1) {
            // Guardar reserva original
            const reservaOriginal = { ...updatedReservations[originalIndex] };

            // Criar uma linha vazia na posição original
            updatedReservations[originalIndex] = {
                id: updatedReservations[originalIndex].id,
                lugar: updatedReservations[originalIndex].id,
                preco: "",
                moeda: "",
                entrada: "",
                nomePassageiro: "",
                apelidoPassageiro: "",
                saida: "",
                volta: "",
                telefone: "",
                email: "",
                obs: "",
                carro: "",
                reserva: ""
            };

            // Atualizar reserva no novo lugar
            updatedReservations[newPositionIndex] = {
                ...reservaOriginal,
                id: newSeat,
                lugar: newSeat
            };

            console.log(`✅ Reserva movida para o lugar ${newSeat}`);

            // Chamar handleRowEdit para guardar no backend
            handleRowEdit(updatedReservations[newPositionIndex]);
        }

        return updatedReservations;
    });
};


export const handleMoveReservationTrip = async (
    newTripId, newSeat, newTripDate, reservationToMoveTrip, reservations, setReservations, handleRowEdit
) => {
    setReservations((prevReservations) => {
        let updatedReservations = [...prevReservations];

        // Obter a data de hoje sem horas, minutos e segundos
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Encontrar a reserva original
        const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMoveTrip.id);

        if (originalIndex !== -1) {
            // Criar uma nova reserva com a nova viagem e o novo lugar
            const reservaOriginal = { 
                ...updatedReservations[originalIndex], 
                tripId: newTripId, 
                lugar: newSeat,
                tripDate: newTripDate
            };

            // Apagar a reserva do estado atual
            updatedReservations.splice(originalIndex, 1);

            console.log(`✅ Reserva movida para a viagem ${newTripId} no lugar ${newSeat}`);

            // Chamar handleRowEdit para guardar no backend
            handleRowEdit(reservaOriginal);
        }

        // Filtrar apenas as reservas cuja data seja igual ou posterior a hoje
        return updatedReservations.filter(res => {
            if (!res.tripDate) return false; // Se não houver data, ignora

            const tripDate = new Date(res.tripDate);
            tripDate.setHours(0, 0, 0, 0); // Remover horas para comparação correta

            return tripDate >= today;
        });
    });
};



export const handleDeleteReservation = async (numeroReserva, fetchReservations) => {
    console.log("🔍 Tentando eliminar reserva com número:", numeroReserva);

    if (!numeroReserva) {
        console.error("❌ Número de reserva inválido");
        return;
    }

    if (!window.confirm(`Tem certeza que deseja eliminar a reserva Nº ${numeroReserva}?`)) return;

    try {
        const response = await fetch(`http://192.168.1.10:3000/reservations/delete/${numeroReserva}`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert(`Reserva Nº ${numeroReserva} eliminada com sucesso!`);
            fetchReservations(); // Atualizar a lista após a eliminação
        } else {
            const errorText = await response.text();
            console.error("Erro ao eliminar reserva:", errorText);
        }
    } catch (error) {
        console.error("🔥 Erro ao eliminar reserva:", error);
    }
};


export const handleChangeBus = async (busId, tripId, setModalOpen, fetchReservations) => {

    try {
        const response = await fetch(`http://192.168.1.10:3000/trips/${tripId}/bus`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ busId }),
        });

        if (response.ok) {
            alert("Autocarro atualizado com sucesso!");
            setModalOpen(false); // Fechar o modal
            fetchReservations(); // Atualizar os dados sem recarregar a página
        } else {
            console.error("Erro ao atualizar autocarro");
        }
    } catch (error) {
        console.error("Erro ao atualizar autocarro:", error);
    }
};

export const handleMoveReservationsInBatch = async (
    newTripId,
    reservationsToMove,
    setReservations,
    handleRowEdit,
    fetchReservations
) => {
    console.log("🏁 Movendo reservas:", reservationsToMove);

    setReservations((prevReservations) => {
        return prevReservations.map(res => {
            const movedReservation = reservationsToMove.find(movedRes => movedRes.id === res.id);
            return movedReservation
                ? { ...movedReservation, tripId: newTripId, lugar: movedReservation.newSeat } // ✅ O lugar correto agora é atualizado
                : res;
        });
    });

    for (const res of reservationsToMove) {
        await handleRowEdit({
            ...res,
            tripId: newTripId,
            lugar: res.newSeat, // ✅ Agora o backend recebe o novo lugar correto
        });
    }

    fetchReservations(); // Atualiza a lista para refletir as mudanças reais do backend
};


export const handleSaveMotorista = async (tripId, motorista, fetchReservations) => {
    
    try {
        const response = await fetch(`http://192.168.1.10:3000/trips/${tripId}/motorista`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ motorista }),
        });

        if (response.ok) {
            console.log("✅ Motorista atualizado com sucesso!");
            alert("Motorista guardado com sucesso.")
            fetchReservations(); // Atualiza os dados na UI
        } else {
            console.error("❌ Erro ao atualizar motorista:", await response.text());
        }
    } catch (error) {
        console.error("🔥 Erro ao atualizar motorista:", error);
    }
};