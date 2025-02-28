import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsers, deleteUser } from "../../services/apiUsers";
import { Container, Card, ListGroup, Spinner, Button, Form } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import "../../styles/userlist.css";

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const getUsers = async () => {
            try {
                const usersData = await fetchUsers();
                setUsers(usersData);
                setFilteredUsers(usersData);
            } catch (error) {
                console.error("Erro ao buscar utilizadores:", error);
            } finally {
                setLoading(false);
            }
        };

        getUsers();
    }, []);

    const handleDeleteUser = async (id) => {
        if (window.confirm("Tens a certeza que queres eliminar este utilizador?")) {
            try {
                await deleteUser(id);
                const updatedUsers = users.filter(user => user.id !== id);
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);
            } catch (error) {
                console.error("Erro ao eliminar utilizador:", error);
            }
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const filtered = users.filter(user => 
            user.nome.toLowerCase().includes(term) || 
            user.apelido.toLowerCase().includes(term) || 
            user.email.toLowerCase().includes(term) || 
            user.tipo.toLowerCase().includes(term)
        );
        setFilteredUsers(filtered);
    };

    return (
        <Container className="userlist-container">
            <h2 className="userlist-title">Lista de Utilizadores</h2>
            
            <div className="userlist-controls">
                <Form.Control 
                    type="text" 
                    placeholder="Pesquisar utilizador..." 
                    value={searchTerm} 
                    onChange={handleSearch} 
                    className="search-bar"
                />
                <Button className="add-user-btn" onClick={() => navigate("/register")}> 
                    +
                </Button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Card className="userlist-card">
                    <ListGroup variant="flush">
                        {filteredUsers.map((user) => (
                            <ListGroup.Item key={user.id} className="userlist-item d-flex justify-content-between align-items-center">
                            <div className="userlist-info d-flex align-items-center">
                                <FaUserCircle className="user-icon" />
                                <div className="user-details">
                                    <strong>{user.nome} {user.apelido}</strong>
                                    <span className="userlist-email">{user.email}</span>
                                    <span className="userlist-role">{user.tipo}</span>
                                    <span className="userlist-phone">{user.telefone}</span>
                                </div>
                            </div>
                        
                            <div className="userlist-actions d-flex align-items-center gap-2">
                                <Button 
                                    variant="warning" 
                                    className="edit-user-btn"
                                    onClick={() => navigate(`/edit-user/${user.id}`, { state: { user } })}
                                >
                                    <AiOutlineEdit size={18} />
                                </Button>
                        
                                <Button 
                                    variant="danger" 
                                    className="delete-user-btn"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    <AiOutlineDelete size={18} />
                                </Button>
                            </div>
                        </ListGroup.Item>
                        
                        
                        ))}
                    </ListGroup>
                </Card>
            )}
        </Container>
    );
};

export default UserList;
