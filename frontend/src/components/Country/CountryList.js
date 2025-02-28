import React, { useEffect, useState } from "react";
import { fetchCountries } from "../../services/apiCountries";
import { fetchCities } from "../../services/apiCities";
import { Container, Card, Button, Form, ListGroup, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaGlobe, FaPlus, FaChevronDown, FaChevronUp, FaCity } from "react-icons/fa";
import "../../styles/country.css";

const CountryList = () => {
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("active");
    const [expandedCountry, setExpandedCountry] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                const countryData = await fetchCountries();
                setCountries(countryData);

                const cityData = await fetchCities();
                setCities(cityData);
            } catch (error) {
                console.error("Erro ao buscar países e cidades", error);
            }
        };
        loadData();
    }, []);

    const toggleExpand = (id) => {
        setExpandedCountry(expandedCountry === id ? null : id);
    };

    const filteredCountries = countries.filter(country =>
        country.nome.toLowerCase().includes(search.toLowerCase()) &&
        ((filter === "active" && country.isActive) || (filter === "inactive" && !country.isActive))
    );

    return (
        <Container className="countries-container">
            <h2>Países</h2>
            
            <div className="country-search-container">
                <Form.Control
                    type="text"
                    placeholder="Procurar país"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="country-search"
                />
                <Button className="add-country-button" onClick={() => navigate("/countries/create")}>
                    <FaPlus size={18} />
                </Button>
            </div>

            <div className="country-list">
                {filteredCountries.map(country => (
                    <Card key={country.id} className="country-card">
                        <Card.Body className="country-card-body">
                            <div className="country-info">
                                <FaGlobe size={24} className="country-icon" />
                                <div>
                                    <Card.Title className="country-title">{country.nome}</Card.Title>
                                    <Card.Text className="country-text">Código: {country.codigo}</Card.Text>
                                </div>
                            </div>
                            <div className="country-actions">
                                <Button 
                                    variant="outline-secondary" 
                                    className="toggle-button" 
                                    onClick={() => toggleExpand(country.id)}
                                >
                                    {expandedCountry === country.id ? <FaChevronUp /> : <FaChevronDown />}
                                </Button>
                                <Button 
                                    variant="outline-primary" 
                                    className="create-city-button" 
                                    onClick={() => navigate(`/cities/create?countryId=${country.id}`)}
                                >
                                    <FaCity /> Criar Cidade
                                </Button>
                            </div>
                        </Card.Body>
                        
                        {/* Lista de cidades associadas */}
                        {expandedCountry === country.id && (
                            <div className="city-list-container">
                                <Row>
                                    {cities.filter(city => city.countryId === country.id).map(city => (
                                        <Col key={city.id} xs={12} sm={6} md={4} lg={3} className="city-col">
                                            <ListGroup.Item className="city-item">
                                                {city.nome}
                                            </ListGroup.Item>
                                        </Col>
                                    ))}
                                    {cities.filter(city => city.countryId === country.id).length === 0 && (
                                        <Col xs={12}>
                                            <ListGroup.Item className="city-item-empty">Nenhuma cidade cadastrada</ListGroup.Item>
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </Container>
    );
};

export default CountryList;
