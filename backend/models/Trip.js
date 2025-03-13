// models/Trip.js
module.exports = (sequelize, DataTypes) => {
    const Trip = sequelize.define("Trip", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        busId: { type: DataTypes.INTEGER, allowNull: true },
        dataviagem: { type: DataTypes.STRING, allowNull: true }, // Data da viagem
        origem: { type: DataTypes.STRING, allowNull: true },
        origemCidade: { type: DataTypes.STRING, allowNull: true }, // 🆕 Novo campo

        destino: { type: DataTypes.STRING, allowNull: true },
        destinoCidade: { type: DataTypes.STRING, allowNull: true }, // 🆕 Novo campo

        motorista: { type: DataTypes.STRING, allowNull: true },
        horaPartida: { type: DataTypes.TIME, allowNull: true },
        horaChegada: { type: DataTypes.TIME, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    });

    Trip.associate = (models) => {
        Trip.belongsTo(models.Bus, { foreignKey: "busId" });
        Trip.hasMany(models.Reservation, { foreignKey: "tripId" });
    };

    return Trip;
};
