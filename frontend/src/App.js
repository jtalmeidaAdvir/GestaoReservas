import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Register from "./components/Autenticacao/Register";
import Login from "./components/Autenticacao/Login";
import UserList from "./components/Autenticacao/UserList";
import EditUser from "./components/Autenticacao/EditUser";

import Header from "./components/Header"; // Importa o cabeçalho fixo
import BusesList from "./components/Buses/BusesList"; 
import CreateBus from "./components/Buses/CreateBus";
import EditBus from "./components/Buses/EditBus";

import CountryList from "./components/Country/CountryList";
import CreateCountry from "./components/Country/CreateCountry";  

import PricesList from "./components/Prices/PricesList";
import CreatePrice from "./components/Prices/CreatePrice";  
import EditPrice from "./components/Prices/EditPrice";


import CityList from "./components/City/CityList";
import CreateCity from "./components/City/CreateCity";  
import EditCity from "./components/City/EditCity";


import Agenda from "./components/Agenda/Agenda";
import TripsList from "./components/Trip/TripsList";
import TripsPage from "./components/Trip/TripPage";
import EditTrip from "./components/Trip/EditTrip";
import BatchTripsPage from "./components/Trip/BatchTripsPage";
import Reservation from "./components/Reservation/Reservation"; 
import TripsByDayAndDirection from "./components/Reservation/TripsByDayAndDirection"; 
import MultiTripReservations from "./components/Reservation/DualReservationsTables"; 

import ExcelImportPage from "./components/Importador/ExcelImportPage"; 

import Manual from "./components/Help/Manual";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/header.css"; // Importação do CSS
import SearchTripPage from "./components/Reservation/SearchTripPage";

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token); // Define true se houver token
    }, []);

    return (
        <Router>
            {/* Passamos isAuthenticated para o Header */}
            <Header isAuthenticated={isAuthenticated} />

            <div className="app-content">
            <Routes>
                <Route path="/" element={<Navigate to={isAuthenticated ? "/agenda" : "/login"} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/users" element={isAuthenticated ? <UserList /> : <Navigate to="/login" />} />
                <Route path="/edit-user/:id" element={<EditUser />} />

                <Route path="/agenda" element={isAuthenticated ? <Agenda /> : <Navigate to="/login" />} />
                <Route path="/trips" element={<TripsList />} /> {/* Separadores de viagens*/}
                <Route path="/batchtrips" element={<BatchTripsPage />} /> {/* Separadores de viagens*/}
                

                <Route path="/reservation/:tripId" element={<Reservation />} /> {/* ✅ Nova rota */}
                <Route path="/reservations" element={<TripsByDayAndDirection />} /> {/* ✅ Nova rota */}
                <Route path="/multireservations" element={<MultiTripReservations />} /> {/* ✅ Nova rota */}

                <Route path="/searchtrip" element={<SearchTripPage />} /> {/* ✅ Nova rota */}

                {/* Gestão de autocarros */}
                <Route path="/autocarros" element={isAuthenticated ? <BusesList /> : <Navigate to="/login" />} />
                <Route path="/buses/create" element={isAuthenticated ? <CreateBus /> : <Navigate to="/login" />} />
                <Route path="/buses/edit/:id" element={isAuthenticated ? <EditBus /> : <Navigate to="/login" />} />
                <Route path="/trippage" element={<TripsPage />} /> {/* Lista viagens*/}
                <Route path="/trips/edit/:id" element={isAuthenticated ? <EditTrip /> : <Navigate to="/login" />} />

                
                <Route path="/countries" element={isAuthenticated ? <CountryList /> : <Navigate to="/login" />} />
                <Route path="/countries/create" element={isAuthenticated ? <CreateCountry /> : <Navigate to="/login" />} />

                <Route path="/prices" element={isAuthenticated ? <PricesList /> : <Navigate to="/login" />} />
                <Route path="/prices/create" element={isAuthenticated ? <CreatePrice /> : <Navigate to="/login" />} />
                <Route path="/prices/edit/:id" element={<EditPrice />} />


                <Route path="/cities" element={isAuthenticated ? <CityList /> : <Navigate to="/login" />} />
                <Route path="/cities/create" element={isAuthenticated ? <CreateCity /> : <Navigate to="/login" />} />
                <Route path="/cities/edit/:id" element={<EditCity />} />

                {/* <Route path="/importador" element={<ExcelImportPage />} /> */}

                <Route path="/manual" element={isAuthenticated ? <Manual /> : <Navigate to="/login" />} />
            </Routes>

            </div>
        </Router>
    );
};

export default App;
