const { Sequelize, DataTypes, QueryTypes } = require('sequelize');

const sequelize = new Sequelize({
  database: process.env.MYSQL_NAME,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  dialectOptions: {
    connectTimeout: 60000,
    decimalNumbers: true,
  },
  timezone: '-04:00',
  logging: console.log
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    await ensureEtiquetaProductosConfigTable();
    await ensurePacienteSedesTable();
    await ensurePacienteAliasesTable();
    await ensurePresupuestoOptionColumns();
    await ensureHistoriaMedicaSedeColumn();
    await consolidatePacientesByCedula();
    console.log('✅ Conexión a MySQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error);
    process.exit(1);
  }
}

async function ensureEtiquetaProductosConfigTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS etiquetas_productos_config (
        id INT(11) NOT NULL AUTO_INCREMENT,
        sede VARCHAR(50) NOT NULL,
        fields LONGTEXT NOT NULL,
        columns INT(11) NOT NULL DEFAULT 3,
        label_width_mm INT(11) NOT NULL DEFAULT 63,
        label_height_mm INT(11) NOT NULL DEFAULT 34,
        show_border TINYINT(1) NOT NULL DEFAULT 1,
        cantidad_masiva_default INT(11) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_etiquetas_productos_config_sede (sede)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  } catch (error) {
    console.error('❌ Error asegurando tabla etiquetas_productos_config:', error);
    throw error;
  }
}

async function ensurePacienteAliasesTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS paciente_aliases (
        id INT(11) NOT NULL AUTO_INCREMENT,
        alias_key VARCHAR(70) NOT NULL,
        paciente_key VARCHAR(70) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_paciente_aliases_alias (alias_key),
        KEY idx_paciente_aliases_paciente (paciente_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  } catch (error) {
    console.error('❌ Error asegurando tabla paciente_aliases:', error);
    throw error;
  }
}

async function ensurePacienteSedesTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS paciente_sedes (
        id INT(11) NOT NULL AUTO_INCREMENT,
        paciente_key VARCHAR(70) NOT NULL,
        sede_id VARCHAR(50) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_paciente_sedes_paciente_sede (paciente_key, sede_id),
        KEY idx_paciente_sedes_sede (sede_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    await sequelize.query(`
      INSERT IGNORE INTO paciente_sedes (paciente_key, sede_id, created_at, updated_at)
      SELECT pkey, sede_id, COALESCE(created_at, NOW()), COALESCE(updated_at, NOW())
      FROM pacientes
      WHERE deleted_at IS NULL
        AND pkey IS NOT NULL
        AND pkey <> ''
        AND sede_id IS NOT NULL
        AND sede_id <> ''
    `);
  } catch (error) {
    console.error('❌ Error asegurando tabla paciente_sedes:', error);
    throw error;
  }
}

