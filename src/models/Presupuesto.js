const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Sede = require('./Sede');
const PresupuestoItem = require('./PresupuestoItem');

const Presupuesto = sequelize.define('Presupuesto', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  presupuesto_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    collate: 'utf8mb4_general_ci'
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  sede_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  cliente_ref_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cliente_tipo_persona: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'natural',
    collate: 'utf8mb4_general_ci'
  },
  cliente_cedula: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  cliente_nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  cliente_telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  cliente_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  cliente_direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  cliente_razon_social: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  historia_medica_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  historia_numero: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  paciente_key_origen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  paciente_id_origen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  vendedor_nombre: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  asesor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  iva_porcentaje: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 16
  },
  subtotal: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0
  },
  descuento_total: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0
  },
  iva: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  formula_externa: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('formula_externa') === 1;
    },
    set(value) {
      this.setDataValue('formula_externa', value ? 1 : 0);
    }
  },
  formula_externa_refraccion_final: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get: getJson('formula_externa_refraccion_final'),
    set: setJson('formula_externa_refraccion_final')
  },
  opciones_cotizadas: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get: getJson('opciones_cotizadas'),
    set: setJson('opciones_cotizadas')
  },
  opcion_principal_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'vigente',
    collate: 'utf8mb4_general_ci'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_vencimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dias_vencimiento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  origen: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'manual',
    collate: 'utf8mb4_general_ci'
  },
  venta_key_origen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  archivado_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  updated_by: {
    type: DataTypes.STRING(20),
    allowNull: true,
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
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'presupuestos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    {
      unique: true,
      fields: ['sede_id', 'codigo']
    },
    {
      fields: ['sede_id', 'estado']
    },
    {
      fields: ['sede_id', 'fecha_vencimiento']
    },
    {
      fields: ['sede_id', 'cliente_cedula']
    }
  ]
});

Presupuesto.hasMany(PresupuestoItem, {
  foreignKey: 'presupuesto_id',
  as: 'items'
});

Presupuesto.belongsTo(Cliente, {
  foreignKey: 'cliente_ref_id',
  targetKey: 'id',
  as: 'cliente_referencia'
});

Presupuesto.belongsTo(Usuario, {
  foreignKey: 'created_by',
  targetKey: 'cedula',
  as: 'creater_user'
});

Presupuesto.belongsTo(Usuario, {
  foreignKey: 'asesor_id',
  targetKey: 'id',
  as: 'asesor_user'
});

Presupuesto.belongsTo(Sede, {
  foreignKey: 'sede_id',
  targetKey: 'id',
  as: 'sede'
});

function getJson(fieldName) {
  return function () {
    const raw = this.getDataValue(fieldName);
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };
}

function setJson(fieldName) {
  return function (value) {
    if (value === null || value === undefined || value === '') {
      this.setDataValue(fieldName, null);
      return;
    }

    if (typeof value === 'string') {
      this.setDataValue(fieldName, value);
      return;
    }

    this.setDataValue(fieldName, JSON.stringify(value));
  };
}

module.exports = Presupuesto;