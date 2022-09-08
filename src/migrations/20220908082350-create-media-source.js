'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mediaSources', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sources: {
        type: Sequelize.BLOB,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mediaSources');
  },
};