async function ensurePresupuestoOptionColumns() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const tableDefinition = await queryInterface.describeTable('presupuestos');

    if (!tableDefinition.opciones_cotizadas) {
      await queryInterface.addColumn('presupuestos', 'opciones_cotizadas', {
        type: DataTypes.TEXT('long'),
        allowNull: true
      });
    }

    if (!tableDefinition.opcion_principal_id) {
      await queryInterface.addColumn('presupuestos', 'opcion_principal_id', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }

    if (!tableDefinition.historia_medica_id) {
      await queryInterface.addColumn('presupuestos', 'historia_medica_id', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }

    if (!tableDefinition.historia_numero) {
      await queryInterface.addColumn('presupuestos', 'historia_numero', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }

    if (!tableDefinition.paciente_key_origen) {
      await queryInterface.addColumn('presupuestos', 'paciente_key_origen', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }

    if (!tableDefinition.paciente_id_origen) {
      await queryInterface.addColumn('presupuestos', 'paciente_id_origen', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }
  } catch (error) {
    console.error('❌ Error asegurando columnas de opciones de presupuesto:', error);
    throw error;
  }
}

async function ensureHistoriaMedicaSedeColumn() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const tableDefinition = await queryInterface.describeTable('historiales_medicos');

    if (!tableDefinition.sede_id) {
      await queryInterface.addColumn('historiales_medicos', 'sede_id', {
        type: DataTypes.STRING(50),
        allowNull: true
      });
    }

    await sequelize.query(`
      UPDATE historiales_medicos hm
      INNER JOIN pacientes p ON p.pkey = hm.paciente_id
      SET hm.sede_id = p.sede_id
      WHERE hm.sede_id IS NULL OR hm.sede_id = ''
    `);
  } catch (error) {
    console.error('❌ Error asegurando columna sede_id en historiales_medicos:', error);
    throw error;
  }
}

async function consolidatePacientesByCedula() {
  try {
    const duplicados = await sequelize.query(`
      SELECT cedula
      FROM pacientes
      WHERE deleted_at IS NULL
        AND sin_cedula = 0
        AND cedula IS NOT NULL
        AND cedula <> ''
      GROUP BY cedula
      HAVING COUNT(*) > 1
    `, { type: QueryTypes.SELECT });

    for (const duplicado of duplicados) {
      const pacientes = await sequelize.query(`
        SELECT
          p.id,
          p.pkey,
          p.sede_id,
          p.cedula,
          p.nombre,
          p.telefono,
          p.email,
          p.created_at,
          (
            SELECT COUNT(*)
            FROM historiales_medicos hm
            WHERE hm.paciente_id = p.pkey
              AND hm.deleted_at IS NULL
          ) AS historias_count,
          (
            SELECT COUNT(*)
            FROM ventas v
            WHERE v.paciente_key = p.pkey
          ) AS ventas_count,
          (
            SELECT COUNT(*)
            FROM presupuestos pr
            WHERE pr.paciente_key_origen = p.pkey
          ) AS presupuestos_count
        FROM pacientes p
        WHERE p.deleted_at IS NULL
          AND p.cedula = :cedula
      `, {
        replacements: { cedula: duplicado.cedula },
        type: QueryTypes.SELECT
      });

      if (!pacientes.length || pacientes.length === 1) {
        continue;
      }

      const ordenados = pacientes
        .slice()
        .sort((a, b) => {
          const scoreA = Number(a.historias_count || 0) + Number(a.ventas_count || 0) + Number(a.presupuestos_count || 0);
          const scoreB = Number(b.historias_count || 0) + Number(b.ventas_count || 0) + Number(b.presupuestos_count || 0);

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }

          const fechaA = new Date(a.created_at || 0).getTime();
          const fechaB = new Date(b.created_at || 0).getTime();
          if (fechaA !== fechaB) {
            return fechaA - fechaB;
          }

          return Number(a.id || 0) - Number(b.id || 0);
        });

      const canonico = ordenados[0];
      const duplicadosCedula = ordenados.slice(1);

      for (const repetido of duplicadosCedula) {
        await sequelize.query(`
          UPDATE pacientes
          SET
            telefono = CASE
              WHEN (telefono IS NULL OR telefono = '') AND :telefono <> '' THEN :telefono
              ELSE telefono
            END,
            email = CASE
              WHEN (email IS NULL OR email = '') AND :email <> '' THEN :email
              ELSE email
            END,
            nombre = CASE
              WHEN (nombre IS NULL OR nombre = '') AND :nombre <> '' THEN :nombre
              ELSE nombre
            END,
            updated_at = NOW()
          WHERE id = :canonicoId
        `, {
          replacements: {
            canonicoId: canonico.id,
            telefono: String(repetido.telefono || '').trim(),
            email: String(repetido.email || '').trim(),
            nombre: String(repetido.nombre || '').trim()
          }
        });

        await sequelize.query(`
          INSERT IGNORE INTO paciente_sedes (paciente_key, sede_id, created_at, updated_at)
          VALUES (:pacienteKey, :sedeId, NOW(), NOW())
        `, {
          replacements: {
            pacienteKey: canonico.pkey,
            sedeId: repetido.sede_id
          }
        });

        await sequelize.query(`
          INSERT IGNORE INTO paciente_sedes (paciente_key, sede_id, created_at, updated_at)
          SELECT :pacienteKey, sede_id, created_at, updated_at
          FROM paciente_sedes
          WHERE paciente_key = :aliasKey
        `, {
          replacements: {
            pacienteKey: canonico.pkey,
            aliasKey: repetido.pkey
          }
        });

        await sequelize.query(`
          INSERT IGNORE INTO paciente_aliases (alias_key, paciente_key, created_at, updated_at)
          VALUES (:aliasKey, :pacienteKey, NOW(), NOW())
        `, {
          replacements: {
            aliasKey: repetido.pkey,
            pacienteKey: canonico.pkey
          }
        });

        await sequelize.query(`
          UPDATE historiales_medicos
          SET paciente_id = :pacienteKey, updated_at = NOW()
          WHERE paciente_id = :aliasKey
        `, {
          replacements: {
            pacienteKey: canonico.pkey,
            aliasKey: repetido.pkey
          }
        });

        await sequelize.query(`
          UPDATE ventas
          SET paciente_key = :pacienteKey, updated_at = NOW()
          WHERE paciente_key = :aliasKey
        `, {
          replacements: {
            pacienteKey: canonico.pkey,
            aliasKey: repetido.pkey
          }
        });

        await sequelize.query(`
          UPDATE presupuestos
          SET
            paciente_key_origen = CASE
              WHEN paciente_key_origen = :aliasKey THEN :pacienteKey
              ELSE paciente_key_origen
            END,
            paciente_id_origen = CASE
              WHEN paciente_id_origen = :aliasId OR paciente_key_origen = :aliasKey THEN :pacienteId
              ELSE paciente_id_origen
            END,
            updated_at = NOW()
          WHERE paciente_key_origen = :aliasKey
             OR paciente_id_origen = :aliasId
        `, {
          replacements: {
            aliasKey: repetido.pkey,
            aliasId: String(repetido.id),
            pacienteKey: canonico.pkey,
            pacienteId: String(canonico.id)
          }
        });

        await sequelize.query(`
          DELETE FROM paciente_sedes
          WHERE paciente_key = :aliasKey
        `, {
          replacements: {
            aliasKey: repetido.pkey
          }
        });

        await sequelize.query(`
          UPDATE pacientes
          SET deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW()
          WHERE id = :aliasId
        `, {
          replacements: {
            aliasId: repetido.id
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Error consolidando pacientes duplicados por cédula:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection
};