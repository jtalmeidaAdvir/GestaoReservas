// migrations/20250422-create-prices.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Prices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      descricao: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      countryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Countries', key: 'id' }
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Prices');
  }
};