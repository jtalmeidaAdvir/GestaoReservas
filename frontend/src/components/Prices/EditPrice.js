import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPriceById, updatePrice } from "../../services/apiPrices";
import { fetchCountries } from "../../services/apiCountries";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import "../../styles/createprice.css";

const EditPrice = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        valor: "",
        descricao: "",
        countryId: "",
    });
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const price = await fetchPriceById(id);
                setFormData({
                    valor: price.valor,
                    descricao: price.descricao || "",
                    countryId: price.countryId || "",
                });

                const countriesData = await fetchCountries();
                setCountries(countriesData);
            } catch (err) {
                setError("Ocorreu um erro ao carregar os dados do preço.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            await updatePrice(id, formData);
            setSuccess("Preço atualizado com sucesso!");
            // Redireciona para a listagem de preços após 2 segundos
            setTimeout(() => navigate("/prices"), 2000);
        } catch (err) {
            setError("Não foi possível atualizar o preço. Verifica se todos os campos estão corretos.");
        }
    };

    return (
        <Container className="createprice-container">
            <div className="createprice-card">
                <h2>Editar Preço</h2>

                {/* Mensagens de erro ou sucesso */}
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {/* Mostra spinner caso esteja a carregar */}
                {isLoading ? (
                    <div className="text-center my-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">A carregar...</span>
                        </Spinner>
                        <p>A carregar dados...</p>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit} className="createprice-form">
                        <Form.Group className="mb-3">
                            <Form.Label>Valor</Form.Label>
                            <Form.Control
                                type="number"
                                name="valor"
                                placeholder="Insere o valor do preço (ex: 9.99)"
                                step="0.01"
                                value={formData.valor}
                                onChange={handleChange}
                                required
                            />
                            <Form.Text className="text-muted">
                                Introduz o valor do bilhete.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                type="text"
                                name="descricao"
                                placeholder="Insere uma breve descrição"
                                value={formData.descricao}
                                onChange={handleChange}
                            />
                            <Form.Text className="text-muted">
                                Por exemplo: “Adulto - Ida.”
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
                                Escolhe o país ao qual este preço está associado.
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
                                Guardar Alterações
                            </Button>
                        </div>
                    </Form>
                )}
            </div>
        </Container>
    );
};

export default EditPrice;
