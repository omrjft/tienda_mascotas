const { Model, DataTypes } = require('sequelize');

class DetalleVentasMascotas extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'detalle_ventas_mascotas',
            modelName: 'DetalleVentasMascotas',
            timestamps: true,
        };
    }
}

const DetalleVentasMascotasSchema = {
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
    id_mascota: {
        allowNull: false,
        foreignKey: true,
        type: DataTypes.INTEGER,
        field: 'id_mascota'
    },
    precio: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: 'precio'
    }
}

module.exports = { DetalleVentasMascotas, DetalleVentasMascotasSchema};