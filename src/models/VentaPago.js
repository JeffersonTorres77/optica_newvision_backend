const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Ajusta la ruta según tu estructura

const VentaPago = sequelize.define('VentaPago', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  venta_key: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  numero_pago: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  moneda_id: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  monto_moneda_base: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bancoCodigo: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  bancoNombre: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'ventas_pagos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = VentaPago;