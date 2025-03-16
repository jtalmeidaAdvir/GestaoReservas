import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTripById, updateTrip } from "../../services/apiTrips";
import { fetchCities } from "../../services/apiCities"; // Importar API de cidades
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/edittrip.css";

const EditTrip = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ origem: "", destino: "", dataviagem: "", motorista: "", horaPartida: "", horaChegada: "" });
    const [cities, setCities] = useState([]); // Estado para armazenar cidades
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const extractFirstTime = (timeString) => {
        if (!timeString) return "";
        const date = new Date(timeString);
        return date.toISOString().substring(11, 16);
    };

    const formatTimeForBackend = (time) => {
        return time ? `1970-01-01 ${time}:00` : null;
    };

    useEffect(() => {
        const loadTrip = async () => {
            try {
                const trip = await fetchTripById(id);
                setFormData({
                    origem: trip.origem,
                    destino: trip.destino,
                    dataviagem: trip.dataviagem,
                    motorista: trip.motorista,
                    horaPartida: extractFirstTime(trip.horaPartida),
                    horaChegada: extractFirstTime(trip.horaChegada),
                });
            } catch (error) {
                setError("Erro ao carregar viagem.");
            }
        };

        const loadCities = async () => {
            try {
                const data = await fetchCities();
                setCities(data);
            } catch (error) {
                console.error("Erro ao carregar cidades:", error);
            }
        };

        loadTrip();
        loadCities();
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
            const formattedData = {
                ...formData,
                horaPartida: formatTimeForBackend(formData.horaPartida),
                horaChegada: formatTimeForBackend(formData.horaChegada),
            };

            console.log("📡 Enviando dados para a API:", formattedData);

            await updateTrip(id, formattedData);
            setSuccess("Viagem atualizada com sucesso!");
            setTimeout(() => navigate("/trippage"), 2000);
        } catch (error) {
            console.error("❌ Erro ao atualizar viagem:", error);
            setError(error.message || "Erro ao atualizar viagem.");
        }
    };

    return (
        <Container className="edittrip-container">
            <div className="edittrip-card">
                <h2>Editar Viagem</h2>
                {error && <Alert variant="danger" className="edittrip-alert">{error}</Alert>}
                {success && <Alert variant="success" className="edittrip-alert">{success}</Alert>}

                <Form onSubmit={handleSubmit} className="edittrip-form">
                    
                    {/* Dropdown de Origem */}
                    <Form.Group>
                        <Form.Label>Origem</Form.Label>
                        <Form.Control as="select" name="origem" value={formData.origem} onChange={handleChange} required>
                            <option value="">Selecione a origem</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.nome}>
                                    {city.nome}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    {/* Dropdown de Destino */}
                    <Form.Group>
                        <Form.Label>Destino</Form.Label>
                        <Form.Control as="select" name="destino" value={formData.destino} onChange={handleChange} required>
                            <option value="">Selecione o destino</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.nome}>
                                    {city.nome}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Data da Viagem</Form.Label>
                        <Form.Control type="date" name="dataviagem" value={formData.dataviagem} onChange={handleChange} required />
                    </Form.Group>
                   {/*  
                    <Form.Group>
                        <Form.Label>Motorista</Form.Label>
                        <Form.Control type="text" name="motorista" placeholder="Motorista" value={formData.motorista} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Hora de Partida</Form.Label>
                        <Form.Control type="time" name="horaPartida" value={formData.horaPartida} onChange={handleChange} required />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Hora de Chegada</Form.Label>
                        <Form.Control type="time" name="horaChegada" value={formData.horaChegada} onChange={handleChange} required />
                    </Form.Group>
*/}
                    <Button type="submit" className="edittrip-button">Atualizar</Button>
                </Form>
            </div>
        </Container>
    );
};

export default EditTrip;
