const { Model, DataTypes } = require('sequelize');

class Razas extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'razas',
            modelName: 'Razas',
            timestamps: true,
        };
    }
}

const RazasSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    id_especie: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_especie'
    },
    nombre: {
        allowNull: false,
        type: DataTypes.STRING(50),
        field: 'nombre'
    }
}

module.exports = { Razas, RazasSchema};