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
    const [availableMonths, setAvailableMonths] = useState([]);



    useEffect(() => {
        const fetchTripsSummary = async () => {
            try {
                const response = await fetch("https://backendreservasnunes.advir.pt/trips/summary");
                const data = await response.json();

                console.log("📅 Dados recebidos no frontend:", data);

                const detailedTrips = [];
                const monthsSet = new Set(); // Guardar os meses com viagens

                data.forEach(trip => {
                    const tripMonth = moment(trip.dataviagem).format("YYYY-MM");
                    monthsSet.add(tripMonth); // Adiciona o mês ao conjunto

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
                                direction: rota.includes("Suiça - Portugal") ? "suica-portugal" : 
                                           rota.includes("Portugal - Suiça") ? "portugal-suica" :
                                           rota.includes("Zurich - Póvoa De Lanhoso") ? "zurich-povoa" :
                                           rota.includes("Póvoa De Lanhoso - Zurich") ? "povoa-zurich" : "other"
                            });
                        }
                    });
                });

                const sortedMonths = Array.from(monthsSet).sort(); // Ordenar meses disponíveis

                setAvailableMonths(sortedMonths);
                setTrips(detailedTrips);
                setLoading(false);

                if (sortedMonths.length > 0) {
                    setDate(moment(`${sortedMonths[0]}-01`).toDate()); // Definir o primeiro mês com viagens
                }
            } catch (error) {
                console.error("Erro ao buscar viagens:", error);
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


    // Função para alterar a data conforme o mês selecionado
    const handleMonthChange = (event) => {
        const [year, month] = event.target.value.split("-");
        setDate(moment(`${year}-${month}-01`, "YYYY-MM-DD").toDate());
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
    
    const handleEventClick = (event) => {
        const formattedDate = moment(event.start).format("YYYY-MM-DD");
        localStorage.setItem("selectedDate", formattedDate);
        navigate("/trips");
    };
    
    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };
    

    const getEventColor = (event) => {
        if (event.direction === "suica-portugal") {
            return "darkred";
        } else if (event.direction === "portugal-suica") {
            return "green";
        } else if (event.direction === "zurich-povoa") {
            return "darkred";
        } else if (event.direction === "povoa-zurich") {
            return "green";
        }
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
    const handleDateClick = (date) => {
        const formattedDate = moment(date).format("YYYY-MM-DD");
        localStorage.setItem("selectedDate", formattedDate);
        navigate("/trips");
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
           {/* Cabeçalho do calendário com os botões ao lado do mês */}
 {/* Seletor de mês (só aparecem meses com viagens) */}
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
                    style={{ height: 600}}
                    culture="pt"
                    eventPropGetter={eventPropGetter}
                    view={view}
                    onView={(newView) => setView(newView)}
                    date={date}
                    onNavigate={(newDate) => setDate(newDate)}
                    onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
                    onSelectEvent={(event) => handleEventClick(event)}
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
        </div>
    );
};



export default Agenda;
