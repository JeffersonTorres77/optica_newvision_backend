const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Ajusta la ruta según tu estructura
const Producto = require('./Producto');

const VentaProducto = sequelize.define('VentaProducto', {
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
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  precio_unitario_sin_iva: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  tiene_iva: {
    type: DataTypes.TINYINT,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  moneda_producto: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  tasa_moneda_producto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  total_moneda_producto: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'ventas_productos',
  timestamps: false
});

VentaProducto.belongsTo(Producto, {
  foreignKey: 'producto_id',
  targetKey: 'id',
  as: 'datos_producto'
});

module.exports = VentaProducto;