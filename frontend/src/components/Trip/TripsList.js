import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import CreateTripModal from "./CreateTripModal";
import Reservation from "../Reservation/Reservation";

const TripsList = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(localStorage.getItem("selectedDate") || moment().format("YYYY-MM-DD"));
    const [selectedTripId, setSelectedTripId] = useState(null);

    const location = useLocation();
    const agendaState = location.state;

    const handleTripCreated = (newTrip) => {
        setTrips((prevTrips) => [newTrip, ...prevTrips]); // Adiciona a nova viagem à lista
    };

    useEffect(() => {
        ////console.log(`🔍 Buscando viagens para a data: ${selectedDate}`);

        const fetchTrips = async () => {
            try {
                const response = await fetch(`https://backendreservasnunes.advir.pt/trips/date?date=${selectedDate}`);
                const data = await response.json();
                setTrips(data);
            } catch (error) {
                console.error("Erro ao buscar viagens:", error);
            }
        };

        fetchTrips();
    }, [selectedDate]);

    const handleVoltar = () => {
        const agendaStateGuardado = JSON.parse(localStorage.getItem("agendaStateGuardado"));
        navigate("/agenda", { state: agendaStateGuardado });
    };

    const handleTripClick = (tripId) => {
        ////console.log(`🆕 Viagem selecionada: ${tripId}`);
        setSelectedTripId(tripId);
        // Atualiza o localStorage se necessário
        localStorage.setItem("selectedTripId", tripId);
    };

    return (
        <div style={{ padding: "10px" }}>
            <h2>Viagens para {moment(selectedDate).format("DD/MM/YYYY")}</h2>
            <button 
                onClick={handleVoltar}
                style={{
                    padding: "10px 10px",
                    backgroundColor: "darkred",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)"
                }}
            >
                ← Voltar
            </button>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                {trips.length > 0 ? (
                    trips.map((trip) => (
                        <div 
                            key={trip.id} 
                            onClick={() => handleTripClick(trip.id)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                backgroundColor: trip.id === selectedTripId ? "white" : "darkred",
                                color: trip.id === selectedTripId ? "darkred" : "white",
                                border: trip.id === selectedTripId ? "2px solid darkred" : "none",
                                transition: "background-color 0.3s, border 0.3s",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                        >
                            <strong>{trip.origem} → {trip.destino}</strong>
                        </div>
                    ))
                ) : (
                    <p>Nenhuma viagem agendada para este dia.</p>
                )}

                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        backgroundColor: "darkred",
                        color: "white",
                        padding: "10px",
                        borderRadius: "40%",
                        fontSize: "20px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    +
                </button>
            </div>

            <CreateTripModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                date={selectedDate}  
                onTripCreated={handleTripCreated}  
            />

            {/* Exibe Reservation apenas se o utilizador clicar numa viagem */}
            {selectedTripId && !isNaN(selectedTripId) && Number(selectedTripId) > 0 && (
                <Reservation tripId={Number(selectedTripId)} key={selectedTripId} />
            )}
        </div>
    );
};

export default TripsList;
