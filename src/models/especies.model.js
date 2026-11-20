const { Model, DataTypes } = require('sequelize');

class Especies extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'especies',
            modelName: 'Especies',
            timestamps: true,
        };
    }
}

const EspeciesSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    nombre: {
        allowNull: false,
        type: DataTypes.STRING(50),
        field: 'nombre'
    },
    habitat: {
        allowNull: false,
        type: DataTypes.STRING(255),
        field: 'habitat'
    }
}

module.exports = { Especies, EspeciesSchema};