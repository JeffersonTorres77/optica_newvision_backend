const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Sede = require('./Sede');
const Empresa = require('./Empresa');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
  },
  pkey: {
    type: DataTypes.STRING(70),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
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
  sin_cedula: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 1,
    get() {
      return this.getDataValue('sin_cedula') === 1;
    },
    set(value) {
      this.setDataValue('sin_cedula', value ? 1 : 0);
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  ocupacion: {
    type: DataTypes.TEXT,
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  genero: {
    type: DataTypes.STRING(1),
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: false,
    collate: 'utf8mb4_general_ci'
  },
  redes_sociales: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('redes_sociales debe ser un arreglo.');
        }
      }
    },
    get() {
      const raw = this.getDataValue('redes_sociales');

      if (Array.isArray(raw)) {
        return raw
      };

      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }

      return [];
    },
    set(value) {
      if (!Array.isArray(value)) {
        throw new Error('redes_sociales debe ser un arreglo.');
      }
      this.setDataValue('redes_sociales', value);
    }
  },
  empresa_rif: {
    type: DataTypes.STRING(20),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  tiene_lentes: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  fotofobia: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  uso_dispositivo_electronico: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  traumatismo_ocular: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  traumatismo_ocular_descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  cirugia_ocular: {
    type: DataTypes.STRING(100),
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  cirugia_ocular_descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  alergias: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci'
  },
  antecedentes_personales: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get() {
      const raw = this.getDataValue('antecedentes_personales');
      if (raw == null || raw == "") {
        return [];
      } else {
        return raw.split('|');
      }
    },
    set(value) {
      if (value !== null && !Array.isArray(value)) {
        throw new Error('antecedentes_personales debe ser un arreglo.');
      }
      if (value == [] || value == null) {
        this.setDataValue('antecedentes_personales', "");
      } else {
        this.setDataValue('antecedentes_personales', value.join('|'));
      }
    }
  },
  antecedentes_familiares: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get() {
      const raw = this.getDataValue('antecedentes_familiares');
      if (raw == null || raw == "") {
        return [];
      } else {
        return raw.split('|');
      }
    },
    set(value) {
      if (value !== null && !Array.isArray(value)) {
        throw new Error('antecedentes_familiares debe ser un arreglo.');
      }
      if (value == [] || value == null) {
        this.setDataValue('antecedentes_familiares', "");
      } else {
        this.setDataValue('antecedentes_familiares', value.join('|'));
      }
    }
  },
  patologias: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get() {
      const raw = this.getDataValue('patologias');
      if (raw === null || raw === "") {
        return [];
      } else {
        return raw.split('|');
      }
    },
    set(value) {
      if (value !== null && !Array.isArray(value)) {
        throw new Error('patologias debe ser un arreglo.');
      }
      if (value == [] || value === null) {
        this.setDataValue('patologias', "");
      } else {
        this.setDataValue('patologias', value.join('|'));
      }
    }
  },
  patologia_ocular: {
    type: DataTypes.TEXT,
    allowNull: true,
    collate: 'utf8mb4_general_ci',
    get() {
      const raw = this.getDataValue('patologia_ocular');
      if (raw == null || raw == "") {
        return [];
      } else {
        return raw.split('|');
      }
    },
    set(value) {
      if (value !== null && !Array.isArray(value)) {
        throw new Error('patologia_ocular debe ser un arreglo.');
      }
      if (value == [] || value == null) {
        this.setDataValue('patologia_ocular', "");
      } else {
        this.setDataValue('patologia_ocular', value.join('|'));
      }
    }
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
  tableName: 'pacientes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

Paciente.belongsTo(Sede, {
  foreignKey: 'sede_id',
  as: 'sede'
});

Paciente.belongsTo(Empresa, {
  foreignKey: 'empresa_rif',
  targetKey: 'rif',
  as: 'empresa'
});

module.exports = Paciente;