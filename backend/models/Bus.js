module.exports = (sequelize, DataTypes) => {
    const Bus = sequelize.define("Bus", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nome: { type: DataTypes.STRING, allowNull: false },
        nlugares: { type: DataTypes.INTEGER, allowNull: false },
        imagem: { type: DataTypes.BLOB("long"), allowNull: true },
        createdOn: { type: DataTypes.STRING, allowNull: true },
        createdBy: { type: DataTypes.STRING, allowNull: true },
        updatedOn: { type: DataTypes.STRING, allowNull: true },
        updatedBy: { type: DataTypes.STRING, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
    });

    return Bus;
};
