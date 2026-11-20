const { Model, DataTypes } = require('sequelize');

class Clientes extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'clientes',
            modelName: 'Clientes',
            timestamps: true,
        };
    }
}

const ClientesSchema = {
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
    telefono: {
        allowNull: false,
        type: DataTypes.STRING(20),
        field: 'telefono'
    },
    email:{
        allowNull: false,
        unique: true,
        type: DataTypes.STRING(100),
        field: 'email'
    }
}

module.exports = { Clientes, ClientesSchema};