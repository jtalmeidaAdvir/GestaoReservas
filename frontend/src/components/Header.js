import React, { useState } from "react";
import { Offcanvas, Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaBus, FaSignOutAlt, FaBars, FaUser, FaSuitcase, FaCity } from "react-icons/fa";
import logo from "../assets/logo.svg";
import "../styles/header.css"; // Importação do CSS

const Header = ({ isAuthenticated }) => {
    const [showDrawer, setShowDrawer] = useState(false);
    const navigate = useNavigate();

    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("email"); // Obter o e-mail do utilizador autenticado
    const displayName = userName ? userName.split("@")[0] : ""; // Nome antes do @

    const handleCloseDrawer = () => {
        setShowDrawer(false);
    };

    const handleToggleDrawer = () => {
        if (isAuthenticated) {
            setShowDrawer(prev => !prev);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName"); 
        localStorage.removeItem("userEmail"); // Remover também o email ao sair
        setShowDrawer(false);
        navigate("/login");
        window.location.reload();
    };

    return (
        <>
            <header className="header">
                <button className="drawer-toggle" onClick={handleToggleDrawer}>
                    <FaBars />
                </button>
                <img src={logo} alt="Logo" className="header-logo" />
                <h1 className="header-title"></h1>

                {/* Exibir nome do utilizador logado */}
                {isAuthenticated && userName && (
                    <div className="header-user">
                        <FaUser className="user-icon" />
                        <span>{displayName}</span>
                    </div>
                )}
            </header>

            <Offcanvas show={showDrawer} onHide={handleCloseDrawer} backdrop={true} className="drawer">
                <Offcanvas.Header closeButton className="drawer-header"></Offcanvas.Header>
                <Offcanvas.Body>
                    <Nav className="flex-column">
                        <Nav.Link as={Link} to="/agenda" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaCalendarAlt className="drawer-icon" /> Agenda
                        </Nav.Link>
                        <Nav.Link as={Link} to="/autocarros" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaBus className="drawer-icon" /> Autocarros
                        </Nav.Link>
                        <Nav.Link as={Link} to="/trippage" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaSuitcase className="drawer-icon" /> Viagens
                        </Nav.Link>
                        <Nav.Link as={Link} to="/countries" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaCity className="drawer-icon" /> Países
                        </Nav.Link>

                        {/* Mostrar "Lista de Utilizadores" apenas para support@advir.pt */}
                        {userEmail === "support@advir.pt" && (
                            <Nav.Link as={Link} to="/users" className="drawer-link" onClick={handleCloseDrawer}>
                                <FaUser className="drawer-icon" /> Lista de Utilizadores
                            </Nav.Link>
                        )}
                    </Nav>
                </Offcanvas.Body>
                <div className="drawer-footer">
                    <Nav.Link onClick={handleLogout} className="drawer-link logout">
                        <FaSignOutAlt className="drawer-icon" /> Sair
                    </Nav.Link>
                </div>
            </Offcanvas>
        </>
    );
};

export default Header;
