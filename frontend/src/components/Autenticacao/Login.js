import React, { useState, useEffect } from "react";
import { loginUser } from "../../services/apiUsers";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import logo from "../../assets/logo.png";
import "../../styles/login.css";

const Login = ({ setIsAuthenticated }) => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/agenda");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
    
        try {
            const response = await loginUser(credentials);
            localStorage.setItem("token", response.token);
            localStorage.setItem("email", response.email);
            localStorage.setItem("userName", response.email); // Guarda o nome do utilizador
            setIsAuthenticated(true);
            navigate("/agenda");
        } catch (error) {
            setError(error.response?.data?.error || "Erro ao iniciar sessão.");
        }
    };

    return (
        <Container className="login-container">
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }}>
                    <Card className="login-card">
                        <Card.Body className="login-logo">
                            <img src={logo} alt="Logo" width="150" />
                        </Card.Body>
                        <Form onSubmit={handleSubmit} className="login-form">
                            {error && <Alert variant="danger" className="login-alert">{error}</Alert>}
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
                            <Button type="submit" className="login-button">
                                Entrar
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
