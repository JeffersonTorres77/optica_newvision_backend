const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BancoReceptorConfig = sequelize.define('BancoReceptorConfig', {
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
    codigo: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    scope: {
        type: DataTypes.ENUM('national', 'international'),
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'bancos_receptores_config',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = BancoReceptorConfig;
