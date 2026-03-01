const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Paciente = require('./Paciente');
const Usuario = require('./Usuario');

const HistorialMedico = sequelize.define('HistorialMedico', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.STRING(70),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  paciente_id: {
    type: DataTypes.STRING(70),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  // ========================================
  motivo_consulta: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get: getArray('motivo_consulta'),
    set: setArray('motivo_consulta'),
  },
  otro_motivo_consulta: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  tipo_cristal_actual: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  ultima_graduacion: {
    type: DataTypes.DATE,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  medico: {
    type: DataTypes.STRING(255),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  formula_externa: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('formula_externa') === 1;
    },
    set(value) {
      this.setDataValue('formula_externa', value ? 1 : 0);
    }
  },
  pago_pendiente: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('pago_pendiente') === 1;
    },
    set(value) {
      this.setDataValue('pago_pendiente', value ? 1 : 0);
    }
  },
  // ========================================
  examen_ocular_lensometria: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    collate: 'utf8mb4_general_ci',
    get: getJson('examen_ocular_lensometria'),
    set: setJson('examen_ocular_lensometria'),
  },
  examen_ocular_refraccion: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    collate: 'utf8mb4_general_ci',
    get: getJson('examen_ocular_refraccion'),
    set: setJson('examen_ocular_refraccion'),
  },
  examen_ocular_refraccion_final: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    collate: 'utf8mb4_general_ci',
    get: getJson('examen_ocular_refraccion_final'),
    set: setJson('examen_ocular_refraccion_final'),
  },
  examen_ocular_avsc_avae_otros: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    collate: 'utf8mb4_general_ci',
    get: getJson('examen_ocular_avsc_avae_otros'),
    set: setJson('examen_ocular_avsc_avae_otros'),
  },
  // ========================================
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  tratamiento: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  // ========================================
  recomendaciones: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    collate: 'utf8mb4_general_ci',
    get: getJson('recomendaciones'),
    set: setJson('recomendaciones'),
  },
  // ========================================
  conformidad_nota: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  // ========================================
  created_by: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  updated_by: {
    type: DataTypes.STRING(20),
    allowNull: false,
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
  },
}, {
  tableName: 'historiales_medicos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

HistorialMedico.belongsTo(Paciente, {
  foreignKey: 'paciente_id',
  targetKey: 'pkey',
  as: 'paciente'
});

HistorialMedico.belongsTo(Usuario, {
  foreignKey: 'medico',
  targetKey: 'cedula',
  as: 'usuario_medico'
});

function getArray(fieldName) {
  return function () {
    const raw = this.getDataValue(fieldName);
    if (raw == null || raw == "") {
      return [];
    } else {
      return raw.split('|');
    }
  }
}

function setArray(fieldName) {
  return function (value) {
    if (value !== null && !Array.isArray(value)) {
      throw new Error(`${fieldName} debe ser un arreglo.`);
    }
    if (value == [] || value == null) {
      this.setDataValue(fieldName, "");
    } else {
      this.setDataValue(fieldName, value.join('|'));
    }
  }
}

function getJson(fieldName) {
  return function () {
    const raw = this.getDataValue(fieldName);

    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

function setJson(fieldName) {
  return function (value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value) === false && Object.prototype.toString.call(value) !== '[object Object]') {
      throw new Error(`El campo '${fieldName}' debe ser un array o un objeto válido.`);
    }

    this.setDataValue(fieldName, JSON.stringify(value));
  }
}

module.exports = HistorialMedico;
