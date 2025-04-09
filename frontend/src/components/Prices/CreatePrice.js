import React, { useState, useEffect } from "react";
import { createPrice } from "../../services/apiPrices";
import { fetchCountries } from "../../services/apiCountries";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/createprice.css";

const CreatePrice = () => {
    const [formData, setFormData] = useState({ valor: "", descricao: "", countryId: "" });
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const loadCountries = async () => {
            try {
                setIsLoading(true);
                const data = await fetchCountries();
                setCountries(data);
            } catch (err) {
                setError("Ocorreu um erro ao carregar a lista de países.");
            } finally {
                setIsLoading(false);
            }
        };
        loadCountries();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            // O 'createdBy' pode ser obtido do utilizador autenticado, caso exista
            await createPrice({ ...formData, createdBy: "admin" });
            setSuccess("Preço criado com sucesso!");
            setTimeout(() => navigate("/prices"), 2000);
        } catch (err) {
            setError("Não foi possível criar o preço. Verifica se todos os campos estão corretos.");
        }
    };

    return (
        <Container className="createprice-container">
            <div className="createprice-card">
                <h2>Criar Preço</h2>

                {/* Alertas de erro ou sucesso */}
                {error && <Alert variant="danger" className="createprice-alert">{error}</Alert>}
                {success && <Alert variant="success" className="createprice-alert">{success}</Alert>}

                {/* Enquanto carrega os países, exibe um Spinner */}
                {isLoading ? (
                    <div className="text-center my-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">A carregar...</span>
                        </Spinner>
                        <p>A carregar lista de países...</p>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit} className="createprice-form">
                        <Form.Group className="mb-3">
                            <Form.Label>Valor</Form.Label>
                            <Form.Control
                                type="number"
                                name="valor"
                                placeholder="Insere o valor"
                                step="0.01"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                            />
                            <Form.Text className="text-muted">
                                Introduz o valor para o bilhete.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                type="text"
                                name="descricao"
                                placeholder="Descrição"
                                value={formData.descricao}
                                onChange={handleChange}
                            />
                            <Form.Text className="text-muted">
                                Descreve brevemente o preço.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>País</Form.Label>
                            <Form.Select
                                name="countryId"
                                value={formData.countryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o país</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.nome}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Escolhe o país ao qual este preço se aplica.
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => navigate("/prices")}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="submit"
                                style={{
                                    backgroundColor: "darkred",
                                    color: "white",
                                    borderColor: "darkred",
                                }}
                            >
                                Criar
                            </Button>
                        </div>
                    </Form>
                )}
            </div>
        </Container>
    );
};

export default CreatePrice;
