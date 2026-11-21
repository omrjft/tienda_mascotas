const { Model, DataTypes } = require('sequelize');
const { Usuarios } = require('./usuarios.model');

class Empleados extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'empleados',
            modelName: 'Empleados',
            timestamps: true,
        };
    }
}

const EmpleadosSchema = {
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
    puesto: {
        allowNull: false,
        type: DataTypes.STRING(50),
        field: 'puesto'
    },
    fecha_ingreso:{
        allowNull: false,
        type: DataTypes.DATE,
        field: 'fecha_ingreso'
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

module.exports = { Empleados, EmpleadosSchema};