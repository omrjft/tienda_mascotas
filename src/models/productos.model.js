const { Model, DataTypes } = require('sequelize');

class Productos extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'productos',
            modelName: 'Productos',
            timestamps: true,
        };
    }
}

const ProductosSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    id_categoria_producto: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_categoria_producto'
    },
    id_proveedor: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_proveedor'
    },
    nombre: {
        allowNull: false,
        type: DataTypes.STRING(100),
        field: 'nombre'
    },
    precio: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: 'precio'
    },
    stock: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER,
        field: 'stock'
    },
    imagen: {
        allowNull: true,
        type: DataTypes.STRING(2048),
        field: 'imagen'
    }
}

module.exports = { Productos, ProductosSchema};