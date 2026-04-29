const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Producto = require('./Producto');

function buildJsonColumn(fieldName) {
  return {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const valor = this.getDataValue(fieldName);
      if (!valor) {
        return null;
      }

      if (typeof valor === 'object') {
        return valor;
      }

      try {
        return JSON.parse(valor);
      } catch {
        return null;
      }
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue(fieldName, null);
        return;
      }

      this.setDataValue(fieldName, JSON.stringify(value));
    }
  };
}

const PresupuestoItem = sequelize.define('PresupuestoItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  presupuesto_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  posicion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  producto_codigo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  descuento_porcentaje: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  },
  subtotal_linea: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  total_linea: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  },
  moneda: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  precio_original: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  moneda_original: {
    type: DataTypes.STRING(20),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  tasa_conversion: {
    type: DataTypes.DECIMAL(14, 6),
    allowNull: true
  },
  configuracion_tecnica: buildJsonColumn('configuracion_tecnica'),
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
  tableName: 'presupuesto_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

PresupuestoItem.belongsTo(Producto, {
  foreignKey: 'producto_id',
  targetKey: 'id',
  as: 'producto'
});

module.exports = PresupuestoItem;