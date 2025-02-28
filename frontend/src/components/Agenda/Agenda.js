import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
moment.locale("pt");

const Agenda = () => {
    const navigate = useNavigate();

    // Limpar localStorage assim que o componente Agenda é montado
    useEffect(() => {
        localStorage.removeItem("selectedDate");
        localStorage.removeItem("selectedTripId");
    }, []);

    const [tripsSummary, setTripsSummary] = useState({});
    const [trips, setTrips] = useState([]);
    const [view, setView] = useState("month");
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchFullName, setSearchFullName] = useState("");



    useEffect(() => {
        const fetchTripsSummary = async () => {
            try {
                const response = await fetch("https://backendreservasnunes.advir.pt/trips/summary");
                const data = await response.json();

                console.log("📅 Dados recebidos no frontend:", data);

                const formattedTrips = {};
                const detailedTrips = [];

                data.forEach(trip => {
                    formattedTrips[trip.dataviagem] = {
                        total: parseInt(trip.total_viagens),
                        nomes: trip.nomes_viagens || ""
                    };

                    // ✅ Separar os nomes das viagens e os horários
                    const nomes = trip.nomes_viagens.split(", ");
                    const partidas = trip.horas_partida.split(", ");
                    const chegadas = trip.horas_chegada.split(", ");

                    nomes.forEach((rota, index) => {
                        if (partidas[index] && chegadas[index]) {
                            const startTime = moment(`${trip.dataviagem} ${partidas[index]}`, "YYYY-MM-DD HH:mm").toDate();
                            const endTime = moment(`${trip.dataviagem} ${chegadas[index]}`, "YYYY-MM-DD HH:mm").toDate();

                            detailedTrips.push({
                                title: `${rota}`,
                                start: startTime,
                                end: endTime,
                            });
                        }
                    });
                });

                setTripsSummary(formattedTrips);
                setTrips(detailedTrips);
                setLoading(false);
            } catch (error) {
                console.error("Erro ao Procurar resumo das viagens:", error);
                setLoading(false);
            }
        };

        fetchTripsSummary();
    }, []);

    // Função para pesquisar reserva por número e abrir a viagem associada
