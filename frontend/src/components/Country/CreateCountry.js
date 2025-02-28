import React, { useState } from "react";
import { createCountry } from "../../services/apiCountries";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/createcountry.css"; // Importa o CSS correspondente

const CreateCountry = () => {
    const [formData, setFormData] = useState({ nome: "", codigo: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            await createCountry(formData);
            setSuccess("País criado com sucesso!");
            setTimeout(() => navigate("/countries"), 2000); // Redireciona após sucesso
        } catch (error) {
            setError("Erro ao criar país.");
        }
    };

    return (
        <Container className="createcountry-container">
            <div className="createcountry-card">
                <h2>Criar País</h2>
                {error && <Alert variant="danger" className="createcountry-alert">{error}</Alert>}
                {success && <Alert variant="success" className="createcountry-alert">{success}</Alert>}
                
                <Form onSubmit={handleSubmit} className="createcountry-form">
                    <Form.Group>
                        <Form.Control 
                            type="text" 
                            name="nome" 
                            placeholder="Nome do País" 
                            value={formData.nome} 
                            onChange={handleChange} 
                            required 
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Control 
                            type="text" 
                            name="codigo" 
                            placeholder="Código do País (ex: PT, BR)" 
                            value={formData.codigo} 
                            onChange={handleChange} 
                            required 
                        />
                    </Form.Group>

                    <Button type="submit" className="createcountry-button">Criar</Button>
                </Form>
            </div>
        </Container>
    );
};

export default CreateCountry;
