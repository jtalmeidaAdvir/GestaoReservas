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
                const response = await fetch("http://192.168.1.10:3000/trips/summary");
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
                console.error("Erro ao buscar resumo das viagens:", error);
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
                `http://192.168.1.10:3000/reservations/by-reserva/${searchTerm}`
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
            console.error("Erro ao buscar reserva:", error);
            alert("Erro ao buscar reserva");
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
            `http://192.168.1.10:3000/reservations/by-passageiro/${nome}/${apelido}`
        );

        if (!response.ok) {
            console.error("Erro HTTP:", response.status);
            alert(`Erro ao buscar reserva: ${response.status}`);
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
        console.error("Erro ao buscar reserva:", error);
        alert("Erro ao buscar reserva.");
    }
};
    // Função para pesquisar reserva por número e abrir a viagem associada
const handleSearchPhone = async () => {
        if (!searchTerm1) return;
    
        try {
            const response = await fetch(`http://192.168.1.10:3000/reservations/by-telefone/${searchTerm1}`);
            
            if (!response.ok) {
                console.error("Erro HTTP:", response.status);
                alert(`Erro ao buscar reserva: ${response.status}`);
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
            console.error("Erro ao buscar reserva:", error);
            alert("Erro ao buscar reserva.");
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
        <div style={{ height: "85vh", padding: "20px" }}>
            <h2>Agenda</h2>
            {/* 🔍 Barra de Pesquisa */}
            <div style={{ marginBottom: "15px", display: "flex", gap: "10px", alignSelf:"center" }}>
                <input
                    type="text"
                    placeholder="Pesquisar por reserva"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: "8px",
                        width: "350px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />

                
                <button
                    onClick={handleSearch}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "5px",
                        background: "darkred",
                        color: "white",
                        border: "none",
                    }}
                >
                    
                    Pesquisar
                </button>


                <input
                    type="text"
                    placeholder="Pesquisar por telefone"
                    value={searchTerm1}
                    onChange={(e) => setSearchTerm1(e.target.value)}
                    style={{
                        padding: "8px",
                        width: "350px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
                <button
                    onClick={handleSearchPhone}
                    style={{
                        padding: "8px 12px",
                        borderRadius: "5px",
                        background: "darkred",
                        color: "white",
                        border: "none",
                    }}
                >
                    
                    Pesquisar
                </button>
 {/* 🔍 Pesquisa por Nome e Apelido (num só input) */}
 <input
        type="text"
        placeholder="Nome e Apelido do passageiro"
        value={searchFullName}
        onChange={(e) => setSearchFullName(e.target.value)}
        style={{
            padding: "8px",
            width: "300px",
            borderRadius: "5px",
            border: "1px solid #ccc",
        }}
    />
    <button
        onClick={handleSearchPassengerName}
        style={{
            padding: "8px 12px",
            borderRadius: "5px",
            background: "darkred",
            color: "white",
            border: "none",
        }}
    >
        Pesquisar
    </button>
            </div>

            

            {loading ? (
                <p>A carregar viagens...</p>
            ) : (
                <Calendar
                    localizer={localizer}
                    selectable
                    events={view === "week" || view === "day" ? trips : []}
                    onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 700 }}
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
                />
            )}
            {/* ✅ Legenda da Agenda */}
            <div
                style={{ display: "flex", gap: "20px", marginBottom: "10px", fontSize: "0.9rem" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div
                        style={{ width: "15px", height: "15px", backgroundColor: "white", border: "1px solid black" }}
                    ></div>
                    <span>Passado</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "15px", height: "15px", backgroundColor: "lightblue" }}></div>
                    <span>Hoje</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "15px", height: "15px", backgroundColor: "#ffeb3b" }}></div>
                    <span>Próximos 5 dias com viagens</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "15px", height: "15px", backgroundColor: "lightgreen" }}></div>
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