const handleSearch = async () => {
        if (!searchTerm) return;

        try {
            const response = await fetch(
                `https://backendreservasnunes.advir.pt/reservations/by-reserva/${searchTerm}`
            );
            const reservation = await response.json();

            if (reservation && reservation.tripId && reservation.Trip && reservation.Trip.dataviagem) {
                localStorage.setItem("selectedDate", reservation.Trip.dataviagem);
                localStorage.setItem("selectedTripId", reservation.tripId);
                navigate("/trips");
            } else {
                alert("Reserva não encontrada ou trip sem dataviagem");
            }

        } catch (error) {
            console.error("Erro ao Procurar reserva:", error);
            alert("Erro ao Procurar reserva");
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

    const nome = nameParts[0]; // Primeiro nome
    const apelido = nameParts.slice(1).join(" "); // Resto como apelido

    try {
        const response = await fetch(
            `https://backendreservasnunes.advir.pt/reservations/by-passageiro/${nome}/${apelido}`
        );

        if (!response.ok) {
            console.error("Erro HTTP:", response.status);
            alert(`Erro ao Procurar reserva: ${response.status}`);
            return;
        }

        let data = await response.json();
        console.log("🔍 Resposta da API para pesquisa por nome:", data);

        const reservations = Array.isArray(data) ? data : [data];

        if (reservations.length === 0) {
            alert("Nenhuma reserva encontrada para este passageiro.");
            return;
        }

        // Mostrar opções se houver mais de uma reserva
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
        console.error("Erro ao Procurar reserva:", error);
        alert("Erro ao Procurar reserva.");
    }
};
    // Função para pesquisar reserva por número e abrir a viagem associada
const handleSearchPhone = async () => {
        if (!searchTerm1) return;
    
        try {
            const response = await fetch(`https://backendreservasnunes.advir.pt/reservations/by-telefone/${searchTerm1}`);
            
            if (!response.ok) {
                console.error("Erro HTTP:", response.status);
                alert(`Erro ao Procurar reserva: ${response.status}`);
                return;
            }
    
            let data = await response.json();
            console.log("🔍 Resposta da API para pesquisa por telefone:", data);
    
            // **Forçar a conversão para array**, mesmo se a resposta for um único objeto
            const reservations = Array.isArray(data) ? data : [data];
    
            if (reservations.length === 0) {
                alert("Nenhuma reserva encontrada para este telefone.");
                return;
            }
            
    
            // **Sempre mostrar opções, mesmo que seja apenas 1 reserva**
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
            console.error("Erro ao Procurar reserva:", error);
            alert("Erro ao Procurar reserva.");
        }
    };
    
    
    
    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };
    

    const getEventColor = (date) => {
        const formattedDate = moment(date).format("YYYY-MM-DD");
        const today = moment().format("YYYY-MM-DD");
        const fiveDaysAfter = moment().add(5, "days").format("YYYY-MM-DD");
        const tripData = tripsSummary[formattedDate];

        if (formattedDate === today) {
            return "lightblue"; // 🔹 Cor azul para o dia atual
        }
        if (moment(formattedDate).isBefore(today)) {
            return "white"; // Passado
        }
        if (
            moment(formattedDate).isAfter(today) &&
            moment(formattedDate).isSameOrBefore(fiveDaysAfter) &&
            tripData
        ) {
            return "#ffeb3b"; // Amarelo (próximos 5 dias com viagens)
        }
        if (moment(formattedDate).isAfter(fiveDaysAfter) && tripData) {
            return "lightgreen"; // Verde (viagens depois dos 5 dias)
        }
        return "transparent"; // Sem viagem
    };

    const dayPropGetter = (date) => {
        return { style: { backgroundColor: getEventColor(date), color: "black" } };
    };

    const eventPropGetter = (event) => {
        return {
            style: {
                backgroundColor: getEventColor(event.start),
                color: "black",
                borderRadius: "5px",
                padding: "5px",
            },
        };
    };

    const handleDateClick = (date) => {
        const formattedDate = moment(date).format("YYYY-MM-DD");
        localStorage.setItem("selectedDate", formattedDate);
        navigate("/trips");
    };

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const components = {
        month: {
            dateHeader: ({ date }) => {
                const formattedDate = moment(date).format("YYYY-MM-DD");
                const tripData = tripsSummary[formattedDate];

                return (
                    <div style={{ textAlign: "center", fontWeight: "bold" }}>
                        {moment(date).format("D")}
                        {tripData && (
                            <div style={{ fontSize: "0.8rem", color: "black" }}>
                                {tripData.total} {tripData.total === 1 ? "viagem" : "viagens"}
                            </div>
                        )}
                    </div>
                );
            },
        },
        event: (props) => <EventComponent {...props} view={view} getEventColor={getEventColor} />
    };

    return (
        <div style={{ height: "85vh", padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", margin: "0 0 20px 0", color: "darkred", fontSize: "28px" }}>Agenda de Viagens</h2>
            
            {/* Componente de pesquisa melhorado */}
            <div style={{ 
                marginBottom: "25px", 
                background: "#f5f5f5", 
                padding: "20px", 
                borderRadius: "8px", 
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}>
                <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333", fontSize: "18px" }}>Pesquisar Reservas</h3>
                
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "15px" 
                }}>
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
                        events={view === "week" || view === "day" ? trips : []}
                        onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        culture="pt"
                        dayPropGetter={dayPropGetter}
                        eventPropGetter={eventPropGetter}
                        view={view}
                        onView={(newView) => setView(newView)}
                        date={date}
                        onNavigate={handleNavigate}
                        views={["month", "week", "day", "agenda"]}
                        toolbar={true}
                        components={components}
                        messages={{
                            today: "Hoje",
                            previous: "Anterior",
                            next: "Próximo",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            agenda: "Agenda"
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
                    <span>Passado</span>
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
                        backgroundColor: "#ffeb3b",
                        borderRadius: "4px" 
                    }}></div>
                    <span>Próximos 5 dias com viagens</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ 
                        width: "20px", 
                        height: "20px", 
                        backgroundColor: "lightgreen",
                        borderRadius: "4px" 
                    }}></div>
                    <span>Viagens agendadas</span>
                </div>
            </div>
        </div>
    );
};

// 🔹 Componente para exibir detalhes das viagens apenas em "week" e "day"
const EventComponent = ({ event, view, getEventColor }) => {
    return (
        <div
            style={{
                padding: "5px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                backgroundColor: getEventColor(event.start),
                borderRadius: "5px",
            }}
        >
            {view === "week" || view === "day" ? (
                <>
                    <div>{event.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "#555" }}></div>
                </>
            ) : null}
        </div>
    );
};

export default Agenda;
