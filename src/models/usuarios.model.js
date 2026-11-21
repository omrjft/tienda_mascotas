const { Model, DataTypes } = require('sequelize');

class Usuarios extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'usuarios',
            modelName: 'Usuarios',
            timestamps: true,
        };
    }
}

const UsuariosSchema = {
  id: {
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  },
  email: {
    allowNull: false,
    unique: true,
    type: DataTypes.STRING(100),
    field: 'email'
  },
  password: {
    allowNull: false,
    type: DataTypes.STRING(255),
    field: 'password'
  },
  rol: {
    allowNull: false,
    type: DataTypes.ENUM('gerente', 'empleado', 'cliente'),
    defaultValue: 'cliente',
    field: 'rol'
  },
  activo: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'activo'
  }
}

module.exports = { Usuarios, UsuariosSchema };