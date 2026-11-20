const { Model, DataTypes } = require('sequelize');

class DetalleVentasProductos extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'detalle_ventas_productos',
            modelName: 'DetalleVentasProductos',
            timestamps: true,
        };
    }
}

const DetalleVentasProductosSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    id_venta: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_venta'
    },
    id_producto: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_producto'
    },
    cantidad: {
        allowNull: false,
        type: DataTypes.INTEGER,
        field: 'cantidad'
    },
    precio: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: 'precio'
    }
}

module.exports = { DetalleVentasProductos, DetalleVentasProductosSchema};