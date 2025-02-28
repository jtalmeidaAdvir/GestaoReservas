import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import CreateTripModal from "./CreateTripModal";
import Reservation from "../Reservation/Reservation";

const TripsList = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(localStorage.getItem("selectedDate") || moment().format("YYYY-MM-DD"));
    const [selectedTripId, setSelectedTripId] = useState(null);


    const handleTripCreated = (newTrip) => {
        setTrips((prevTrips) => [newTrip, ...prevTrips]); // Adiciona a nova viagem à lista
    };
    // Lê o tripId do localStorage na montagem:
useEffect(() => {
    const storedTripId = localStorage.getItem("selectedTripId");
    if (storedTripId) {
      setSelectedTripId(Number(storedTripId));
    }
  }, []);
  
    useEffect(() => {
        console.log(`🔍 Buscando viagens para a data: ${selectedDate}`);

        const fetchTrips = async () => {
            try {
                const response = await fetch(`http://192.168.1.18:3000/trips/date?date=${selectedDate}`);
                const data = await response.json();
                setTrips(data);
            } catch (error) {
                console.error("Erro ao buscar viagens:", error);
            }
        };

        fetchTrips();
    }, [selectedDate]);


    

    const handleTripClick = (tripId) => {
        console.log(`🆕 Viagem selecionada: ${tripId}`);
        setSelectedTripId(tripId);
        // Se quiseres, podes também actualizar no localStorage para manter a selecção
        localStorage.setItem("selectedTripId", tripId);
      };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Viagens para {moment(selectedDate).format("DD/MM/YYYY")}</h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                {trips.length > 0 ? (
                    trips.map((trip) => (
                        <div 
                            key={trip.id} 
                            onClick={() => handleTripClick(trip.id)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                backgroundColor: trip.id === selectedTripId ? "white" : "darkred", // Alteração aqui
                                color: trip.id === selectedTripId ? "darkred" : "white", // Alteração aqui
                                border: trip.id === selectedTripId ? "2px solid darkred" : "none", // Adiciona um destaque
                                transition: "background-color 0.3s, border 0.3s", // Animação para suavizar a mudança
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
                    }}>
                    +
                </button>
            </div>

            <CreateTripModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                date={selectedDate}  
                onTripCreated={handleTripCreated}  
            />

            {/* Exibir reservas apenas após selecionar uma viagem */}
            {selectedTripId && !isNaN(selectedTripId) && Number(selectedTripId) > 0 && (
                <>
                    <Reservation tripId={Number(selectedTripId)} key={selectedTripId} />
                </>
            )}



        </div>
    );
};

export default TripsList;
