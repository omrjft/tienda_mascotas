const { Model, DataTypes } = require('sequelize');

class CategoriasProductos extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'categorias_productos',
            modelName: 'CategoriasProductos',
            timestamps: true,
        };
    }
}

const CategoriasProductosSchema = {
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
    descripcion: {
        allowNull: false,
        type: DataTypes.STRING(255),
        field: 'descripcion'
    }
}

module.exports = { CategoriasProductos, CategoriasProductosSchema};