const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const CierreCaja = require('./CierreCaja');

const CierreCajaConciliacion = sequelize.define('CierreCajaConciliacion', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  cierre_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  metodo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  banco: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  banco_codigo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  destino_key: {
    type: DataTypes.STRING(150),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  destino_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  monto_sistema: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  monto_real: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  diferencia: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  cantidad_sistema: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cantidad_real: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cierres_caja_conciliaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

CierreCaja.hasMany(CierreCajaConciliacion, {
  foreignKey: 'cierre_id',
  sourceKey: 'id',
  as: 'conciliaciones'
});

CierreCajaConciliacion.belongsTo(CierreCaja, {
  foreignKey: 'cierre_id',
  targetKey: 'id',
  as: 'cierre'
});

module.exports = CierreCajaConciliacion;