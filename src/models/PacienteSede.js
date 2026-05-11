const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PacienteSede = sequelize.define('PacienteSede', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
  },
  paciente_key: {
    type: DataTypes.STRING(70),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  sede_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'paciente_sedes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['paciente_key', 'sede_id']
    },
    {
      fields: ['sede_id']
    }
  ]
});

module.exports = PacienteSede;