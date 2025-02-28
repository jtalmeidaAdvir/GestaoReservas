require('dotenv').config(); // Carrega as variáveis de ambiente
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Sequelize } = require("sequelize");
const sql = require("mssql");
const http = require("http");
const { Server } = require("socket.io");

// Variáveis de ambiente para a base de dados
const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT, 10) || 1433;

// Função para verificar se a base de dados existe
async function checkDatabaseExists() {
    try {
        const pool = await sql.connect({
            user: dbUsername,
            password: dbPassword,
            server: dbHost,
            port: dbPort,
            options: {
                encrypt: false,
                trustServerCertificate: true,
            }
        });
        const result = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
        await pool.close();
        return result.recordset.length > 0;
    } catch (error) {
        console.error("Erro ao verificar se a base de dados existe:", error);
        throw error;
    }
}

// Função para criar a base de dados, se não existir
async function createDatabase() {
    try {
        const pool = await sql.connect({
            user: dbUsername,
            password: dbPassword,
            server: dbHost,
            port: dbPort,
            options: {
                encrypt: false,
                trustServerCertificate: true,
            }
        });
        await pool.request().query(`CREATE DATABASE ${dbName}`);
        console.log(`Base de dados '${dbName}' criada com sucesso!`);
        await pool.close();
    } catch (error) {
        console.error("Erro ao criar a base de dados:", error);
        throw error;
    }
}

// Função que verifica e cria a base de dados se necessário
async function createDatabaseIfNotExists() {
    const exists = await checkDatabaseExists();
    if (!exists) {
        console.log(`Base de dados '${dbName}' não existe. A criar...`);
        await createDatabase();
    } else {
        console.log(`Base de dados '${dbName}' já existe. Nenhuma ação necessária.`);
    }
}

// Instancia o Sequelize
const sequelize = new Sequelize(dbName, dbUsername, dbPassword, {
    host: dbHost,
    dialect: "mssql",
    port: dbPort,
    logging: console.log,
});

// Inicializa a ligação ao Sequelize e garante que a base de dados existe
async function initializeSequelize() {
    await createDatabaseIfNotExists();
    try {
        await sequelize.authenticate();
        console.log("Conexão ao Sequelize bem-sucedida!");
    } catch (error) {
        console.error("Erro ao conectar ao Sequelize:", error);
    }
}

// Criação da aplicação Express
const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json({ limit: "60mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "60mb" }));

// Rotas de exemplo
// Rota de registo
app.post("/register", async (req, res) => {
    try {
        const { nome, apelido, email, password, telefone, tipo } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await sequelize.query(
            `INSERT INTO Users (nome, apelido, email, password, telefone, tipo, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())`,
            { replacements: [nome, apelido, email, hashedPassword, telefone, tipo] }
        );
        res.status(201).json({ message: "Utilizador registado com sucesso!" });
    } catch (error) {
        console.error("Erro ao registar utilizador:", error);
        res.status(500).json({ error: "Erro ao registar utilizador" });
    }
});

// Rota de login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const [user] = await sequelize.query(
            `SELECT * FROM Users WHERE email = ?`,
            { replacements: [email] }
        );
        
        if (!user || user.length === 0) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        res.json({ message: "Login bem-sucedido!", user: user[0] });
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ error: "Erro ao fazer login" });
    }
});

// Rota para listar utilizadores
app.get("/users", async (req, res) => {
    try {
        const [users] = await sequelize.query("SELECT * FROM Users");
        res.json(users);
    } catch (error) {
        console.error("Erro ao buscar utilizadores:", error);
        res.status(500).json({ error: "Erro ao buscar utilizadores" });
    }
});

// Aqui poderás adicionar mais rotas, por exemplo, para buses, trips, reservas, etc.
// app.use("/buses", busRoutes);
// app.use("/trips", tripRoutes);
// ...

// Criação do servidor HTTP e integração com Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"],
    },
});

// Middleware para disponibilizar o 'io' nos controladores, se necessário
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

// Inicializa o Sequelize e, após a conexão, inicia o servidor
initializeSequelize()
    .then(() => {
        server.listen(4001, () =>
            console.log("🚀 Servidor a correr na porta 4001 com WebSockets")
        );
    })
    .catch((error) => console.log("🔥 Erro ao iniciar o servidor:", error));

module.exports = { sequelize, initializeSequelize };
