import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import Modal from "react-modal";

import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt";
import "react-big-calendar/lib/css/react-big-calendar.css";
import * as XLSX from "xlsx";
import axios from "axios";
const getToken = () => localStorage.getItem("token");


const localizer = momentLocalizer(moment);
moment.locale("pt");

const Agenda = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTerm3, setSearchTerm3] = useState("");
    const location = useLocation();
    const [openReservations, setOpenReservations] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);

    const agendaState = location.state;
// logo depois do openReservations / isModalOpen
const [blacklistReservations, setBlacklistReservations] = useState([]);
const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
const [searchTermBL, setSearchTermBL] = useState("");

    

const filteredReservations = openReservations.filter((res) => {
    const termo = searchTerm3.toLowerCase();
    return (
        res.reserva?.toString().toLowerCase().includes(termo) ||
        `${res.nomePassageiro} ${res.apelidoPassageiro}`.toLowerCase().includes(termo) ||
        res.telefone?.toLowerCase().includes(termo)
    );
});


// Logo no início do Agenda.jsx
useEffect(() => {
    // Assim que Agenda é montado, limpa o antigo searchFilter
    localStorage.removeItem("searchFilter");
  }, []);
  

    useEffect(() => {
        if (agendaState) {
            setDate(agendaState.date);
            setView(agendaState.view);
            // e assim por diante...
        }
    }, [agendaState]);
    // Limpar localStorage assim que o componente Agenda é montado
    useEffect(() => {
        if (!localStorage.getItem("agendaStateGuardado")) {
            localStorage.removeItem("selectedDate");
            localStorage.removeItem("selectedTripId");
        }
    }, []);

    const [tripsSummary, setTripsSummary] = useState({});
    const [trips, setTrips] = useState([]);
    const [view, setView] = useState("month");
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchFullName, setSearchFullName] = useState("");
    const [availableMonths, setAvailableMonths] = useState([]);


    const [citiesByCountry, setCitiesByCountry] = useState({ Portugal: [], Suiça: [] });

