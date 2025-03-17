import React, { useEffect, useState } from "react";
import { fetchCities, deleteCity, reactivateCity, deleteCityPermanently } from "../../services/apiCities";
import { Container, Card, Button, Form, Pagination } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { FaCity, FaPlus, FaEdit, FaTrash, FaRedo, FaTimes } from "react-icons/fa";
import "../../styles/city.css";
import EditCity from "../City/EditCity"; 

const CityList = () => {
    const [cities, setCities] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("active");
    const [currentPage, setCurrentPage] = useState(1);
    const citiesPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const loadCities = async () => {
            try {
                const data = await fetchCities();
                setCities(data);
            } catch (error) {
                console.error("Erro ao buscar cidades", error);
            }
        };
        loadCities();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja desativar esta cidade?")) {
            try {
                await deleteCity(id);
                setCities(cities.map(city => city.id === id ? { ...city, isActive: false } : city));
            } catch (error) {
                console.error("Erro ao desativar cidade", error);
            }
        }
    };

    const handleReactivate = async (id) => {
        try {
            await reactivateCity(id);
            setCities(cities.map(city => city.id === id ? { ...city, isActive: true } : city));
        } catch (error) {
            console.error("Erro ao reativar cidade", error);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm("Tem a certeza que deseja eliminar esta cidade permanentemente? Esta ação não pode ser revertida!")) {
            try {
                await deleteCityPermanently(id);
                setCities(cities.filter(city => city.id !== id));
            } catch (error) {
                console.error("Erro ao eliminar permanentemente cidade", error);
            }
        }
    };

    const filteredCities = cities.filter(city => 
        city.nome.toLowerCase().includes(search.toLowerCase()) &&
        ((filter === "active" && city.isActive) || (filter === "inactive" && !city.isActive))
    );

    const indexOfLastCity = currentPage * citiesPerPage;
    const indexOfFirstCity = indexOfLastCity - citiesPerPage;
    const paginatedCities = filteredCities.slice(indexOfFirstCity, indexOfLastCity);
    const totalPages = Math.ceil(filteredCities.length / citiesPerPage);

    return (
        <Container className="cities-container">
            <h2>Cidades</h2>
            
            <div className="city-search-container">
                <Form.Control
                    type="text"
                    placeholder="Procurar cidade"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="city-search"
                />
                <Button className="add-city-button" onClick={() => navigate("/city/create")}>
                    <FaPlus size={18} />
                </Button>
            </div>

            <div className="city-filters">
                <Button 
                    className={`filter-button ${filter === "active" ? "active" : ""}`}
                    onClick={() => setFilter("active")}
                >
                    Ativas
                </Button>
                <Button 
                    className={`filter-button ${filter === "inactive" ? "active" : ""}`}
                    onClick={() => setFilter("inactive")}
                >
                    Inativas
                </Button>
            </div>
            
            <div className="city-list">
                {paginatedCities.map(city => (
                    <Card key={city.id} className={`city-card ${!city.isActive ? "city-inactive" : ""}`}>
                        <Card.Body className="city-card-body">
                            <div className="city-info">
                                <FaCity size={24} className="city-icon" />
                                <div>
                                <Card.Title style={{ cursor: "pointer" }}>
  <Link to={`/cities/edit/${city.id}`} style={{ textDecoration: "none" }}>
    {city.nome}
  </Link>
</Card.Title>

                                    <Card.Text className="city-text">País: {city.Country?.nome || "N/A"}</Card.Text>
                                </div>
                            </div>
                            <div className="city-actions">
                                {city.isActive ? (
                                    <>
                                        <Button variant="outline-primary" className="edit-button" onClick={() => navigate(`/cities/edit/${city.id}`)}>
                                        <FaEdit />
                                        </Button>

                                        <Button variant="outline-danger" className="delete-button" onClick={() => handleDelete(city.id)}>
                                            <FaTrash />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline-success" className="reactivate-button" onClick={() => handleReactivate(city.id)}>
                                            <FaRedo /> Reativar
                                        </Button>
                                        <Button variant="outline-dark" className="permanent-delete-button" onClick={() => handlePermanentDelete(city.id)}>
                                            <FaTimes /> Eliminar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            <Pagination className="city-pagination">
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

export default CityList;
