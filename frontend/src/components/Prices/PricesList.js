import React, { useEffect, useState } from "react";
import { fetchPrices, deletePrice } from "../../services/apiPrices";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEuroSign, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

import "../../styles/price.css";

const PriceList = () => {
    const [prices, setPrices] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("active");
    const navigate = useNavigate();


    const getCurrencyIcon = (countryName) => {
        if (!countryName) return <FaEuroSign size={24} className="price-icon" />;
    
        const normalized = countryName.trim().toLowerCase();
    
        if (normalized.includes("suíça") || normalized.includes("suiça") || normalized.includes("switzerland")) {
            return <span className="price-icon price-fr">Fr</span>;
        }
    
        if (normalized.includes("portugal")) {
            return <FaEuroSign size={24} className="price-icon" />;
        }
    
        return <FaEuroSign size={24} className="price-icon" />;
    };
    
    
    

    useEffect(() => {
        const loadData = async () => {
            try {
                const priceData = await fetchPrices();
                setPrices(priceData);
            } catch (error) {
                console.error("Erro ao buscar preços", error);
            }
        };
        loadData();
    }, []);

    const filteredPrices = prices.filter(price =>
        price.descricao?.toLowerCase().includes(search.toLowerCase()) &&
        ((filter === "active" && price.isActive) || (filter === "inactive" && !price.isActive))
    );

    return (
        <Container className="prices-container">
            <h2>Preços</h2>

            <div className="price-search-container">
                <Form.Control
                    type="text"
                    placeholder="Procurar descrição"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="price-search"
                />
                <Button className="add-price-button" onClick={() => navigate("/prices/create")}>
                    <FaPlus size={18} />
                </Button>
            </div>

            <div className="price-list">
                {filteredPrices.map(price => (
                   <Card key={price.id} className="price-card">
                   <Card.Body className="price-card-body">
                   <div className="price-info">
    <div className="d-flex align-items-center gap-2">
        <div>{getCurrencyIcon(price.Country?.nome)}</div>
        <Card.Title className="price-title">
            {parseFloat(price.valor).toFixed(2)}
        </Card.Title>
    </div>
    <div>

                      


                               <Card.Text className="price-text">{price.descricao || "Sem descrição"}</Card.Text>
                               <Card.Text className="price-country">
                                   País: {price.Country?.nome || "Desconhecido"}
                               </Card.Text>
                           </div>
                       </div>
               
                       <div className="price-actions">
                           <Button
                           style={{ backgroundColor: "darkred", color: "white", borderColor:"darkred" }}
                               variant="warning"
                               size="sm"
                               onClick={() => navigate(`/prices/edit/${price.id}`)}
                               className="me-2"
                           >
                               <FaEdit />
                           </Button>
                           <Button
                           style={{ backgroundColor: "darkred", color: "white", borderColor:"darkred" }}
                               variant="danger"
                               size="sm"
                               onClick={async () => {
                                   if (window.confirm("Tens a certeza que queres eliminar este preço?")) {
                                       try {
                                           await deletePrice(price.id);
                                           setPrices(prev => prev.filter(p => p.id !== price.id));
                                       } catch (err) {
                                           console.error("Erro ao eliminar preço", err);
                                       }
                                   }
                               }}
                           >
                               <FaTrash />
                           </Button>
                       </div>
                   </Card.Body>
               </Card>
                ))}
            </div>
        </Container>
    );
};

export default PriceList;
