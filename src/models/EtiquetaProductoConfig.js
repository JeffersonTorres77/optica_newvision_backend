const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EtiquetaProductoConfig = sequelize.define('EtiquetaProductoConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    sede: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    fields: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        defaultValue: '[]'
    },
    columns: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    },
    label_width_mm: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 63
    },
    label_height_mm: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 34
    },
    show_border: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    cantidad_masiva_default: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'etiquetas_productos_config',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = EtiquetaProductoConfig;