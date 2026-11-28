const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

async function runMigrations(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'SequelizeMeta';

  if (!(await queryInterface.tableExists(tableName))) {
    await queryInterface.createTable(tableName, {
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true
      }
    });
  }

  const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
  const executed = new Set(rows.map(row => row.name));
  const migrations = fs.readdirSync(__dirname)
    .filter(file => /^\d+.*\.js$/.test(file))
    .sort();

  for (const file of migrations) {
    if (executed.has(file)) continue;

    const migration = require(path.join(__dirname, file));
    await sequelize.transaction(async (transaction) => {
      await migration.up({ sequelize, transaction });
      await queryInterface.bulkInsert(tableName, [{ name: file }], { transaction });
    });
    console.log(`Migración aplicada: ${file}`);
  }
}

module.exports = runMigrations;
