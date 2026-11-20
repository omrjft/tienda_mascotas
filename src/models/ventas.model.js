const { Model, DataTypes } = require('sequelize');

class Ventas extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'ventas',
            modelName: 'Ventas',
            timestamps: true,
        };
    }
}

const VentasSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    id_cliente: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_cliente'
    },
    id_empleado: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_empleado'
    },
    fecha_hora: {
        allowNull: false,
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE,
        field: 'fecha_hora'
    },
    total: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: 'total'
    }
}

module.exports = { Ventas, VentasSchema};