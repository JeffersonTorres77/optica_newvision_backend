const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Paciente = require('./Paciente');

const Cliente = sequelize.define('Cliente', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
    },
    sede_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    cedula: {
        type: DataTypes.STRING(20),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

Cliente.belongsTo(Paciente, {
    foreignKey: 'cedula',
    targetKey: 'cedula',
    as: 'paciente'
});

module.exports = Cliente;
