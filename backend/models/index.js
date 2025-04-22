const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs"); // 🔥 Importa o bcryptjs



const User = require("./User")(sequelize, DataTypes);
const Bus = require("./Bus")(sequelize, DataTypes);
const Trip = require("./Trip")(sequelize, DataTypes);
const Reservation = require("./Reservation")(sequelize, DataTypes);
const Country = require("./Country")(sequelize, DataTypes);
const City = require("./City")(sequelize, DataTypes);
const Price = require("./Prices")(sequelize, DataTypes);
const BlackList = require("./BlackList")        (sequelize, DataTypes);

const db = {
    sequelize,
    Sequelize,
    User,
    Bus,
    Trip,
    Reservation,
    Country,
    City,
    Price,
    BlackList
};
db.Price = Price;


// 🛠️ **Associações**
Bus.hasMany(Trip, { foreignKey: "busId" });
Trip.belongsTo(Bus, { foreignKey: "busId" });

Trip.hasMany(Reservation, { foreignKey: "tripId" });
Reservation.belongsTo(Trip, { foreignKey: "tripId" });

// 📌 **Associação entre País e Cidade (1 país pode ter várias cidades)**
Country.hasMany(City, { foreignKey: "countryId", onDelete: "CASCADE" });
City.belongsTo(Country, { foreignKey: "countryId" });

// Relação 1:N -> Um país tem muitos preços
Country.hasMany(Price, { foreignKey: 'countryId' });
Price.belongsTo(Country, { foreignKey: 'countryId', as: 'Country' });




// 📌 **Função para garantir a criação do utilizador de suporte**
async function createSupportUser() {
    try {
        const supportEmail = "support@advir.pt";
        const supportPassword = "agencianunes2025";

        // Verificar se já existe um utilizador com esse e-mail
        const existingUser = await User.findOne({ where: { email: supportEmail } });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(supportPassword, 10);
            await User.create({
                nome: "Suporte",
                apelido: "Advir",
                email: supportEmail,
                password: hashedPassword,
                telefone: "000000000", // Opcional
                tipo: "admin" // Ajustar conforme necessário
            });
            console.log("✔ Conta de suporte criada automaticamente.");
        } else {
            console.log("⚡ Conta de suporte já existe.");
        }
    } catch (error) {
        console.error("🔥 Erro ao criar conta de suporte:", error);
    }
}

// 📌 **Sincronizar a base de dados e criar conta de suporte**
async function initializeDatabase() {
    try {
        await sequelize.sync({ alter: true }); // ou { force: true } para apagar e recriar
        console.log("🧱 Tabelas disponíveis:");
console.log(Object.keys(sequelize.models));

        console.log("✅ Base de dados sincronizada!");
        await createSupportUser();
    } catch (error) {
        console.error("🔥 Erro ao sincronizar base de dados:", error);
    }
}

module.exports = { ...db, initializeDatabase };