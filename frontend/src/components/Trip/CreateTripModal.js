import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import moment from "moment";

Modal.setAppElement("#root");

const CreateTripModal = ({ isOpen, onClose, date, onTripCreated }) => {
    const [origem, setOrigem] = useState("");
    const [destino, setDestino] = useState("");
    const [motorista, setMotorista] = useState("");
    const [busId, setBusId] = useState("");
    const [horaPartida, setHoraPartida] = useState("");
    const [horaChegada, setHoraChegada] = useState("");
    const [buses, setBuses] = useState([]);
    const [cities, setCities] = useState([]); // Adicionando estado para cidades

    useEffect(() => {
        if (isOpen && date) {
            const formattedDate = moment(date).format("YYYY-MM-DD");
    
            // Buscar autocarros disponíveis
            fetch(`https://backendreservasnunes.advir.pt/buses/available?date=${formattedDate}`)
                .then(response => response.json())
                .then(data => {
                    //console.log("📥 Resposta da API (buses disponíveis):", data);
    
                    // Filtrar apenas os autocarros ativos e ordená-los por nome
                    const activeSortedBuses = Array.isArray(data) 
                        ? data.filter(bus => bus.isActive).sort((a, b) => a.nome.localeCompare(b.nome))
                        : [];
    
                    setBuses(activeSortedBuses);
                });

            // Buscar cidades
            fetch(`https://backendreservasnunes.advir.pt/cities`)
                .then(response => response.json())
                .then(data => {
                    //console.log("📥 Resposta da API (cidades disponíveis):", data);
                    const sortedCities = Array.isArray(data)   ? data.filter(city => city.nome === 'Portugal' || city.nome === 'Suiça').sort((a, b) => a.nome.localeCompare(b.nome))
                    : [];
                setCities(sortedCities);
                })
                .catch(error => {
                    console.error("Erro ao carregar cidades:", error);
                    setCities([]);
                });
        }
    }, [isOpen, date]);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const formattedDate = moment(date).format("YYYY-MM-DD");
    
        const newTrip = {
            busId,
            dataViagem: formattedDate,
            origem,
            destino,
            motorista,
            horaPartida,
            horaChegada
        };
    
        try {
            const response = await fetch("https://backendreservasnunes.advir.pt/trips/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTrip),
            });
    
            if (!response.ok) throw new Error("Erro ao criar viagem");
    
            const createdTrip = await response.json();
    
            //console.log("✅ Viagem criada com sucesso:", createdTrip);
    
            // Chama a função para atualizar a lista de viagens
            onTripCreated(createdTrip);
    
            // Fecha o modal
            onClose();
        } catch (error) {
            console.error("Erro ao criar viagem:", error);
        }
    };
    

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                content: {
                    width: "320px",
                    height: "550px",
                    margin: "auto",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "2px solid darkred",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                }
            }}
        >
            <h2 style={{ textAlign: "center", fontSize: "18px", marginBottom: "10px" }}>
                {moment(date).format("DD/MM/YYYY")}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>

                {/* Dropdown de Origem */}
                <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    required
                    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
                >
                    <option value="">Selecione a origem</option>
                    {cities.map(city => (
                        <option key={city.id} value={city.nome}>
                            {city.nome}
                        </option>
                    ))}
                </select>

                {/* Dropdown de Destino */}
                <select
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    required
                    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
                >
                    <option value="">Selecione o destino</option>
                    {cities.map(city => (
                        <option key={city.id} value={city.nome}>
                            {city.nome}
                        </option>
                    ))}
                </select>

                {/* Dropdown de Autocarros */}
                <select
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    required
                    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
                >
                    <option value="">Selecione um autocarro</option>
                    {buses.length > 0 ? (
                        buses.map(bus => (
                            <option key={bus.id} value={bus.id}>
                                {bus.nome}
                            </option>
                        ))
                    ) : (
                        <option disabled>Nenhum disponível</option>
                    )}
                </select>

      
                {/* Definição de Horarios
                <input
                    type="time"
                    placeholder="Hora de Partida"
                    value={horaPartida}
                    onChange={(e) => setHoraPartida(e.target.value)}
                    
                    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
                />
                <input
                    type="time"
                    placeholder="Hora de Chegada"
                    value={horaChegada}
                    onChange={(e) => setHoraChegada(e.target.value)}
                    
                    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
                />
                */}

                <button type="submit" style={{
                    backgroundColor: "darkred",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%"
                }}>
                    Criar viagem
                </button>
            </form>
        </Modal>
    );
};

export default CreateTripModal;
