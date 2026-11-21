const { Sequelize } = require('sequelize');

const dotenv = require('dotenv');
dotenv.config();
const setupModels = require('../models');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres'
    }
);

setupModels(sequelize);
sequelize.sync({ alter: true }).catch((error) => {
    console.error('Unable to synchronize database:', error);
});

module.exports = sequelize;