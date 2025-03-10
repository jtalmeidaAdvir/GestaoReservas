import React, { useState } from "react";
import { createBus } from "../../services/apiBuses";
import { Container, Form, Button, Alert, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/createbus.css"; // Importar o CSS

const CreateBus = () => {
    const [formData, setFormData] = useState({ nome: "", nlugares: "" });
    const [imagem, setImagem] = useState(null); // Ficheiro da imagem
    const [imagemPreview, setImagemPreview] = useState(null); // Pré-visualização
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
            setImagemPreview(URL.createObjectURL(file)); // Criar um URL temporário para visualização
        }
    };

    const handleRemoveImage = () => {
        setImagem(null);
        setImagemPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
    
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("nome", formData.nome);
            formDataToSend.append("nlugares", formData.nlugares);
            if (imagem) {
                formDataToSend.append("imagem", imagem);
            }
    
            const response = await createBus(formDataToSend);
            setSuccess(`Autocarro ${response.data.nome} criado com sucesso!`);
            setTimeout(() => navigate("/autocarros"), 2000);
        } catch (error) {
            setError("Erro ao criar autocarro.");
        }
    };
    

    return (
        <Container className="createbus-container">
            <div className="createbus-card">
                <h2>Criar Autocarro</h2>
                {error && <Alert variant="danger" className="createbus-alert">{error}</Alert>}
                {success && <Alert variant="success" className="createbus-alert">{success}</Alert>}
                <Form onSubmit={handleSubmit} className="createbus-form" encType="multipart/form-data">
                    <Form.Group>
                        <Form.Control type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group>
                        <Form.Control type="number" name="nlugares" placeholder="Nº de Lugares" value={formData.nlugares} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Imagem do Autocarro</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={handleImageChange}  />
                    </Form.Group>

                    {/* Pré-visualização da imagem */}
                    {imagemPreview && (
                        <div className="image-preview-container">
                            <Image src={imagemPreview} alt="Pré-visualização" className="bus-image-preview" />
                            <Button variant="danger" className="remove-image-button" onClick={handleRemoveImage}>
                                x
                            </Button>
                        </div>
                    )}

                    <Button type="submit" className="createbus-button">Criar</Button>
                </Form>
            </div>
        </Container>
    );
};

export default CreateBus;
