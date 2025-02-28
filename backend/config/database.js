require('dotenv').config();
const { Sequelize } = require("sequelize");
const sql = require("mssql");

const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT, 10) || 1433;

async function checkDatabaseExists() {
    const pool = await sql.connect({
        user: dbUsername,
        password: dbPassword,
        server: dbHost,
        port: dbPort,
        options: { encrypt: false, trustServerCertificate: true }
    });
    const result = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
    await pool.close();
    return result.recordset.length > 0;
}

async function createDatabase() {
    const pool = await sql.connect({
        user: dbUsername,
        password: dbPassword,
        server: dbHost,
        port: dbPort,
        options: { encrypt: false, trustServerCertificate: true }
    });
    await pool.request().query(`CREATE DATABASE ${dbName}`);
    console.log(`Base de dados '${dbName}' criada com sucesso!`);
    await pool.close();
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

async function initializeDatabase() {
    await createDatabaseIfNotExists();
    try {
        await sequelize.authenticate();
        console.log("Conexão ao Sequelize bem-sucedida!");
    } catch (error) {
        console.error("Erro ao conectar ao Sequelize:", error);
        throw error;
    }
}

module.exports = { sequelize, initializeDatabase };
