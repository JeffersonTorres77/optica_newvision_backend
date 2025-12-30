const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Venta = require('./Venta');

const OrdenTrabajo = sequelize.define('OrdenTrabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  orden_key: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  sede: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  venta_key: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  fecha_inicio_proceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_entrega_estimada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progreso: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  consecutivo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  archivado: {
    type: DataTypes.TINYINT,
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
  tableName: 'ordenes_trabajo',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

OrdenTrabajo.belongsTo(Venta, {
  foreignKey: 'venta_key',
  targetKey: 'venta_key',
  as: 'venta'
});

module.exports = OrdenTrabajo;
