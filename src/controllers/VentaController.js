const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const VentaCashea = require('../models/VentaCashea');
const VentaCasheaCuota = require('../models/VentaCasheaCuota');
const VentaPago = require('../models/VentaPago');
const VentaProducto = require('../models/VentaProducto');
const VentaService = require('../services/VentaService');
const FormatUtils = require('../utils/FormatUtils');
const Venta = require('./../models/Venta');
const Cliente = require('../models/Cliente');
const Paciente = require('../models/Paciente');

const VentaController = {
    add: async (req, res) => {
        const {
            venta,
            totales,
            cliente,
            asesor,
            productos,
            metodosPago,
            formaPago,
            auditoria,
        } = req.body;

        const objTasa = await VentaService.get_tasa(venta.moneda);
        const objPaciente = await VentaService.get_paciente(req.sede.id, cliente.informacion.cedula);
        const objAsesor = await VentaService.get_usuario(asesor.id);
        const productos_array_db = await VentaService.add_producto_db(productos);

        VentaService.validate_forma_pago(venta.formaPago);
        const fecha = VentaService.formatear_fecha(venta.fecha);

        const objVenta = {
            venta_key: await VentaService.generate_venta_key(),
            numero_control: await VentaService.get_numero_control(req.sede.id),
            sede: req.sede.id,
            paciente_key: (objPaciente) ? objPaciente.pkey : null,
            cliente_tipo: cliente.tipo,
            cliente_informacion_persona: cliente.informacion.tipoPersona,
            cliente_informacion_nombre: cliente.informacion.nombreCompleto,
            cliente_informacion_cedula: cliente.informacion.cedula,
            cliente_informacion_telefono: cliente.informacion.telefono,
            cliente_informacion_email: cliente.informacion.email,
            moneda: objTasa.id,
            tasa_moneda: objTasa.valor,
            forma_pago: venta.formaPago,
            iva_porcentaje: FormatUtils.float(venta.impuesto),
            descuento: FormatUtils.float(totales.descuento),
            subtotal: FormatUtils.float(totales.subtotal),
            iva: FormatUtils.float(totales.iva),
            total: FormatUtils.float(totales.total),
            observaciones: venta.observaciones,
            fecha: fecha,
            pago_completo: null,
            created_by: req.user.cedula,
            asesor_id: objAsesor.id,
            estatus_venta: null,
            estatus_pago: null,
            productos: [],
            pagos: [],
            cashea: null,
            cashea_cuotas: null
        };

        objVenta.productos = await VentaService.prepare_productos_array(productos_array_db, objTasa);
        objVenta.pagos = await VentaService.prepare_metodos_de_pago_array(metodosPago, objTasa);

        if (objVenta.forma_pago === 'contado') {
            objVenta.pago_completo = true;
            objVenta.estatus_venta = 'completada';
            objVenta.estatus_pago = 'completada';
        }
        else if (objVenta.forma_pago === 'cashea') {
            objVenta.pago_completo = true;
            objVenta.estatus_venta = 'completada';
            objVenta.estatus_pago = 'pagado_por_cashea';
            objVenta.cashea = {
                nivel_cashea: formaPago.nivel,
                monto_inicial: formaPago.montoInicial,
                cantidad_cuotas: formaPago.cantidadCuotas,
                monto_por_cuota: formaPago.montoPorCuota,
                total_adelantado: formaPago.totalPagadoAhora
            };
            objVenta.cashea_cuotas = [];
            for (let cuota of formaPago.cuotas) {
                objVenta.cashea_cuotas.push({
                    numero: cuota.numero,
                    monto: cuota.monto,
                    fecha_vencimiento: cuota.fecha,
                    pagada: cuota.pagada,
                    seleccionada: cuota.seleccionada
                });
            }
        }
        else if (objVenta.forma_pago === 'abono') {
            objVenta.pago_completo = VentaService.VerificarPagoCompleto(objVenta.total, objVenta.pagos);
            objVenta.estatus_venta = (objVenta.pago_completo) ? 'completada' : 'pendiente';
            objVenta.estatus_pago = (objVenta.pago_completo) ? 'completada' : 'pendiente';
        }
        else {
            throw { message: `La forma de pago es invalida: ${venta.formaPago}` };
        }

        const t = await sequelize.transaction();

        try {
            await VentaService.guardar_venta(t, objVenta);
            await VentaService.guardar_cliente(t, cliente, objVenta.sede);
            await VentaService.descontar_inventario(t, objVenta.productos);
            await VentaService.actualizar_numero_control(t, objVenta.numero_control + 1, req.sede.id);
            await t.commit();
        }
        catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const ventaOutput = await Venta.findOne({
            where: { venta_key: objVenta.venta_key },
            include: [
                { model: VentaPago, as: 'array_pagos' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'precio'], attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
            ]
        });

        const ventaOutputFormateado = await VentaService.formatear_venta_output(ventaOutput);

        res.status(200).json({ message: 'ok', venta: ventaOutputFormateado });
    },

    get: async (req, res) => {
        const fecha_inicio = req.query.fechaDesde;
        const fecha_final = req.query.fechaHasta;
        const busqueda_general = req.query.busquedaGeneral
        const asesor_id = req.query.asesor
        const especialista_id = req.query.especialista
        const estatus_venta = req.query.estado
        const forma_pago = req.query.formaPago

        const where = {};
        where.sede = req.sede.id;

        if (fecha_inicio && fecha_final) {
            where.fecha = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_final)] };
        }

        if (busqueda_general) {
            const orConditions = [];

            // Buscar por cédula (coincidencia parcial)
            orConditions.push({ cliente_informacion_cedula: { [Op.like]: `%${busqueda_general}%` } });

            // Buscar por nombre (coincidencia parcial)
            orConditions.push({ cliente_informacion_nombre: { [Op.like]: `%${busqueda_general}%` } });

            // Buscar por número de control (si es número, coincidir exacto; si no, intentar like)
            if (/[VR]\-([0-9]{3,})/.test(busqueda_general)) {
                const numeroParsed = VentaService.extrear_numero_de_numero_control(busqueda_general);
                orConditions.push({ numero_control: numeroParsed });
            }

            // Si ya existe una condición Op.or, combinar, sino asignar
            if (where[Op.or]) {
                where[Op.or] = where[Op.or].concat(orConditions);
            } else {
                where[Op.or] = orConditions;
            }
        }

        if (asesor_id) {
            const ases = parseInt(asesor_id, 10);
            if (!isNaN(ases)) where.asesor_id = ases;
        }

        if (estatus_venta) where.estatus_venta = estatus_venta;
        if (forma_pago) where.forma_pago = forma_pago;

        const page = parseInt(req.query.pagina, 10) || 1;
        const limit = parseInt(req.query.itemsPorPagina, 10) || 10;
        const offset = (page - 1) * limit;

        const result = await Venta.findAndCountAll({
            where,
            include: [
                { model: VentaPago, as: 'array_pagos' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'precio'], attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
            ],
            order: [['fecha', 'DESC']],
            limit,
            offset
        });

        const total = await Venta.count();
        const pages = Math.max(1, Math.ceil(total / limit));

        const ventas_output = [];
        for (let venta of result.rows) {
            ventas_output.push(
                await VentaService.formatear_venta_output(venta)
            );
        }

        res.status(200).json({
            message: 'ok',
            ventas: ventas_output,
            pagination: {
                total: total,
                page,
                pages,
                per_page: limit
            }
        });
    },

    get_total: async (req, res) => {
        const ventas = await VentaService.BuscarTotalVenta();
        const completadas = await VentaService.BuscarTotalVenta('completada');
        const pendientes = await VentaService.BuscarTotalVenta('pendiente');
        const canceladas = await VentaService.BuscarTotalVenta('anulada');

        res.status(200).json({
            message: "ok",
            ventas,
            completadas,
            pendientes,
            canceladas
        });
    },

    anular: async (req, res) => {
        const venta_key = req.params.venta_key;

        const {
            motivo_cancelacion
        } = req.body;

        const objVenta = await Venta.findOne({
            where: { venta_key: venta_key },
            include: [{ model: VentaProducto, as: 'array_productos' }]
        });

        if (!objVenta) {
            throw { message: `La venta no existe: ${venta_id}.` };
        }
        if (objVenta.sede != req.sede.id) {
            throw { message: `No se puede anular ventas de otra sede.` };
        }
        if (objVenta.estatus_venta == 'anulada') {
            throw { message: `La venta ya esta anulada.` };
        }
        if (motivo_cancelacion.trim() === "") {
            throw { message: `El motivo de la cancelacion no puede estar vacia.` };
        }

        const t = await sequelize.transaction();

        try {
            objVenta.estatus_venta = 'anulada';
            objVenta.motivo_cancelacion = motivo_cancelacion;
            await objVenta.save({ transaction: t });
            await VentaService.anular_descontada_inventario(t, objVenta.array_productos);
            await t.commit();
        }
        catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const ventaOutput = await Venta.findOne({
            where: { venta_key: objVenta.venta_key },
            include: [
                { model: VentaPago, as: 'array_pagos' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'precio'], attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
            ]
        });

        const venta_output = await VentaService.formatear_venta_output(ventaOutput);

        res.status(200).json({ message: 'ok', venta: venta_output });
    },

    abonar: async (req, res) => {
        const venta_key = req.params.venta_key;

        const {
            tipo,
            monto,
            moneda,
            referencia,
            bancoCodigo,
            bancoNombre
        } = req.body;

        const objVenta = await Venta.findOne({
            where: { venta_key: venta_key },
            include: []
        });

        if (!objVenta) {
            throw { message: `La venta no existe: ${venta_key}.` };
        }
        if (objVenta.sede != req.sede.id) {
            throw { message: `No se puede modificar ventas de otra sede.` };
        }

        const objTasaPago = await VentaService.get_tasa(moneda);
        const objTasaVenta = await VentaService.get_tasa(objVenta.moneda);

        const monto_moneda_base = ((FormatUtils.float(monto) * objTasaPago.valor) / objTasaVenta.valor);

        const pagos = await VentaPago.findAll({ where: { venta_key: objVenta.venta_key } });
        let total_pagado = monto_moneda_base;
        for (const pago of pagos) {
            total_pagado += pago.monto_moneda_base;
        }
        total_pagado = FormatUtils.float(total_pagado);

        const t = await sequelize.transaction();
        try {
            // Registrar Venta
            await VentaPago.create({
                venta_key: objVenta.venta_key,
                tipo: tipo,
                monto: FormatUtils.float(monto),
                moneda_id: objTasaPago.id,
                tasa_moneda: objTasaPago.valor,
                monto_moneda_base: FormatUtils.float(monto_moneda_base),
                referencia: referencia,
                bancoCodigo: bancoCodigo,
                bancoNombre: bancoNombre,
                created_by: req.user.cedula
            }, { transaction: t });

            // Modificar venta
            console.error(total_pagado, objVenta.total, total_pagado >= objVenta.total);
            if (total_pagado >= objVenta.total) {
                objVenta.estatus_venta = 'completada';
                objVenta.estatus_pago = 'completada';
                objVenta.pago_completo = 1;
                await objVenta.save({ transaction: t });
            }

            await t.commit();
        }
        catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const ventaOutput = await Venta.findOne({
            where: { venta_key: objVenta.venta_key },
            include: [
                { model: VentaPago, as: 'array_pagos' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'precio'], attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
            ]
        });

        const venta_output = await VentaService.formatear_venta_output(ventaOutput);

        res.status(200).json({ message: 'ok', venta: venta_output });
    },
};

module.exports = VentaController;