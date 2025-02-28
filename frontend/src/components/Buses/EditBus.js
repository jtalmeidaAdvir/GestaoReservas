import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBusById, updateBus } from "../../services/apiBuses";
import { Container, Form, Button, Alert, Image, Modal } from "react-bootstrap";
import "../../styles/editbus.css"; // Importar o CSS

const EditBus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nome: "", nlugares: "" });
    const [imagem, setImagem] = useState(null); // Ficheiro da nova imagem
    const [imagemPreview, setImagemPreview] = useState(""); // Imagem atual
    const [showModal, setShowModal] = useState(false); // Estado para abrir o modal
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadBus = async () => {
            try {
                const bus = await fetchBusById(id);
                setFormData({ nome: bus.nome, nlugares: bus.nlugares });
                
                // Se a BD armazenar a imagem em base64, atualiza a pré-visualização
                if (bus.imagem) {
                    setImagemPreview(`data:image/png;base64,${bus.imagem}`);
                }
            } catch (error) {
                setError("Erro ao carregar autocarro.");
            }
        };
        loadBus();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImagem(file);
        setImagemPreview(URL.createObjectURL(file)); // Mostra a pré-visualização da nova imagem
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
    
        try {
            let formDataToSend;
            let hasImage = false;
    
            if (imagem) {
                // Criar FormData para envio com imagem
                formDataToSend = new FormData();
                formDataToSend.append("nome", formData.nome);
                formDataToSend.append("nlugares", formData.nlugares);
                formDataToSend.append("isActive", true);
                formDataToSend.append("imagem", imagem);
                hasImage = true;
            } else {
                // Enviar JSON normal se não houver imagem
                formDataToSend = {
                    nome: formData.nome,
                    nlugares: formData.nlugares,
                    isActive: true
                };
            }
    
            await updateBus(id, formDataToSend, hasImage);
            setSuccess("Autocarro atualizado com sucesso!");
            setTimeout(() => navigate("/autocarros"), 2000);
        } catch (error) {
            setError(error.message || "Erro ao atualizar autocarro.");
        }
    };
    

    return (
        <Container className="editbus-container">
            <div className="editbus-card">
                <h2>Editar Autocarro</h2>
                {error && <Alert variant="danger" className="editbus-alert">{error}</Alert>}
                {success && <Alert variant="success" className="editbus-alert">{success}</Alert>}
                
                <Form onSubmit={handleSubmit} className="editbus-form" encType="multipart/form-data">
                    <Form.Group>
                        <Form.Control type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group>
                        <Form.Control type="number" name="nlugares" placeholder="Nº de Lugares" value={formData.nlugares} onChange={handleChange} required />
                    </Form.Group>

                    {/* Exibir imagem abaixo do input de ficheiro */}
                    {imagemPreview && (
                        <div className="image-preview-container">
                            <Image 
                                src={imagemPreview} 
                                alt="Imagem do autocarro" 
                                className="bus-image-preview" 
                                onClick={() => setShowModal(true)} // Abre o modal ao clicar
                            />
                        </div>
                    )}

                    <Form.Group>
                        <Form.Label>Imagem do Autocarro</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                    </Form.Group>

                    <Button type="submit" className="editbus-button">Atualizar</Button>
                </Form>
            </div>

            {/* Modal de pré-visualização da imagem */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Body className="text-center">
                    <Image src={imagemPreview} alt="Imagem do autocarro em tamanho grande" fluid />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Fechar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default EditBus;
