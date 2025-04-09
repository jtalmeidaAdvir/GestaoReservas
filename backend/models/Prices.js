module.exports = (sequelize, DataTypes) => {
    const Price = sequelize.define("Price", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        descricao: { type: DataTypes.STRING, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        countryId: { type: DataTypes.INTEGER, allowNull: false }
    }, {
        timestamps: true // isto é o default, mas confirma que não está a false
    });
    

    return Price;
};
