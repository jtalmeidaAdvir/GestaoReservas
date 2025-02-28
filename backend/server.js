const express = require("express");
const http = require("http"); // 🔥 Criar servidor HTTP para WebSockets
const { Server } = require("socket.io"); // 🔥 Importar WebSockets
const bodyParser = require("body-parser");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const busRoutes = require("./routes/busRoutes");
const tripRoutes = require("./routes/tripRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const countryRoutes = require("./routes/countryRoutes");
const cityRoutes = require("./routes/cityRoutes");
const emailRoutes = require("./routes/email");

const { initializeDatabase } = require("./models"); // Importa initializeDatabase

const app = express();
const server = http.createServer(app); // Criar servidor HTTP
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"],
    },
});

// Aumentar o limite de upload de ficheiros
app.use(bodyParser.json({ limit: "60mb" })); // Permite até 50MB
app.use(bodyParser.urlencoded({ extended: true, limit: "60mb" }));

app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json());

// Middleware para disponibilizar o `io` nos controladores
app.use((req, res, next) => {
    req.io = io; // Agora podemos emitir eventos nos controladores
    next();
});

// Configurar rotas
app.use("/users", userRoutes);
app.use("/buses", busRoutes);
app.use("/trips", tripRoutes);
app.use("/reservations", reservationRoutes);
app.use("/countries", countryRoutes);
app.use("/cities", cityRoutes);
app.use("/email", emailRoutes);

// 🔥 WebSocket: Quando um cliente se conecta
io.on("connection", (socket) => {
    console.log("⚡ Novo cliente conectado:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
    });
});

// 🛠️ **Sincronizar a base de dados e criar a conta de suporte**
initializeDatabase()
    .then(() => {
        server.listen(3000, () => console.log("🚀 Servidor a correr na porta 3000 com WebSockets"));
    })
    .catch(error => console.log("🔥 Erro ao iniciar o servidor:", error));
