// migrations/20250422-create-trips.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Trips', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      busId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Buses', key: 'id' }
      },
      dataviagem: { type: Sequelize.STRING },
      origem: { type: Sequelize.STRING },
      origemCidade: { type: Sequelize.STRING },
      destino: { type: Sequelize.STRING },
      destinoCidade: { type: Sequelize.STRING },
      motorista: { type: Sequelize.STRING },
      notas: { type: Sequelize.STRING },
      horaPartida: { type: Sequelize.TIME },
      horaChegada: { type: Sequelize.TIME },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Trips');
  }
};