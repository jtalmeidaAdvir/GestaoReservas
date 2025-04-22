require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();

// Configuração de middlewares
app.use(bodyParser.json({ limit: "60mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "60mb" }));
app.use(cors({ origin: "*", credentials: true }));

// Criação do servidor HTTP
const server = http.createServer(app);

// 🔹 Inicializa o WebSocket (Socket.io)
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

// 🔹 Agora importa os controladores (depois do io estar definido!)
const reservationController = require("./controllers/reservationController");
reservationController.setSocketIO(io);

// Middleware para disponibilizar o io aos controladores via req.io (Opcional)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Importação das rotas e base de dados
const userRoutes = require("./routes/userRoutes");
const busRoutes = require("./routes/busRoutes");
const tripRoutes = require("./routes/tripRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const countryRoutes = require("./routes/countryRoutes");
const pricesRoutes = require("./routes/pricesRoutes");
const cityRoutes = require("./routes/cityRoutes");
const emailRoutes = require("./routes/email");
const blackListRoutes = require("./routes/blackListRoutes");

const { initializeDatabase } = require("./config/database");

// Configuração das rotas
app.use("/users", userRoutes);
app.use("/buses", busRoutes);
app.use("/trips", tripRoutes);
app.use("/reservations", reservationRoutes);
app.use("/countries", countryRoutes);

app.use("/prices", pricesRoutes);
app.use("/cities", cityRoutes);
app.use("/email", emailRoutes);
app.use("/api/blacklist", blackListRoutes);


// Configuração dos WebSockets
io.on("connection", (socket) => {
    console.log("⚡ Novo cliente conectado:", socket.id);
    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
    });
});

// Inicializa a base de dados e inicia o servidor
initializeDatabase()
    .then(() => {
        
        server.listen(3010, () => console.log("🚀 Servidor a correr na porta 3010 com WebSockets"));
    })
    .catch(error => console.log("🔥 Erro ao iniciar o servidor:", error));
