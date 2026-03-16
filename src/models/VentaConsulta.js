const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VentaConsulta = sequelize.define('VentaConsulta', {
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
    historia_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pago_medico: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    pago_optica: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    es_formula_externa: {
        type: DataTypes.TINYINT(1),
        allowNull: false
    },
    tipo_especialista: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    monto_original: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'ventas_consultas',
    timestamps: false
});

module.exports = VentaConsulta;
