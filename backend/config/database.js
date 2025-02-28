require('dotenv').config(); // Carrega as variáveis de ambiente
const { Sequelize } = require("sequelize");
const sql = require("mssql");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT, 10) || 1433;

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

async function createDatabaseIfNotExists() {
    const exists = await checkDatabaseExists();
    if (!exists) {
        console.log(`Base de dados '${dbName}' não existe. A criar...`);
        await createDatabase();
    } else {
        console.log(`Base de dados '${dbName}' já existe. Nenhuma ação necessária.`);
    }
}

const sequelize = new Sequelize(dbName, dbUsername, dbPassword, {
    host: dbHost,
    dialect: "mssql",
    port: dbPort,
    logging: console.log,
});

async function initializeSequelize() {
    await createDatabaseIfNotExists();
    try {
        await sequelize.authenticate();
        console.log("Conexão ao Sequelize bem-sucedida!");
    } catch (error) {
        console.error("Erro ao conectar ao Sequelize:", error);
    }
}

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json());

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

app.listen(3001, () => {
    console.log("Servidor a correr na porta 3000");
    initializeSequelize();
});

module.exports = { sequelize, initializeSequelize };
