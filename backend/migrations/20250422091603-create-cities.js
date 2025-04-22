// migrations/20250422-create-cities.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cities', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.STRING, allowNull: false },
      countryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Countries', key: 'id' },
        onDelete: 'CASCADE'
      },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdOn: { type: Sequelize.STRING },
      createdBy: { type: Sequelize.STRING },
      updatedOn: { type: Sequelize.STRING },
      updatedBy: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Cities');
  }
};