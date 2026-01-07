const { sequelize } = require('../config/db');
const OrdenTrabajo = require('../models/OrdenTrabajo');
const OrdenTrabajoService = require('../services/OrdenTrabajoService');
const VerificationUtils = require('../utils/VerificationUtils');

const OrdenTrabajoController = {
    get: async (req, res) => {
        const ordenes = await OrdenTrabajo.findAll(
            {
                where: { sede: req.sede.id },
                order: [['created_at', 'DESC']]
            });
        const array_ordenes_id = [];

        for (let orden of ordenes) {
            array_ordenes_id.push(orden.id);
        }

        res.status(200).json({ message: 'ok', ordenes_trabajo: await OrdenTrabajoService.formatear_get_orden_trabajo(array_ordenes_id) });
    },

    change_status: async (req, res) => {
        const { orden_numero, estado } = req.body;

        const obj_orden_venta = await OrdenTrabajo.findOne({ where: { orden_key: orden_numero } });
        if (!obj_orden_venta) {
            throw { message: `Orden ${orden_numero} no encontrada` };
        }

        if (!OrdenTrabajoService.validar_estado_orden_trabajo(estado)) {
            throw { message: `Estado ${estado} no es válido` };
        }

        let progreso = 0;

        if(estado === 'en_tienda') progreso = 0;
        else if(estado === 'proceso_laboratorio') progreso = 30;
        else if(estado === 'listo_laboratorio') progreso = 70;
        else if(estado === 'pendiente_retiro') progreso = 100;
        else if(estado === 'entregado') progreso = 100;

        obj_orden_venta.progreso = progreso;
        obj_orden_venta.estado = estado;
        await obj_orden_venta.save();

        const orden_output = (await OrdenTrabajoService.formatear_get_orden_trabajo([obj_orden_venta.id]))[0];
        res.status(200).json({ message: 'ok', ordenes_trabajo: orden_output });
    },

    change_status_all: async (req, res) => {
        const { estado_actual, estado_nuevo } = req.body;

        if (!OrdenTrabajoService.validar_estado_orden_trabajo(estado_actual)) {
            throw { message: `Estado ${estado_actual} no es válido` };
        }

        if (!OrdenTrabajoService.validar_estado_orden_trabajo(estado_nuevo)) {
            throw { message: `Estado ${estado_nuevo} no es válido` };
        }

        const array_ordenes_id = [];

        const t = await sequelize.transaction();
        try {
            const array_ordenes = await OrdenTrabajo.findAll({ where: { estado: estado_actual } });
            for (let orden of array_ordenes) {
                orden.estado = estado_nuevo;
                await orden.save({ transaction: t });

                array_ordenes_id.push(orden.id);
            }
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        res.status(200).json({ message: 'ok', ordenes_trabajo: await OrdenTrabajoService.formatear_get_orden_trabajo(array_ordenes_id) });
    },

    update_fecha_entrega_estimada: async (req, res) => {
        const { orden_numero, fecha_entrega_estimada } = req.body;

        const obj_orden_venta = await OrdenTrabajo.findOne({ where: { orden_key: orden_numero } });
        if (!obj_orden_venta) {
            throw { message: `Orden ${orden_numero} no encontrada` };
        }

        if (!VerificationUtils.verify_fecha(fecha_entrega_estimada)) {
            throw { message: `Fecha de entrega estimada inválida: ${fecha_entrega_estimada}` };
        }

        obj_orden_venta.fecha_entrega_estimada = fecha_entrega_estimada;
        await obj_orden_venta.save();

        const orden_output = (await OrdenTrabajoService.formatear_get_orden_trabajo([obj_orden_venta.id]))[0];
        res.status(200).json({ message: 'ok', ordenes_trabajo: orden_output });
    },

    archive: async (req, res) => {
        const { orden_numero } = req.body;

        const obj_orden_venta = await OrdenTrabajo.findOne({ where: { orden_key: orden_numero } });
        if (!obj_orden_venta) {
            throw { message: `Orden ${orden_numero} no encontrada` };
        }

        obj_orden_venta.archivado = 1;
        await obj_orden_venta.save();

        const orden_output = (await OrdenTrabajoService.formatear_get_orden_trabajo([obj_orden_venta.id]))[0];
        res.status(200).json({ message: 'ok', ordenes_trabajo: orden_output });
    },

    unarchive: async (req, res) => {
        const { orden_numero } = req.body;

        const obj_orden_venta = await OrdenTrabajo.findOne({ where: { orden_key: orden_numero } });
        if (!obj_orden_venta) {
            throw { message: `Orden ${orden_numero} no encontrada` };
        }

        obj_orden_venta.archivado = 0;
        await obj_orden_venta.save();

        const orden_output = (await OrdenTrabajoService.formatear_get_orden_trabajo([obj_orden_venta.id]))[0];
        res.status(200).json({ message: 'ok', ordenes_trabajo: orden_output });
    },
};

module.exports = OrdenTrabajoController;