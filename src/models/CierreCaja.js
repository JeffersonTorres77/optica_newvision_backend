const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CierreCaja = sequelize.define('CierreCaja', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  sede: {
    type: DataTypes.STRING(50),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'abierto',
    collate: 'utf8mb4_general_ci'
  },
  moneda_principal: {
    type: DataTypes.STRING(10),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  tasa_dolar: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 1
  },
  tasa_euro: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 1
  },
  tasa_bolivar: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 1
  },
  usuario_apertura_cedula: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    allowNull: false
  },
  observaciones_apertura: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  efectivo_inicial_total: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_inicial_bs: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_inicial_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_inicial_eur: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  usuario_cierre_cedula: {
    type: DataTypes.STRING(20),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notas_cierre: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  total_ingresos: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  total_egresos: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  total_neto: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  ventas_contado: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  ventas_credito: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  ventas_pendientes: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_teorico_final: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_real_final: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  efectivo_real_usd: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  efectivo_real_eur: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  efectivo_real_ves: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  diferencia_total: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  estado_conciliacion: {
    type: DataTypes.STRING(30),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  imprimir_resumen: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 1,
    get() {
      return this.getDataValue('imprimir_resumen') === 1;
    },
    set(value) {
      this.setDataValue('imprimir_resumen', value ? 1 : 0);
    }
  },
  enviar_email: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('enviar_email') === 1;
    },
    set(value) {
      this.setDataValue('enviar_email', value ? 1 : 0);
    }
  },
  motivo_anulacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  fecha_revision: {
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
  }
}, {
  tableName: 'cierres_caja',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = CierreCaja;