import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import moment from "moment";
const getToken = () => localStorage.getItem("token");

Modal.setAppElement("#root");

const CreateTripModal = ({ isOpen, onClose, date, onTripCreated, originCountry, destinationCountry }) => {
    const [origem, setOrigem] = useState("");
    const [destino, setDestino] = useState("");
    const [motorista, setMotorista] = useState("");
    const [busId, setBusId] = useState("");
    const [horaPartida, setHoraPartida] = useState("");
    const [horaChegada, setHoraChegada] = useState("");
    const [buses, setBuses] = useState([]);
    const [cities, setCities] = useState([]); // Adicionando estado para cidades

    const [filteredDestinations, setFilteredDestinations] = useState([]);

    const [originFiltered, setOriginFiltered] = useState([]);

    const normalize = (s) =>
        (s || "")
          .toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ç/g, "c")
          .replace(/ü/g, "u")
          .trim();
      

    useEffect(() => {
        if (isOpen && date) {
          // Buscar autocarros disponíveis
          fetch(`https://nunes.entigra.pt/backend/buses/available?date=${moment(date).format("YYYY-MM-DD")}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`
            }
            
          })
            .then(res => res.json())
            .then(data => {
              let activeBuses = Array.isArray(data) ? data.filter(b => b.isActive) : [];
      
              // Incluir o autocarro "vazio" se não estiver presente
              fetch("https://nunes.entigra.pt/backend/buses", {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`
                }
                
              })
                .then(resp => resp.json())
                .then(allBuses => {
                  const emptyBus = allBuses.find(b => b.nome === "vazio");
                  if (emptyBus && !activeBuses.some(b => b.id === emptyBus.id)) {
                    activeBuses = [emptyBus, ...activeBuses];
                  }
                  setBuses(activeBuses);
                });
            });
      
          // Buscar cidades
          fetch("https://nunes.entigra.pt/backend/cities", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`
            }
            
          })
            .then(res => res.json())
            .then(data => {
              const sorted = Array.isArray(data)
                ? data.sort((a, b) => a.nome.localeCompare(b.nome))
                : [];
              setCities(sorted);


              setCities(sorted);

// 👉 Se países não foram definidos, mostra todas as cidades
if (!originCountry || !destinationCountry) {
  setOriginFiltered(sorted);
  setFilteredDestinations(sorted);
  setOrigem("");
  setDestino("");
  return;
}

// Filtrar cidades por país
const originCities = sorted.filter(c =>
  normalize(c.Country?.nome) === normalize(originCountry)
);
const destinationCities = sorted.filter(c =>
  normalize(c.Country?.nome) === normalize(destinationCountry)
);

// Guardar filtros
setOriginFiltered(originCities);
setFilteredDestinations(destinationCities);

// Preencher origem/destino automaticamente
const pdl = sorted.find(c => normalize(c.nome) === "p.de.lanhoso");
const zurich = sorted.find(c => normalize(c.nome) === "zurich");

if (normalize(originCountry) === "portugal") {
  setOrigem(pdl?.nome || originCities[0]?.nome || "");
  setDestino(zurich?.nome || destinationCities[0]?.nome || "");
} else if (normalize(originCountry) === "suica" || normalize(originCountry) === "suiça") {
  setOrigem(zurich?.nome || originCities[0]?.nome || "");
  setDestino(pdl?.nome || destinationCities[0]?.nome || "");
}

              
      
              // Define as opções de destino com base no país de destino
              const filtered = sorted.filter(c =>
                normalize(c.Country?.nome) === normalize(destinationCountry)
              );
              setFilteredDestinations(filtered);
            })
            .catch(error => {
              console.error("Erro ao carregar cidades:", error);
              setCities([]);
            });
        }
      }, [isOpen, date, originCountry, destinationCountry]);
      
    


    const handleOrigemChange = (e) => {
        const selectedOrigem = e.target.value;
        setOrigem(selectedOrigem);
    
        const origemCity = cities.find(c => c.nome === selectedOrigem);
        if (!origemCity || !origemCity.Country) return setFilteredDestinations([]);
    
        const origemCountry = origemCity.Country.nome?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const destinoCountry = origemCountry === "portugal" ? "suica" : "portugal";
    
        const destinos = cities.filter(c =>
            c.Country &&
            c.Country.nome?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === destinoCountry
        );
    
        setFilteredDestinations(destinos);
    };
    

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
            const response = await fetch("https://nunes.entigra.pt/backend/trips/create", {
                method: "POST",
                 
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getToken()}`
                    },
                    
                  
                body: JSON.stringify(newTrip),
            });
    
            if (!response.ok) throw new Error("Erro ao criar viagem");
    
            const createdTrip = await response.json();

// Ir buscar a viagem completa com dados do autocarro
const res = await fetch(`https://nunes.entigra.pt/backend/trips/${createdTrip.id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    }
    
  })
const fullTrip = await res.json();

onTripCreated(fullTrip);

    
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
                overlay: {
                    zIndex: 9998 // ou superior a qualquer outro componente na tua app
                },
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
                    zIndex: 9999 // <-- aqui

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
    onChange={handleOrigemChange}
    required
    style={{ padding: "8px", border: "1px solid darkred", borderRadius: "5px", fontSize: "14px" }}
>

                    <option value="">Selecione a origem</option>
                    {originFiltered.map(city => (

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
    {filteredDestinations.map(city => (
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
