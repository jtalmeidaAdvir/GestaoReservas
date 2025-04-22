// migrations/20250422-create-blacklist.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ListaNegra', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tripId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Trips', key: 'id' },
        onDelete: 'CASCADE'
      },
      reserva: { type: Sequelize.STRING, allowNull: false },
      preco: { type: Sequelize.FLOAT },
      moeda: { type: Sequelize.STRING },
      entrada: { type: Sequelize.STRING },
      nomePassageiro: { type: Sequelize.STRING },
      apelidoPassageiro: { type: Sequelize.STRING },
      telefone: { type: Sequelize.STRING },
      saida: { type: Sequelize.STRING },
      volta: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      obs: { type: Sequelize.TEXT },
      carro: { type: Sequelize.TEXT },
      lugar: { type: Sequelize.INTEGER },
      valorCarro: { type: Sequelize.STRING },
      valorVolume: { type: Sequelize.STRING },
      impresso: { type: Sequelize.STRING },
      bilhete: { type: Sequelize.STRING },
      precoBase: { type: Sequelize.FLOAT },
      isConfirmed: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdBy: { type: Sequelize.STRING },
      deletedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ListaNegra');
  }
};
