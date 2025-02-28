import React, { useEffect, useState } from "react";
import { fetchBuses, deleteBus, reactivateBus, deleteBusPermanently } from "../../services/apiBuses"; // Importar deleteBusPermanently
import { Container, Card, Button, Form, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaBus, FaPlus, FaEdit, FaTrash, FaRedo, FaTimes } from "react-icons/fa"; // Importar FaTimes para eliminação permanente
import "../../styles/buses.css";

const BusesList = () => {
    const [buses, setBuses] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("active"); // Estado do filtro
    const [currentPage, setCurrentPage] = useState(1); // Estado para a página atual
    const busesPerPage = 5; // Definir quantos autocarros mostrar por página
    const navigate = useNavigate();

    useEffect(() => {
        const loadBuses = async () => {
            try {
                const data = await fetchBuses();
                setBuses(data);
            } catch (error) {
                console.error("Erro ao buscar autocarros", error);
            }
        };
        loadBuses();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja desativar este autocarro?")) {
            try {
                await deleteBus(id);
                setBuses(buses.map(bus => bus.id === id ? { ...bus, isActive: false } : bus)); // Atualizar lista
            } catch (error) {
                console.error("Erro ao desativar autocarro", error);
            }
        }
    };

    const handleReactivate = async (id) => {
        try {
            await reactivateBus(id);
            setBuses(buses.map(bus => bus.id === id ? { ...bus, isActive: true } : bus)); // Atualizar lista
        } catch (error) {
            console.error("Erro ao reativar autocarro", error);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja eliminar este autocarro permanentemente? Esta ação não pode ser revertida!")) {
            try {
                await deleteBusPermanently(id);
                setBuses(buses.filter(bus => bus.id !== id)); // Remover da lista
            } catch (error) {
                console.error("Erro ao eliminar permanentemente autocarro", error);
            }
        }
    };

    // Filtrar autocarros com base na pesquisa e status
    const filteredBuses = buses.filter(bus => 
        bus.nome.toLowerCase().includes(search.toLowerCase()) &&
        ((filter === "active" && bus.isActive) || (filter === "inactive" && !bus.isActive))
    );

    // Lógica de paginação
    const indexOfLastBus = currentPage * busesPerPage;
    const indexOfFirstBus = indexOfLastBus - busesPerPage;
    const paginatedBuses = filteredBuses.slice(indexOfFirstBus, indexOfLastBus);
    const totalPages = Math.ceil(filteredBuses.length / busesPerPage);

    return (
        <Container className="buses-container">
            <h2>Autocarros</h2>
            
            {/* Pesquisa + Botão de Adicionar */}
            <div className="bus-search-container">
                <Form.Control
                    type="text"
                    placeholder="Procurar autocarro"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bus-search"
                />
                <Button className="add-bus-button" onClick={() => navigate("/buses/create")}>
                    <FaPlus size={18} />
                </Button>
            </div>


            {/* Filtros */}
            <div className="bus-filters">
                <Button 
                    className={`filter-button ${filter === "active" ? "active" : ""}`}
                    onClick={() => setFilter("active")}
                >
                    Ativos
                </Button>
                <Button 
                    className={`filter-button ${filter === "inactive" ? "active" : ""}`}
                    onClick={() => setFilter("inactive")}
                >
                    Inativos
                </Button>
            </div>
            

            
            {/* Lista de autocarros */}
            <div className="bus-list">
                {paginatedBuses.map(bus => (
                    <Card key={bus.id} className={`bus-card ${!bus.isActive ? "bus-inactive" : ""}`}>
                        <Card.Body className="bus-card-body">
                            <div className="bus-info">
                                <FaBus size={24} className="bus-icon" />
                                <div>
                                    <Card.Title className="bus-title">{bus.nome}</Card.Title>
                                    <Card.Text className="bus-text">{bus.nlugares} lugares</Card.Text>
                                </div>
                            </div>
                            <div className="bus-actions">
                                {bus.isActive ? (
                                    <>
                                        <Button variant="outline-danger" className="edit-button" onClick={() => navigate(`/buses/edit/${bus.id}`)}>
                                            <FaEdit />
                                        </Button>
                                        <Button variant="outline-danger" className="delete-button" onClick={() => handleDelete(bus.id)}>
                                            <FaTrash />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline-success" className="reactivate-button" onClick={() => handleReactivate(bus.id)}>
                                            <FaRedo /> Reativar
                                        </Button>
                                        <Button variant="outline-dark" className="permanent-delete-button" onClick={() => handlePermanentDelete(bus.id)}>
                                            <FaTimes /> Eliminar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            {/* Paginação */}
            <Pagination className="bus-pagination" >
                <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item 
                        key={index + 1} 
                        active={index + 1 === currentPage}
                        onClick={() => setCurrentPage(index + 1)}
                    >
                        {index + 1}
                    </Pagination.Item>
                ))}
                <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                />
            </Pagination>
        </Container>
    );
};

export default BusesList;