useEffect(() => {
  const fetchCities = async () => {
    try {
      const res = await fetch("https://nunes.entigra.pt/backend/cities",{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      });
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


const handleShowOpenReturnReservations = async () => {
    try {
        const response = await fetch("https://nunes.entigra.pt/backend/reservations/volta/aberto",{
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`
            }
            
          });
        if (!response.ok) throw new Error("Erro ao buscar reservas em aberto.");

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            alert("Nenhuma reserva com volta em aberto encontrada.");
            return;
        }

        setOpenReservations(data);
        setIsModalOpen(true);
    } catch (error) {
        console.error("❌ Erro ao buscar reservas em aberto:", error);
        alert("Erro ao carregar reservas em aberto.");
    }
};

const handleShowBlacklist = async () => {
    try {
      const res = await fetch("https://nunes.entigra.pt/backend/api/blacklist",{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      }); // adapta à tua rota
      if (!res.ok) throw new Error("Erro ao buscar Lista Negra");
      const data = await res.json();
  
      if (!Array.isArray(data) || data.length === 0) {
        alert("Nenhuma reserva eliminada encontrada.");
        return;
      }
  
      setBlacklistReservations(data);
      setIsBlacklistModalOpen(true);
    } catch (err) {
      console.error("❌ Erro ao buscar black‑list:", err);
      alert("Erro ao carregar reservas eliminadas.");
    }
  };


  const handleDelete = async (id) => {
    const confirm = window.confirm("Tens a certeza que queres eliminar esta reserva da lista negra?");
    if (!confirm) return;
  
    try {
      await axios.delete(`https://nunes.entigra.pt/backend/api/blacklist/${id}`,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      });
      setBlacklistReservations(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      alert("Ocorreu um erro ao eliminar a reserva da lista negra.");
    }
  };
  
  
  

  const filteredBlacklist = blacklistReservations.filter((res) => {
    const termo = searchTermBL.toLowerCase();
    return (
      res.reserva?.toString().toLowerCase().includes(termo) ||
      `${res.nomePassageiro} ${res.apelidoPassageiro}`.toLowerCase().includes(termo) ||
      res.telefone?.toLowerCase().includes(termo)
    );
  });
  
    useEffect(() => {
        const fetchTripsSummary = async () => {
            try {
                const response = await fetch("https://nunes.entigra.pt/backend/trips/summary",{
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getToken()}`
                    }
                    
                  });
                if (!response.ok) {
                    throw new Error(`Erro na API: ${response.statusText}`);
                }
                const tripsData = await response.json();

                if (!Array.isArray(tripsData)) {
                    console.error("❌ Dados inválidos recebidos:", tripsData);
                    return;
                }

                const monthsSet = new Set();

                const detailedTripsPromises = tripsData.map(async (trip) => {
                    const tripMonth = moment(trip.dataviagem).format("YYYY-MM");
                    monthsSet.add(tripMonth);

                    const nomes = trip.nomes_viagens ? trip.nomes_viagens.split(", ") : [];
                    const partidas = trip.horas_partida ? trip.horas_partida.split(", ") : [];
                    const chegadas = trip.horas_chegada ? trip.horas_chegada.split(", ") : [];
                    const ids = trip.ids_viagens ? trip.ids_viagens.split(", ").map(id => parseInt(id)) : [];

                    const events = await Promise.all(ids.map(async (id, index) => {
                        const startTime = moment(`${trip.dataviagem} ${partidas[index] || "00:00"}`, "YYYY-MM-DD HH:mm").toDate();
                        const endTime = moment(`${trip.dataviagem} ${chegadas[index] || "23:59"}`, "YYYY-MM-DD HH:mm").toDate();

                        // Normalizar a string de direção para facilitar a comparação (remove acentos e passa para minúsculas)
                        const directionRaw = nomes[index].trim();
                        const directionNormalized = directionRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                        
                        try {
                            const detailResponse = await fetch(`https://nunes.entigra.pt/backend/trips/${id}`,{
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${getToken()}`
                                }
                                
                              });
                            if (!detailResponse.ok) throw new Error("Erro ao buscar detalhes da viagem");
                            const tripDetail = await detailResponse.json();
                            const busName = tripDetail.Bus ? tripDetail.Bus.nome : "Autocarro Desconhecido";
                            const totalSeats = tripDetail.Bus ? tripDetail.Bus.nlugares : 0;

                            const seatsResponse = await fetch(`https://nunes.entigra.pt/backend/trips/${id}/available-seats`,{
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${getToken()}`
                                }
                                
                              });
                            let occupiedSeats = "?";
                            if (seatsResponse.ok) {
                                const availableSeats = await seatsResponse.json();
                                occupiedSeats = totalSeats - availableSeats.length;
                            }

                            return {
                                title: `${nomes[index].split("-")[0].trim()}`,

                                start: startTime,
                                end: endTime,


                                // Guarda a direção normalizada (ex.: "portugal - suica" ou "suica - portugal")
                                direction: directionNormalized
                            };
                        } catch (error) {
                            console.error("Erro ao obter detalhes para a viagem", id, error);
                            return {
                                title: `${nomes[index]} - 🚌 N/D (${id})`,
                                start: startTime,
                                end: endTime,
                                direction: directionNormalized
                            };
                        }
                    }));
                    return events;
                });

                const detailedTripsArrays = await Promise.all(detailedTripsPromises);
                const detailedTrips = detailedTripsArrays.flat();

                setAvailableMonths(Array.from(monthsSet).sort());
                setTrips(detailedTrips);
                setLoading(false);
            } catch (error) {
                console.error("❌ Erro ao buscar viagens:", error);
                setLoading(false);
            }
        };

        fetchTripsSummary();
    }, []);



    


    // Função para pesquisar reserva por número e abrir a viagem associada
    // Exemplo para handleSearch() por número de reserva
const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const response = await fetch(`https://nunes.entigra.pt/backend/reservations/by-reserva/${searchTerm}`,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      });
      const reservation = await response.json();
  
      if (reservation && reservation.tripId && reservation.Trip && reservation.Trip.dataviagem) {
        // Guardas no localStorage
        localStorage.setItem("selectedDate", reservation.Trip.dataviagem);
        localStorage.setItem("selectedTripId", reservation.tripId);
  
        // NEW: guardar tb o termo pesquisado
        localStorage.setItem("searchFilter", searchTerm);
  
        navigate("/trips");
      } else {
        alert("Reserva não encontrada ou viagem sem data de viagem");
      }
    } catch (error) {
      console.error("Erro ao procurar reserva:", error);
      alert("Erro ao procurar reserva");
    }
  };
  

    // Função para pesquisar reserva pelo Nome e Apelido
    const handleSearchPassengerName = async () => {
        if (!searchFullName.trim()) {
            alert("Por favor, insira o nome e apelido do passageiro.");
            return;
        }
        const nameParts = searchFullName.trim().split(" ");
        if (nameParts.length < 2) {
            alert("Por favor, insira o nome completo (Nome e Apelido).");
            return;
        }
        const nome = nameParts[0];
        const apelido = nameParts.slice(1).join(" ");
        try {
            const response = await fetch(`https://nunes.entigra.pt/backend/reservations/by-passageiro/${nome}/${apelido}`,{
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`
                }
                
              });
            if (!response.ok) {
                console.error("Erro HTTP:", response.status);
                alert(`Erro ao procurar reserva: ${response.status}`);
                return;
            }
            let data = await response.json();
            ////////console.log("🔍 Resposta da API para pesquisa por nome:", data);
            const reservations = Array.isArray(data) ? data : [data];
            if (reservations.length === 0) {
                alert("Nenhuma reserva encontrada para este passageiro.");
                return;
            }
            const options = reservations
                .map((res, index) => `${index + 1}. ${res.reserva} - ${formatDate(res.Trip.dataviagem)} (${res.Trip.origem} → ${res.Trip.destino})`)
                .join("\n");
            const choice = prompt(`Escolha uma reserva:\n${options}`);
            if (choice) {
                const selectedIndex = parseInt(choice) - 1;
                if (selectedIndex >= 0 && selectedIndex < reservations.length) {
                    const selectedReservation = reservations[selectedIndex];
                    localStorage.setItem("selectedDate", selectedReservation.Trip.dataviagem);
                    localStorage.setItem("selectedTripId", selectedReservation.tripId);
                    navigate("/trips");
                } else {
                    alert("Escolha inválida.");
                }
            }
        } catch (error) {
            console.error("Erro ao procurar reserva:", error);
            alert("Erro ao procurar reserva.");
        }
    };

    // Função para pesquisar reserva por telefone
    const handleSearchPhone = async () => {
        if (!searchTerm1) return;
        try {
            const response = await fetch(`https://nunes.entigra.pt/backend/reservations/by-telefone/${searchTerm1}`,{
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`
                }
                
              });
            if (!response.ok) {
                console.error("Erro HTTP:", response.status);
                alert(`Erro ao procurar reserva: ${response.status}`);
                return;
            }
            let data = await response.json();
            ////////console.log("🔍 Resposta da API para pesquisa por telefone:", data);
            const reservations = Array.isArray(data) ? data : [data];
            if (reservations.length === 0) {
                alert("Nenhuma reserva encontrada para este telefone.");
                return;
            }
            const options = reservations
                .map((res, index) => `${index + 1}. ${res.reserva} - ${formatDate(res.Trip.dataviagem)} (${res.Trip.origem} → ${res.Trip.destino})`)
                .join("\n");
            const choice = prompt(`Escolha uma reserva:\n${options}`);
            if (choice) {
                const selectedIndex = parseInt(choice) - 1;
                if (selectedIndex >= 0 && selectedIndex < reservations.length) {
                    const selectedReservation = reservations[selectedIndex];
                    localStorage.setItem("selectedDate", selectedReservation.Trip.dataviagem);
                    localStorage.setItem("selectedTripId", selectedReservation.tripId);
                    navigate("/trips");
                } else {
                    alert("Escolha inválida.");
                }
            }
        } catch (error) {
            console.error("Erro ao procurar reserva:", error);
            alert("Erro ao procurar reserva.");
        }
    };

    const handleEventClick = (event) => {
        // Guarda o estado atual da Agenda
        localStorage.setItem("agendaStateGuardado", JSON.stringify({ date, view }));
        const formattedDate = moment(event.start).format("YYYY-MM-DD");
        localStorage.setItem("selectedDate", formattedDate);
        navigate("/trips");
    };
    

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    // Função que define a cor do evento com base na direção
    const getEventColor = (event) => {
        const normalize = (str) =>
          (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      
        const [origem, destino] = event.direction.split("-").map(s => normalize(s));
      
        const ptCities = citiesByCountry["Portugal"].map(normalize);
        const chCities = citiesByCountry["Suiça"].map(normalize);
      
        const origemIsPT = origem === "portugal" || ptCities.includes(origem);
        const destinoIsCH = destino === "suica" || chCities.includes(destino);
        const origemIsCH = origem === "suica" || chCities.includes(origem);
        const destinoIsPT = destino === "portugal" || ptCities.includes(destino);
      
        if (origemIsPT && destinoIsCH) return "green";
        if (origemIsCH && destinoIsPT) return "darkred";
      
        return "lightgray";
      };
      

    const eventPropGetter = (event) => {
        return {
            style: {
                backgroundColor: getEventColor(event),
                color: "white",
                borderRadius: "5px",
                padding: "5px",
            },
        };
    };

    const handleMonthChange = (event) => {
        const [year, month] = event.target.value.split("-");
        setDate(moment(`${year}-${month}-01`, "YYYY-MM-DD").toDate());
    };

    const handleDateClick = (date) => {
        const formattedDate = moment(date).format("YYYY-MM-DD");
        localStorage.setItem("selectedDate", formattedDate);
        navigate("/trips");
    };

    return (
        <div style={{ height: "85vh", padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", margin: "0 0 20px 0", color: "darkred", fontSize: "28px" }}>
                Agenda de Viagens
            </h2>

            {/* Componente de pesquisa */}
            <div style={{
                marginBottom: "25px",
                background: "#f5f5f5",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}>
                <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333", fontSize: "18px" }}>Pesquisar Reservas</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {/* Linha 1 */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1", minWidth: "250px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Número de Reserva</label>
                            <div style={{ display: "flex" }}>
                                <input
                                    type="text"
                                    placeholder="Ex: 0001"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: "10px",
                                        flex: "1",
                                        borderRadius: "5px 0 0 5px",
                                        border: "1px solid #ccc",
                                        fontSize: "14px"
                                    }}
                                />
                                <button
                                    onClick={handleSearch}
                                    style={{
                                        padding: "10px 15px",
                                        borderRadius: "0 5px 5px 0",
                                        background: "darkred",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    <span style={{ marginRight: "5px" }}>🔍</span> Procurar
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: "1", minWidth: "250px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Telefone</label>
                            <div style={{ display: "flex" }}>
                                <input
                                    type="text"
                                    placeholder="Ex: 912345678"
                                    value={searchTerm1}
                                    onChange={(e) => setSearchTerm1(e.target.value)}
                                    style={{
                                        padding: "10px",
                                        flex: "1",
                                        borderRadius: "5px 0 0 5px",
                                        border: "1px solid #ccc",
                                        fontSize: "14px"
                                    }}
                                />
                                <button
                                    onClick={handleSearchPhone}
                                    style={{
                                        padding: "10px 15px",
                                        borderRadius: "0 5px 5px 0",
                                        background: "darkred",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    <span style={{ marginRight: "5px" }}>📱</span> Procurar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Linha 2 */}
                    <div style={{ flex: "1" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nome do Passageiro</label>
                        <div style={{ display: "flex" }}>
                            <input
                                type="text"
                                placeholder="Ex: João Silva"
                                value={searchFullName}
                                onChange={(e) => setSearchFullName(e.target.value)}
                                style={{
                                    padding: "10px",
                                    flex: "1",
                                    borderRadius: "5px 0 0 5px",
                                    border: "1px solid #ccc",
                                    fontSize: "14px"
                                }}
                            />
                            <button
                                onClick={handleSearchPassengerName}
                                style={{
                                    padding: "10px 15px",
                                    borderRadius: "0 5px 5px 0",
                                    background: "darkred",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center"
                                }}
                            >
                                <span style={{ marginRight: "5px" }}>👤</span> Procurar
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
            

            {/* Área do calendário */}
<div style={{
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    marginBottom: "20px"
}}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
       

    <button
    onClick={handleShowOpenReturnReservations}
    style={{
        padding: "10px 20px",
        backgroundColor: "darkgreen",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px"
    }}
>
    📋 Ver Reservas em Aberto
</button>

<button
  onClick={handleShowBlacklist}
  style={{
    padding: "10px 20px",
    backgroundColor: "black",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px"
  }}
>
  🗑️ Lista Negra
</button>


    </div>

                {/* Se houver meses disponíveis, exibe o seletor */}
                {availableMonths.length > 0 && (
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <select
                            value={moment(date).format("YYYY-MM")}
                            onChange={handleMonthChange}
                            style={{
                                padding: "10px",
                                fontSize: "16px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            {availableMonths.map((month) => (
                                <option key={month} value={month}>
                                    {moment(month, "YYYY-MM").format("MMMM YYYY")}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {loading ? (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "300px",
                        fontSize: "18px",
                        color: "#666"
                    }}>
                        <p>A carregar viagens...</p>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        selectable
                        events={trips}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        culture="pt"
                        eventPropGetter={eventPropGetter}
                        view={view}
                        onView={setView}
                        date={date}
                        onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}

                        onNavigate={setDate}
                        onSelectEvent={handleEventClick}
                        messages={{
                            today: "Hoje",
                            previous: "Anterior",
                            next: "Próximo",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            agenda: "Agenda",
                        }}
                    />
                )}
            </div>

            {/* Legenda da Agenda */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "15px",
                justifyContent: "center",
                background: "#f5f5f5",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "0.9rem"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: "white",
                            border: "1px solid black",
                            borderRadius: "4px"
                        }}
                    ></div>
                    <span>Sem viagens</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "lightblue",
                        borderRadius: "4px"
                    }}></div>
                    <span>Hoje</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "darkred",
                        borderRadius: "4px"
                    }}></div>
                    <span>Suiça - Portugal</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "green",
                        borderRadius: "4px"
                    }}></div>
                    <span>Portugal - Suiça</span>
                </div>
            </div>
            <Modal
    isOpen={isModalOpen}
    onRequestClose={() => setIsModalOpen(false)}
    contentLabel="Reservas com Volta em Aberto"
    style={{
        overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 9999, // garante que esteja à frente de tudo
        },
        content: {
            maxWidth: "90%",
            maxHeight: "80vh",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
        }
    }}
>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ color: "darkred", margin: 0 }}>Reservas com Volta em Aberto</h2>
        <button
            onClick={() => setIsModalOpen(false)}
            style={{
                fontSize: "20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#555"
            }}
        >
            ❌
        </button>
    </div>
    <input
    type="text"
    placeholder="Pesquisar por reserva, nome ou telefone..."
    value={searchTerm3}
    onChange={(e) => setSearchTerm3(e.target.value)}
    style={{
        padding: "8px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        width: "100%",
        marginBottom: "10px"
    }}
/>
    <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ddd", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#f9f9f9", zIndex: 1 }}>
                <tr>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Reserva</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Passageiro</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Telefone</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Data</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Origem → Destino</th>
                </tr>
            </thead>
            <tbody>
            {filteredReservations.map((res, index) => (
      <tr
      key={index}
      onClick={() => {
        if (res.Trip?.dataviagem && res.tripId) {
          // Se o input de pesquisa estiver vazio, usa o valor da reserva em vez disso
          const filtro =
            searchTerm3.trim() !== "" ? searchTerm3.trim() : res.reserva.toString().trim();
          console.log("Valor do filtro que vai ser guardado:", filtro);
          localStorage.setItem("searchFilter", filtro);
          localStorage.setItem("selectedDate", res.Trip.dataviagem);
          localStorage.setItem("selectedTripId", res.tripId);
          setIsModalOpen(false);
          navigate("/trips");
        } else {
          alert("Dados da viagem não encontrados para esta reserva.");
        }
      }}
      style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
    >
      <td style={{ padding: "8px" }}>{res.reserva}</td>
      <td style={{ padding: "8px" }}>{res.nomePassageiro} {res.apelidoPassageiro}</td>
      <td style={{ padding: "8px" }}>{res.telefone}</td>
      <td style={{ padding: "8px" }}>{res.Trip?.dataviagem || "-"}</td>
      <td style={{ padding: "8px" }}>{res.Trip?.origem} → {res.Trip?.destino}</td>
    </tr>
    

 
 
  
))}


            </tbody>
        </table>
    </div>
</Modal>
<Modal
  isOpen={isBlacklistModalOpen}
  onRequestClose={() => setIsBlacklistModalOpen(false)}
  contentLabel="Reservas Eliminadas"
  style={{
    overlay: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999 },
    content: {
      maxWidth: "90%", maxHeight: "80vh", margin: "auto",
      padding: "20px", borderRadius: "10px", overflow: "hidden",
      display: "flex", flexDirection: "column"
    }
  }}
>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
    <h2 style={{ color: "darkslateblue", margin: 0 }}>Reservas Eliminadas (Lista Negra)</h2>
    <button
      onClick={() => setIsBlacklistModalOpen(false)}
      style={{ fontSize: "20px", background: "transparent", border: "none", cursor: "pointer", color: "#555" }}
    >
      ❌
    </button>
  </div>

  <input
    type="text"
    placeholder="Pesquisar por reserva, nome ou telefone..."
    value={searchTermBL}
    onChange={(e) => setSearchTermBL(e.target.value)}
    style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%", marginBottom: "10px" }}
  />

  <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ddd", borderRadius: "8px" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead style={{ position: "sticky", top: 0, backgroundColor: "#f9f9f9", zIndex: 1 }}>
        <tr>
          <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Reserva</th>
          <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Passageiro</th>
          <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Telefone</th>
          <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Origem → Destino</th>
        </tr>
      </thead>
      <tbody>
  {filteredBlacklist.map((res, i) => (
    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
      <td style={{ padding: "8px" }}>{res.reserva}</td>
      <td style={{ padding: "8px" }}>{res.nomePassageiro} {res.apelidoPassageiro}</td>
      <td style={{ padding: "8px" }}>{res.telefone}</td>
      <td style={{ padding: "8px" }}>{res.entrada} → {res.saida}</td>
      
      <td style={{ padding: "8px", textAlign: "center" }}>
  <button
    onClick={() => handleDelete(res.id)}
    style={{
      color: "darkred",
      border: "none",
    

    }}
  >
    x
  </button>
</td>


    </tr>
  ))}
</tbody>

    </table>
  </div>
</Modal>



        </div>
    );
};

export default Agenda;
