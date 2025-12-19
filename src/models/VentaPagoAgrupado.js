const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Ajusta la ruta según tu estructura

const VentaPagoAgrupado = sequelize.define('VentaPagoAgrupado', {
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
  monto_abonado: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
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
  tableName: 'ventas_pagos_agrupados',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = VentaPagoAgrupado;