const { Sequelize } = require('sequelize');

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
    console.log('✅ Conexión a MySQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  testConnection
};