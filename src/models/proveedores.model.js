const { Model, DataTypes } = require('sequelize');

class Proveedores extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'proveedores',
            modelName: 'Proveedores',
            timestamps: true,
        };
    }
}

const ProveedoresSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    nombre: {
        allowNull: false,
        type: DataTypes.STRING(100),
        field: 'nombre'
    },
    contacto: {
        allowNull: false,
        type: DataTypes.STRING(100),
        field: 'contacto'
    },
    telefono: {
        allowNull: false,
        type: DataTypes.STRING(20),
        field: 'telefono'
    },
    email: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING(100),
        field: 'email'
    }
}

module.exports = { Proveedores, ProveedoresSchema};