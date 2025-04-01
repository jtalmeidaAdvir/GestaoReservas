import React, { useEffect, useState } from "react";
import { fetchTrips, deleteTrip, reactivateTrip, deleteTripPermanently } from "../../services/apiTrips";
import { Container, Card, Button, Form, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaMapMarkedAlt, FaEdit, FaTrash, FaRedo, FaTimes,FaPlus } from "react-icons/fa";
import "../../styles/trip.css";

const TripPage = () => {
    const [trips, setTrips] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("active");
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const loadTrips = async () => {
            try {
                const data = await fetchTrips();
                setTrips(data);
            } catch (error) {
                console.error("Erro ao buscar viagens", error);
            }
        };
        loadTrips();
    }, []);


    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja desativar esta viagem?")) {
            try {
                await deleteTrip(id);
                setTrips(trips.map(trip => trip.id === id ? { ...trip, isActive: false } : trip));
            } catch (error) {
                console.error("Erro ao desativar viagem", error);
            }
        }
    };

    const handleReactivate = async (id) => {
        try {
            await reactivateTrip(id);
            setTrips(trips.map(trip => trip.id === id ? { ...trip, isActive: true } : trip));
        } catch (error) {
            console.error("Erro ao reativar viagem", error);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja eliminar esta viagem permanentemente?")) {
            try {
                await deleteTripPermanently(id);
                setTrips(trips.filter(trip => trip.id !== id));
            } catch (error) {
                console.error("Erro ao eliminar permanentemente a viagem", error);
            }
        }
    };

    // Filtrar as viagens com base na pesquisa e no estado (ativa/inativa)
// Filtrar as viagens com base na pesquisa e no estado (ativa/inativa)
const filteredTrips = trips.filter(trip =>
    (
        trip.origem.toLowerCase().includes(search.toLowerCase()) ||
        trip.destino.toLowerCase().includes(search.toLowerCase()) ||
        formatDate(trip.dataviagem).includes(search)
    ) &&
    ((filter === "active" && trip.isActive) || (filter === "inactive" && !trip.isActive))
);


// Ordenar as viagens por data (ordem crescente)
const sortedTrips = filteredTrips.slice().sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem));

// Aplicar a paginação
const indexOfLastTrip = currentPage * tripsPerPage;
const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
const paginatedTrips = sortedTrips.slice(indexOfFirstTrip, indexOfLastTrip);
const totalPages = Math.ceil(sortedTrips.length / tripsPerPage);

    return (
        <Container className="trips-container">
            <h2>Viagens</h2>
            
            <div className="trip-search-container">
                <Form.Control
                    type="text"
                    placeholder="Procurar viagem / data"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="trip-search"
                />
                <Button className="add-country-button" onClick={() => navigate("/batchtrips")}>
                                    <FaPlus size={18} />
                                </Button>
            </div>

            <div className="trip-filters">
                <Button className={`filter-button ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>
                    Ativas
                </Button>
                <Button className={`filter-button ${filter === "inactive" ? "active" : ""}`} onClick={() => setFilter("inactive")}>
                    Inativas
                </Button>
            </div>

            <div className="trip-list">
                {paginatedTrips.map(trip => (
                    <Card key={trip.id} className={`trip-card ${!trip.isActive ? "trip-inactive" : ""}`}>
                        <Card.Body className="trip-card-body">
                            <div className="trip-info">
                                <FaMapMarkedAlt size={24} className="trip-icon" />
                                <div>
                                    <Card.Title className="trip-title">{trip.origem} → {trip.destino} </Card.Title>
                                    <Card.Text className="trip-text">{trip.Bus.nome} 🚌 {formatDate(trip.dataviagem)}</Card.Text>
                      
                                </div>
                            </div>
                            <div className="trip-actions">
                                {trip.isActive ? (
                                    <>
                                        <Button variant="outline-danger" className="edit-button" onClick={() => navigate(`/trips/edit/${trip.id}`)}>
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" className="delete-button" onClick={() => handleDelete(trip.id)}>
                                            <FaTrash />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline-success" className="reactivate-button" onClick={() => handleReactivate(trip.id)}>
                                            <FaRedo /> Reativar
                                        </Button>
                                        <Button variant="outline-dark" className="permanent-delete-button" onClick={() => handlePermanentDelete(trip.id)}>
                                            <FaTimes /> Eliminar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            <Pagination className="trip-pagination" >
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => setCurrentPage(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
            </Pagination>
        </Container>
    );
};

export default TripPage;
