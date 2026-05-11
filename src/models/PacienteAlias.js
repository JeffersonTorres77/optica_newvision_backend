const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PacienteAlias = sequelize.define('PacienteAlias', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
  },
  alias_key: {
    type: DataTypes.STRING(70),
    allowNull: false,
    unique: true,
    collate: 'utf8mb4_general_ci'
  },
  paciente_key: {
    type: DataTypes.STRING(70),
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
  tableName: 'paciente_aliases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['alias_key']
    },
    {
      fields: ['paciente_key']
    }
  ]
});

module.exports = PacienteAlias;