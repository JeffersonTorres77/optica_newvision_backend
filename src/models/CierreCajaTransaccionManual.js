const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const CierreCaja = require('./CierreCaja');

const CierreCajaTransaccionManual = sequelize.define('CierreCajaTransaccionManual', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  cierre_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  monto: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  moneda: {
    type: DataTypes.STRING(10),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  monto_sistema: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  comprobante: {
    type: DataTypes.STRING(120),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  usuario_cedula: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'confirmado',
    collate: 'utf8mb4_general_ci'
  },
  origen: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'manual',
    collate: 'utf8mb4_general_ci'
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
  tableName: 'cierres_caja_transacciones_manuales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

CierreCaja.hasMany(CierreCajaTransaccionManual, {
  foreignKey: 'cierre_id',
  sourceKey: 'id',
  as: 'transacciones_manuales'
});

CierreCajaTransaccionManual.belongsTo(CierreCaja, {
  foreignKey: 'cierre_id',
  targetKey: 'id',
  as: 'cierre'
});

module.exports = CierreCajaTransaccionManual;