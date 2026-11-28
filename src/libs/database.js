const sequelize = require('./sequelize');
const runMigrations = require('../migrations');

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await runMigrations(sequelize);
}

module.exports = {
  sequelize,
  initializeDatabase
};
