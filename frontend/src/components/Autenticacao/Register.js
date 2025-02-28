import React, { useState } from "react";
import { registerUser } from "../../services/apiUsers";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import logo from "../../assets/logo.png";
import "../../styles/login.css";

const Register = () => {
    const [formData, setFormData] = useState({
        nome: "",
        apelido: "",
        email: "",
        password: "",
        telefone: "",
        tipo: "passageiro",
    });

    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.nome.trim()) newErrors.nome = "Nome obrigatório";
        if (!formData.email.includes("@")) newErrors.email = "Email inválido";
        if (formData.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return; // Evita submissão se houver erros
        setError("");
        setSuccess("");
    
        try {
            await registerUser(formData);
            setSuccess("Utilizador registado com sucesso!");
        } catch (error) {
            setError(error.response?.data?.error || "Erro ao registar utilizador.");
        }
    };

    return (
        <Container className="login-container">
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }}>
                    <Card className="login-card">
                    <h2 className="userlist-title">Registar Novo Utilizador</h2>

                        <Form onSubmit={handleSubmit} className="login-form">
                            {error && <Alert variant="danger" className="login-alert">{error}</Alert>}
                            {success && <Alert variant="success" className="login-alert">{success}</Alert>}

                            <Form.Group controlId="formNome">
                                <Form.Control
                                    type="text"
                                    name="nome"
                                    placeholder="Nome"
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formApelido">
                                <Form.Control
                                    type="text"
                                    name="apelido"
                                    placeholder="Apelido"
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formEmail">
                                <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formPassword">
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formTelefone">
                                <Form.Control
                                    type="text"
                                    name="telefone"
                                    placeholder="Telefone"
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group controlId="formTipo">
                                <Form.Select name="tipo" onChange={handleChange}>
                                    <option value="passageiro">Passageiro</option>
                                    <option value="admin">Admin</option>
                                    <option value="motorista">Motorista</option>
                                </Form.Select>
                            </Form.Group>

                            <Button type="submit" className="login-button">
                                Registar
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
