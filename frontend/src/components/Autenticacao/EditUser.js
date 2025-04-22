import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { updateUser } from "../../services/apiUsers";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import "../../styles/login.css";

const EditUser = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: "",
        apelido: "",
        email: "",
        telefone: "",
        tipo: "",
        password: "",

    });
    

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (location.state?.user) {
            setFormData(location.state.user);
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const dataToSend = { ...formData };
if (!formData.password) delete dataToSend.password;

await updateUser(id, dataToSend);

            setSuccess("Utilizador atualizado com sucesso!");
            setTimeout(() => navigate("/users"), 2000); // Redireciona após 2s
        } catch (error) {
            setError(error.response?.data?.error || "Erro ao atualizar utilizador.");
        }
    };

    return (
        <Container className="login-container">
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }}>
                    <Card className="login-card">
                        <h2>Editar Utilizador</h2>

                        <Form onSubmit={handleSubmit} className="login-form">
                            {error && <Alert variant="danger" className="login-alert">{error}</Alert>}
                            {success && <Alert variant="success" className="login-alert">{success}</Alert>}

                            <Form.Group controlId="formNome">
                                <Form.Control
                                    type="text"
                                    name="nome"
                                    placeholder="Nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formApelido">
                                <Form.Control
                                    type="text"
                                    name="apelido"
                                    placeholder="Apelido"
                                    value={formData.apelido}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formEmail">
                                <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formTelefone">
                                <Form.Control
                                    type="text"
                                    name="telefone"
                                    placeholder="Telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group controlId="formPassword">
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Nova password (opcional)"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </Form.Group>


                            <Form.Group controlId="formTipo">
                                <Form.Select name="tipo" value={formData.tipo} onChange={handleChange}>
                                    <option value="passageiro">Passageiro</option>
                                    <option value="admin">Admin</option>
                                    <option value="motorista">Motorista</option>
                                </Form.Select>
                            </Form.Group>

                            <Button type="submit" className="login-button">
                                Guardar Alterações
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default EditUser;
