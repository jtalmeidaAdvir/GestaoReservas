module.exports = (sequelize, DataTypes) => {
    const City = sequelize.define("City", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nome: { type: DataTypes.STRING, allowNull: false },
        countryId: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            references: { model: "Countries", key: "id" } 
        },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        createdOn: { type: DataTypes.STRING, allowNull: true },
        createdBy: { type: DataTypes.STRING, allowNull: true },
        updatedOn: { type: DataTypes.STRING, allowNull: true },
        updatedBy: { type: DataTypes.STRING, allowNull: true },
    });

    return City;
};
