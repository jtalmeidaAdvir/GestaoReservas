
// migrations/20250422-create-buses.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Buses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.STRING, allowNull: false },
      nlugares: { type: Sequelize.INTEGER, allowNull: false },
      imagem: { type: Sequelize.BLOB('long') },
      createdOn: { type: Sequelize.STRING },
      createdBy: { type: Sequelize.STRING },
      updatedOn: { type: Sequelize.STRING },
      updatedBy: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Buses');
  }
};
