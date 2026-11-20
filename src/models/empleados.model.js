const { Model, DataTypes } = require('sequelize');

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
    }
}

module.exports = { Empleados, EmpleadosSchema};