module.exports = (sequelize, DataTypes) => {
    const Bus = sequelize.define("Bus", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nome: { type: DataTypes.STRING, allowNull: false },
        nlugares: { type: DataTypes.INTEGER, allowNull: false },
        imagem: { type: DataTypes.BLOB("long"), allowNull: true }, // Alterado para armazenar dados binários
        createdOn: { type: DataTypes.STRING, allowNull: true },
        createdBy: { type: DataTypes.STRING, allowNull: true },
        updatedOn: { type: DataTypes.STRING, allowNull: true },
        updatedBy: { type: DataTypes.STRING, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    });

    return Bus;
};
