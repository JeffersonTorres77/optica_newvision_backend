const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Sede = require('./Sede');

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

const Producto = sequelize.define('Producto', {
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
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    marca: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    color: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    codigo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    material: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    proveedor: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    categoria: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    modelo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    stock: {
        type: DataTypes.INTEGER(11),
        allowNull: false
    },
    precio: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    aplica_iva: {
        type: DataTypes.TINYINT(4),
        allowNull: false,
        defaultValue: 0,
        get() {
            return this.getDataValue('aplica_iva') === 1;
        },
        set(value) {
            this.setDataValue('aplica_iva', value ? 1 : 0);
        }
    },
    precio_con_iva: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    moneda: {
        type: DataTypes.STRING(20),
        allowNull: false,
        collate: 'utf8mb4_general_ci'
    },
    activo: {
        type: DataTypes.TINYINT(4),
        allowNull: false,
        defaultValue: 0,
        get() {
            return this.getDataValue('activo') === 1;
        },
        set(value) {
            this.setDataValue('activo', value ? 1 : 0);
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_general_ci'
    },
    cristal_config: buildJsonColumn('cristal_config'),
    montura_config: buildJsonColumn('montura_config'),
    lente_contacto_config: buildJsonColumn('lente_contacto_config'),
    liquido_config: buildJsonColumn('liquido_config'),
    estuche_config: buildJsonColumn('estuche_config'),
    accesorio_config: buildJsonColumn('accesorio_config'),
    requiere_formula: {
        type: DataTypes.TINYINT(4),
        allowNull: false,
        defaultValue: 0,
        get() {
            return this.getDataValue('requiere_formula') === 1;
        },
        set(value) {
            this.setDataValue('requiere_formula', value ? 1 : 0);
        }
    },
    requiere_item_padre: {
        type: DataTypes.TINYINT(4),
        allowNull: false,
        defaultValue: 0,
        get() {
            return this.getDataValue('requiere_item_padre') === 1;
        },
        set(value) {
            this.setDataValue('requiere_item_padre', value ? 1 : 0);
        }
    },
    imagen_url: {
        type: DataTypes.TEXT,
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
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'productos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
});

Producto.belongsTo(Sede, {
  foreignKey: 'sede_id',
  as: 'sede'
});

module.exports = Producto; 