const { Model, DataTypes } = require('sequelize');

class Mascotas extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'mascotas',
            modelName: 'Mascotas',
            timestamps: true,
        };
    }
}

const MascotasSchema = {
    id:{
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    id_raza: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_raza'
    },
    id_proveedor: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_proveedor'
    },
    fecha_nacimiento: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'fecha_nacimiento'
    },
    precio: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: 'precio'
    },
    estado: {
        allowNull: false,
        type: DataTypes.STRING(20),
        field: 'estado'
    },
    imagen: {
        allowNull: true,
        type: DataTypes.STRING(2048),
        field: 'imagen'
    }
}

module.exports = { Mascotas, MascotasSchema};