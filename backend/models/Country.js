module.exports = (sequelize, DataTypes) => {
    const Country = sequelize.define("Country", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nome: { type: DataTypes.STRING, allowNull: false, unique: true },
        codigo: { type: DataTypes.STRING, allowNull: false, unique: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        createdOn: { type: DataTypes.STRING, allowNull: true },
        createdBy: { type: DataTypes.STRING, allowNull: true },
        updatedOn: { type: DataTypes.STRING, allowNull: true },
        updatedBy: { type: DataTypes.STRING, allowNull: true },
    });

    return Country;
};
