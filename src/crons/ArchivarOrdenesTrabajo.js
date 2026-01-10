const cron = require('node-cron');
const DateUtils = require('../utils/DateUtils');
const OrdenTrabajo = require('../models/OrdenTrabajo');
const Configuracion = require('../models/Configuracion');
const { sequelize } = require('../config/db');
const Sede = require('../models/Sede');
const Op = require('sequelize').Op;

module.exports = () => {
  cron.schedule('5 8,18 * * *', async () => {
    console.log('Archivar Ordenes');

    const sedes = await Sede.findAll();
    for (const sede of sedes) {
      const objConf = await Configuracion.findOne({ where: { clave: "dias_archivar_ordenes", sede: sede.id } });
      const dias_vencimiento = parseInt(objConf.valor);
      const fecha_vencimiento = DateUtils.subtractDays(new Date(), dias_vencimiento) + ' 23:59:59';
      console.log(`[INFO] Archivar Ordenes de ${sede.nombre} con fecha de vencimiento: ${fecha_vencimiento}`);
      const t = await sequelize.transaction();

      try {
        const array_ordenes = await OrdenTrabajo.findAll({ where: { sede: sede.id, estado: 'entregado', archivado: 0, fecha_entregado: { [Op.lte]: fecha_vencimiento } } });
        for (let orden of array_ordenes) {
          orden.archivado = 1;
          await orden.save({ transaction: t });
        }
        await t.commit();
      } catch (error) {
        await t.rollback();
        console.error('Archivar Ordenes: ' + error.message || error.toString());
      }
    }

    console.log('Archivar Ordenes: ' + 'ok');
  });
}