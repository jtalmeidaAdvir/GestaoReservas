import React, { useEffect, useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCityById, updateCity, deleteCity } from "../../services/apiCities";

const CityEdit = () => {
    const { id } = useParams(); // Obtem o id da cidade a editar
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCity = async () => {
            try {
                const cityData = await fetchCityById(id);
                setNome(cityData.nome); // Carrega o nome da cidade
            } catch (error) {
                console.error("Erro ao buscar a cidade:", error);
            } finally {
                setLoading(false);
            }
        };

        loadCity();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Atualiza apenas o nome da cidade
            await updateCity(id, { nome });
            navigate("/countries"); // Redireciona para a lista de países ou outra rota que preferires
        } catch (error) {
            console.error("Erro ao atualizar a cidade:", error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Tem a certeza que deseja eliminar esta cidade? Esta ação não pode ser revertida!")) {
            try {
                await deleteCity(id);
                navigate("/countries");
            } catch (error) {
                console.error("Erro ao eliminar a cidade:", error);
            }
        }
    };

    if (loading) {
        return <Container><p>A carregar...</p></Container>;
    }

    return (
        <Container>
            <h2>Editar Nome da Cidade</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="nome" className="mb-3">
                    <Form.Label>Cidade</Form.Label>
                    <Form.Control
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Introduza o novo nome da cidade"
                        required
                    />
                </Form.Group>
                <Button variant="primary" type="submit"  style={{ marginLeft: "10px",backgroundColor: "darkred", color: "white",borderColor: "darkred"   }} >
                    Atualizar Cidade
                </Button>
                <Button 
                    variant="danger" 
                    type="button" 
                    onClick={handleDelete} 
                    style={{ marginLeft: "10px",backgroundColor: "darkred", color: "white",borderColor: "darkred"  }}  
                >
                    Eliminar Cidade
                </Button>
            </Form>
        </Container>
    );
};

export default CityEdit;
