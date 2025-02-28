require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// Importa as rotas e o módulo de base de dados
const userRoutes = require("./routes/userRoutes");
const busRoutes = require("./routes/busRoutes");
const tripRoutes = require("./routes/tripRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const countryRoutes = require("./routes/countryRoutes");
const cityRoutes = require("./routes/cityRoutes");
const emailRoutes = require("./routes/email");
const { initializeDatabase } = require("./config/database"); // ou ./models se estiver nessa pasta

const app = express();

// Configuração de middlewares
app.use(bodyParser.json({ limit: "60mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "60mb" }));
app.use(cors({ origin: "*", credentials: true }));

// Configuração das rotas
app.use("/users", userRoutes);
app.use("/buses", busRoutes);
app.use("/trips", tripRoutes);
app.use("/reservations", reservationRoutes);
app.use("/countries", countryRoutes);
app.use("/cities", cityRoutes);
app.use("/email", emailRoutes);

// Criação do servidor HTTP e integração com Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

// Middleware para disponibilizar o Socket.io aos controladores
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Configuração dos WebSockets
io.on("connection", (socket) => {
    console.log("⚡ Novo cliente conectado:", socket.id);
    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
    });
});

// Inicializa a base de dados e, em caso de sucesso, inicia o servidor
initializeDatabase()
    .then(() => {
        server.listen(3010, () => console.log("🚀 Servidor a correr na porta 4000 com WebSockets"));
    })
    .catch(error => console.log("🔥 Erro ao iniciar o servidor:", error));
