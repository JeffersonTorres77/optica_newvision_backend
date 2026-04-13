const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BancoReceptor = sequelize.define('BancoReceptor', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
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
    tableName: 'bancos_receptores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = BancoReceptor;
