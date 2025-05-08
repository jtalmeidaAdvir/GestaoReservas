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
    // Estado para armazenar as cidades, similar à Agenda
    const [citiesByCountry, setCitiesByCountry] = useState({ Portugal: [], Suiça: [] });

    const location = useLocation();
    const agendaState = location.state;

    // Buscar as cidades usando o mesmo endpoint da Agenda
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await fetch("https://nunes.entigra.pt/backend/cities");
                const data = await res.json();
                const portugal = data.filter(c => c.isActive && c.Country?.nome === "Portugal").map(c => c.nome);
                const suica = data.filter(c => c.isActive && c.Country?.nome === "Suiça").map(c => c.nome);
                setCitiesByCountry({ Portugal: portugal, Suiça: suica });
            } catch (err) {
                console.error("Erro ao buscar cidades:", err);
            }
        };
        fetchCities();
    }, []);

    const handleTripCreated = (newTrip) => {
        setTrips((prevTrips) => [newTrip, ...prevTrips]); // Adiciona a nova viagem à lista
    };


    useEffect(() => {
        const storedTripId = localStorage.getItem("selectedTripId");
        if (storedTripId && trips.length > 0) {
            const exists = trips.some(t => t.id === Number(storedTripId));
            if (exists) {
                setSelectedTripId(Number(storedTripId));
            }
        }
    }, [trips]);
    

    useEffect(() => {
        ////console.log(`🔍 Buscando viagens para a data: ${selectedDate}`);
        const fetchTrips = async () => {
            try {
                const response = await fetch(`https://nunes.entigra.pt/backend/trips/date?date=${selectedDate}`);
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
        localStorage.setItem("selectedTripId", tripId);
    };

    // Função para definir a cor da viagem com base na origem e destino,
    // utilizando as listas de cidades obtidas do endpoint
    const getTripColor = (trip) => {
        const normalize = (str) =>
            (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const origem = normalize(trip.origem);
        const destino = normalize(trip.destino);

        const ptCities = citiesByCountry["Portugal"].map(normalize);
        const chCities = citiesByCountry["Suiça"].map(normalize);

        const origemIsPT = origem === "portugal" || ptCities.includes(origem);
        const destinoIsCH = destino === "suiça" || chCities.includes(destino);
        const origemIsCH = origem === "suiça" || chCities.includes(origem);
        const destinoIsPT = destino === "portugal" || ptCities.includes(destino);

        if (origemIsPT && destinoIsCH) return "green";
        if (origemIsCH && destinoIsPT) return "darkred";

        return "lightgray";
    };

    return (
        <div style={{ padding: "10px" }}>
            <h2>Viagens para {moment(selectedDate).format("DD/MM/YYYY")}</h2>
            

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
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
                {trips.length > 0 ? (
                    trips.map((trip) => (
                        <div 
                            key={trip.id} 
                            onClick={() => handleTripClick(trip.id)}
                            style={{
                                padding: "10px",
                                borderRadius: "10px",
                                backgroundColor: trip.id === selectedTripId ? "white" : getTripColor(trip),
                                color: trip.id === selectedTripId ? "darkred" : "white",
                                border: trip.id === selectedTripId ? "2px solid darkred" : "none",
                                transition: "background-color 0.3s, border 0.3s",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                        >
                            <strong>{trip.origem} → {trip.destino}</strong>
                            <strong> 🚌 {trip.Bus.nome}</strong>
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
