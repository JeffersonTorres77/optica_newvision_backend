const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Empresa = sequelize.define('Empresa', {
    id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
    },
    sede: {
        type: DataTypes.STRING(50),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    rif: {
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
    correo: {
        type: DataTypes.STRING(200),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    direccion: {
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
    tableName: 'empresas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Empresa;
