const { Model, DataTypes } = require('sequelize');
const { Usuarios } = require('./usuarios.model');

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
    },
    usuarioId: {
        allowNull: true,
        unique: true,
        type: DataTypes.INTEGER,
        field: 'usuario_id',
        references: {
            model: Usuarios,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    }
}

module.exports = { Clientes, ClientesSchema};