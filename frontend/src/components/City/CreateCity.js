import React, { useState, useEffect } from "react";
import { createCity } from "../../services/apiCities";
import { fetchCountries } from "../../services/apiCountries";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/createcity.css"; 

const CreateCity = () => {
    const [formData, setFormData] = useState({ nome: "", countryId: "" });
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const loadCountries = async () => {
            try {
                const data = await fetchCountries();
                setCountries(data);

                // Obter o `countryId` da URL e pré-selecioná-lo
                const params = new URLSearchParams(location.search);
                const selectedCountryId = params.get("countryId");
                if (selectedCountryId) {
                    setFormData(prev => ({ ...prev, countryId: selectedCountryId }));
                }
            } catch (error) {
                console.error("Erro ao buscar países", error);
            }
        };
        loadCountries();
    }, [location.search]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            await createCity(formData);
            setSuccess("Cidade criada com sucesso!");
            setTimeout(() => navigate("/countries"), 2000);
        } catch (error) {
            setError("Erro ao criar cidade.");
        }
    };

    return (
        <Container className="createcity-container">
            <div className="createcity-card">
                <h2>Criar Cidade</h2>
                {error && <Alert variant="danger" className="createcity-alert">{error}</Alert>}
                {success && <Alert variant="success" className="createcity-alert">{success}</Alert>}
                
                <Form onSubmit={handleSubmit} className="createcity-form">
                    <Form.Group>
                        <Form.Control 
                            type="text" 
                            name="nome" 
                            placeholder="Nome da Cidade" 
                            value={formData.nome} 
                            onChange={handleChange} 
                            required 
                        />
                    </Form.Group>
                    
                    <Form.Group>
                        <Form.Label>País</Form.Label>
                        <Form.Control 
                            as="select" 
                            name="countryId" 
                            value={formData.countryId} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="">Selecione um país</option>
                            {countries.map(country => (
                                <option key={country.id} value={country.id}>
                                    {country.nome}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    <Button type="submit" className="createcity-button">Criar</Button>
                </Form>
            </div>
        </Container>
    );
};

export default CreateCity;
