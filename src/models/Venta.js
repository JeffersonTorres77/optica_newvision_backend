const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Ajusta la ruta según tu estructura
const VentaPago = require('./VentaPago');
const VentaProducto = require('./VentaProducto');
const VentaCashea = require('./VentaCashea');
const VentaCasheaCuota = require('./VentaCasheaCuota');
const Usuario = require('./Usuario');
const VentaPagoAgrupado = require('./VentaPagoAgrupado');
const JsonUtil = require('../utils/JsonUtil');
const VentaConsulta = require('./VentaConsulta');
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
  tipo_venta: {
    type: DataTypes.STRING(30),
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
  empresa_rif: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  empresa_nombre: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  empresa_telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  empresa_correo: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  empresa_direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(70),
    allowNull: false
  },
  tasas_actuales: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JsonUtil.get(this, 'tasas_actuales');
    },
    set(value) {
      JsonUtil.set(this, 'tasas_actuales', value);
    }
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
    allowNull: true
  },
  especialista_cedula: {
    type: DataTypes.STRING(20),
    allowNull: true
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

Venta.hasOne(VentaConsulta, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'venta_consulta'
});

Venta.hasOne(HistorialMedico, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'historia_medica'
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

Venta.belongsTo(Usuario, {
  foreignKey: 'especialista_cedula',
  targetKey: 'cedula',
  as: 'especialista_user'
});

module.exports = Venta;

// Declarar relaciones circulares al final para evitar errores de inicialización
const OrdenTrabajo = require('./OrdenTrabajo');
Venta.hasOne(OrdenTrabajo, {
  foreignKey: 'venta_key',
  sourceKey: 'venta_key',
  as: 'datos_orden_trabajo'
});