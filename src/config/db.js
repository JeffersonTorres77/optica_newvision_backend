const { Sequelize, DataTypes } = require('sequelize');

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
    await ensurePresupuestoOptionColumns();
    console.log('✅ Conexión a MySQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error);
    process.exit(1);
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

module.exports = {
  sequelize,
  testConnection
};