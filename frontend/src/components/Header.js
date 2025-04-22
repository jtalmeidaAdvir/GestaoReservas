import React, { useState } from "react";

import { Offcanvas, Nav, Accordion } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaBus, FaSignOutAlt, FaBars, FaUser, FaSuitcase, FaCity, FaBook, FaTripadvisor, FaFileImport, FaTicketAlt, FaTable } from "react-icons/fa";
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
                    <Nav.Link as={Link} to="/searchtrip" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaFileImport className="drawer-icon" /> Nova Reserva
                        </Nav.Link>
                        <Nav.Link as={Link} to="/reservations" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaTripadvisor className="drawer-icon" /> Listagens
                        </Nav.Link>
                        <Nav.Link as={Link} to="/agenda" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaCalendarAlt className="drawer-icon" /> Agenda
                        </Nav.Link>
                       
                        <Accordion alwaysOpen flush className="drawer-accordion">
  <Accordion.Item eventKey="0">
    <Accordion.Header>
      <div className="d-flex align-items-center gap-3">
        <FaTable /> {/* Ícone das tabelas */}
        <span>Tabelas</span>
      </div>
    </Accordion.Header>
    <Accordion.Body className="p-0 m-0">
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/trippage" className="drawer-link ps-4" onClick={handleCloseDrawer}>
          <FaSuitcase className="drawer-icon" /> Viagens
        </Nav.Link>
        <Nav.Link as={Link} to="/autocarros" className="drawer-link ps-4" onClick={handleCloseDrawer}>
          <FaBus className="drawer-icon" /> Autocarros
        </Nav.Link>
        <Nav.Link as={Link} to="/countries" className="drawer-link ps-4" onClick={handleCloseDrawer}>
          <FaCity className="drawer-icon" /> Países
        </Nav.Link>
        <Nav.Link as={Link} to="/prices" className="drawer-link ps-4" onClick={handleCloseDrawer}>
          <FaTicketAlt className="drawer-icon" /> Preços Bilhetes
        </Nav.Link>
        
      </Nav>
    </Accordion.Body>
  </Accordion.Item>
</Accordion>
<Nav.Link as={Link} to="/manual" className="drawer-link ps-4" onClick={handleCloseDrawer}>
          <FaBook className="drawer-icon" /> Manual Utilização
        </Nav.Link>


                        {/*<Nav.Link as={Link} to="/importador" className="drawer-link" onClick={handleCloseDrawer}>
                            <FaFileImport className="drawer-icon" /> Importador
                        </Nav.Link>*/}

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
