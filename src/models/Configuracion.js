const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Configuracion = sequelize.define('Configuracion', {
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
    clave: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    valor: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'configuraciones',
    timestamps: false
});

module.exports = Configuracion;