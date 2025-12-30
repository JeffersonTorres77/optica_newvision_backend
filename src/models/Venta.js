const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Ajusta la ruta según tu estructura
const VentaPago = require('./VentaPago');
const VentaProducto = require('./VentaProducto');
const VentaCashea = require('./VentaCashea');
const VentaCasheaCuota = require('./VentaCasheaCuota');
const Usuario = require('./Usuario');
const VentaPagoAgrupado = require('./VentaPagoAgrupado');
const HistorialMedico = require('./HistorialMedico');

const Venta = sequelize.define('Venta', {
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
  numero_control: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  sede: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  paciente_key: {
    type: DataTypes.STRING(70),
    allowNull: true
  },
  cliente_tipo: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  cliente_informacion_persona: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cliente_informacion_nombre: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cliente_informacion_cedula: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cliente_informacion_telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cliente_informacion_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  historia_medica_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(70),
    allowNull: false
  },
  tasa_moneda: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  forma_pago: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  iva_porcentaje: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  descuento: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  iva: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  pago_completo: {
    type: DataTypes.TINYINT,
    allowNull: false
  },
  created_by: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  asesor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estatus_venta: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  estatus_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  motivo_cancelacion: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Venta.hasOne(VentaCashea, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'datos_cashea'
});

Venta.hasMany(VentaCasheaCuota, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'cuotas_cashea'
});

Venta.hasMany(VentaPago, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'array_pagos'
});

Venta.hasMany(VentaPagoAgrupado, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'array_pagos_agrupados'
});

Venta.hasMany(VentaProducto, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'array_productos'
});

Venta.belongsTo(Usuario, {
  foreignKey: 'created_by',
  targetKey: 'cedula',
  as: 'creater_user'
});

Venta.belongsTo(Usuario, {
  foreignKey: 'asesor_id',
  targetKey: 'id',
  as: 'asesor_user'
});

Venta.belongsTo(HistorialMedico, {
  foreignKey: 'historia_medica_id',
  targetKey: 'id',
  as: 'historia_medica'
});

module.exports = Venta;