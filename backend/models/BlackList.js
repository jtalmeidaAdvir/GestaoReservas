module.exports = (sequelize, DataTypes) => {
    const BlackList = sequelize.define(
      "BlackList",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tripId: { type: DataTypes.INTEGER, allowNull: false },
        reserva: { type: DataTypes.STRING, allowNull: false },
        preco: { type: DataTypes.FLOAT, allowNull: true },
        moeda: { type: DataTypes.STRING, allowNull: true },
        entrada: { type: DataTypes.STRING, allowNull: true },
        nomePassageiro: { type: DataTypes.STRING, allowNull: true },
        apelidoPassageiro: { type: DataTypes.STRING, allowNull: true },
        telefone: { type: DataTypes.STRING, allowNull: true },
        saida: { type: DataTypes.STRING, allowNull: true },
        volta: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        obs: { type: DataTypes.TEXT, allowNull: true },
        carro: { type: DataTypes.TEXT, allowNull: true },
        lugar: { type: DataTypes.INTEGER, allowNull: true },
        valorCarro: {type: DataTypes.STRING,  allowNull: true},
        valorVolume: {type: DataTypes.STRING,allowNull: true},
        impresso: {type: DataTypes.STRING,allowNull: true},
        bilhete: {type: DataTypes.STRING,allowNull: true},
        precoBase: { type: DataTypes.FLOAT,allowNull: true,},
        isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: true },
        createdBy: { type: DataTypes.STRING, allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW } // opcional
      },
      { tableName: "ListaNegra" }
    );
  
    BlackList.associate = (models) => {
      BlackList.belongsTo(models.Trip, { foreignKey: "tripId" });
    };
  
    return BlackList;
  };
  