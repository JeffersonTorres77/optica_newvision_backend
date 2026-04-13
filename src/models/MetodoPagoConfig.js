const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MetodoPagoConfig = sequelize.define('MetodoPagoConfig', {
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
    metodo_key: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    label: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    currency: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    requires_receiver_account: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_custom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    accounts: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        defaultValue: '[]'
    }
}, {
    tableName: 'metodos_pago_config',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = MetodoPagoConfig;
