const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const VentaCashea = require('../models/VentaCashea');
const VentaCasheaCuota = require('../models/VentaCasheaCuota');
const VentaPago = require('../models/VentaPago');
const VentaProducto = require('../models/VentaProducto');
const VentaService = require('../services/VentaService');
const OrdenTrabajoService = require('../services/OrdenTrabajoService');
const FormatUtils = require('../utils/FormatUtils');
const Venta = require('./../models/Venta');
const Cliente = require('../models/Cliente');
const Paciente = require('../models/Paciente');
const VentaPagoAgrupado = require('../models/VentaPagoAgrupado');
const HistorialMedico = require('../models/HistorialMedico');
const Tasa = require('../models/Tasa');
const VentaConsulta = require('../models/VentaConsulta');
const ConfiguracionService = require('../services/ConfiguracionService');
const OrdenTrabajo = require('../models/OrdenTrabajo');

const VentaController = {
    add: async (req, res) => {
        const {
            moneda,
            impuesto,
            descuento,
            total,
            cliente,
            asesor,
            productos,
            metodosDePago,
            formaPagoDetalle,
            ordenTrabajo,
            tipoVenta,
            consulta,
            especialista
        } = req.body;

        const formaPago = (formaPagoDetalle) ? formaPagoDetalle.tipo : null;

        const tiposValidos = ['solo_productos', 'solo_consulta', 'consulta_productos'];
        if (!tiposValidos.includes(tipoVenta)) {
            throw { message: `El tipo de venta '${tipoVenta}' es invalido. Los valores permitidos son: ${tiposValidos.join(', ')}` };
        }

        const tiposClienteValidos = ['cliente_general', 'cliente_paciente'];
        if (cliente) {
            if (cliente.tipoCliente) cliente.tipoCliente = cliente.tipoCliente.toLowerCase();
            if (cliente.tipoPersona) cliente.tipoPersona = cliente.tipoPersona.toLowerCase();

            if (!tiposClienteValidos.includes(cliente.tipoCliente)) {
                throw { message: `El tipo de cliente '${cliente.tipoCliente}' es invalido. Los valores permitidos son: ${tiposClienteValidos.join(', ')}` };
            }
        }

        const objTasa = await VentaService.get_tasa(moneda);
        const objPaciente = await VentaService.get_paciente(req.sede.id, cliente.cedula);
        const objAsesor = (asesor && asesor.id) ? await VentaService.get_usuario_by_id(asesor.id) : false;
        const especialistaCedula = (especialista && especialista.cedula) ? especialista.cedula : false;
        const objEspecialista = (especialistaCedula) ? await VentaService.get_usuario_by_cedula(especialistaCedula) : false;
        let productos_array_db = [];
        if (tipoVenta === 'solo_productos' || tipoVenta === 'consulta_productos') {
            productos_array_db = await VentaService.add_producto_db(productos || []);
        }

        if (tipoVenta === 'solo_consulta' || tipoVenta === 'consulta_productos') {
            const historiaId = (consulta) ? consulta.historiaId : null;
            if (!historiaId) {
                throw { message: "El ID de la historia médica es obligatorio para este tipo de venta." };
            }
        }
        const array_tasas = await VentaService.get_tasas_actuales();
        const objEmpresa = await VentaService.get_empresa(cliente);

        VentaService.validate_forma_pago(formaPago);
        const fecha = new Date();

        const objVenta = {
            venta_key: await VentaService.generate_venta_key(),
            numero_control: await VentaService.get_numero_control(req.sede.id),
            sede: req.sede.id,
            tipo_venta: tipoVenta,
            paciente_key: (objPaciente) ? objPaciente.pkey : null,
            cliente_tipo: (cliente) ? cliente.tipoCliente : null,
            cliente_informacion_persona: (cliente) ? cliente.tipoPersona : null,
            cliente_informacion_nombre: (cliente) ? cliente.nombre : null,
            cliente_informacion_cedula: (cliente) ? cliente.cedula : null,
            cliente_informacion_telefono: (cliente) ? cliente.telefono : null,
            cliente_informacion_email: (cliente) ? cliente.email : null,
            empresa_rif: (objEmpresa) ? objEmpresa.rif : null,
            empresa_nombre: (objEmpresa) ? objEmpresa.nombre : null,
            empresa_telefono: (objEmpresa) ? objEmpresa.telefono : null,
            empresa_correo: (objEmpresa) ? objEmpresa.correo : null,
            empresa_direccion: (objEmpresa) ? objEmpresa.direccion : null,
            moneda: objTasa.id,
            tasas_actuales: array_tasas,
            forma_pago: formaPago,
            iva_porcentaje: FormatUtils.float(impuesto),
            descuento: FormatUtils.float(descuento),
            subtotal: 0,  // Removed from input, set to 0
            iva: 0,  // Removed from input, set to 0
            total: FormatUtils.float(total),
            observaciones: null,
            fecha: fecha,
            pago_completo: null,
            created_by: req.user.cedula,
            asesor_id: (objAsesor) ? objAsesor.id : null,
            especialista_cedula: (objEspecialista) ? objEspecialista.cedula : null,
            estatus_venta: null,
            estatus_pago: null,
            productos: [],
            pagos: [],
            cashea: null,
            cashea_cuotas: null,
            consulta: consulta || null,
            forma_pago: formaPago
        };

        objVenta.productos = await VentaService.prepare_productos_array(productos_array_db, objTasa);
        objVenta.pagos = await VentaService.prepare_metodos_de_pago_array(metodosDePago, objTasa);

        if (objVenta.forma_pago === 'contado') {
            objVenta.pago_completo = true;
            objVenta.estatus_venta = 'completada';
            objVenta.estatus_pago = 'completada';
        }
        else if (objVenta.forma_pago === 'de_contado-pendiente') {
            objVenta.pago_completo = false;
            objVenta.estatus_venta = 'completada';
            objVenta.estatus_pago = 'pendiente';
        }
        else if (objVenta.forma_pago === 'cashea') {
            objVenta.pago_completo = true;
            objVenta.estatus_venta = 'completada';
            objVenta.estatus_pago = 'pagado_por_cashea';
            objVenta.cashea = {
                nivel_cashea: formaPagoDetalle.nivel,
                monto_inicial: formaPagoDetalle.montoInicial,
                cantidad_cuotas: formaPagoDetalle.cantidadCuotas,
                monto_por_cuota: formaPagoDetalle.montoPorCuota,
                total_adelantado: formaPagoDetalle.totalPagadoAhora
            };
            objVenta.cashea_cuotas = [];
            for (let cuota of (formaPagoDetalle.cuotas || [])) {
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
            throw { message: `La forma de pago es invalida: ${formaPago}` };
        }

        const t = await sequelize.transaction();

        try {
            await VentaService.guardar_venta(t, objVenta);
            await VentaService.guardar_cliente(t, cliente, objVenta.sede);
            await VentaService.descontar_inventario(t, objVenta.productos);
            await VentaService.actualizar_numero_control(t, objVenta.numero_control + 1, req.sede.id);

            if (tipoVenta === 'solo_consulta' || tipoVenta === 'consulta_productos') {
                const historiaId = (consulta) ? consulta.historiaId : null;
                await VentaService.validar_historia_medica(historiaId, t, objVenta.venta_key, objVenta.pago_completo);
                await VentaService.sincronizar_costos_consulta(t, FormatUtils.float(consulta.pagoMedico), FormatUtils.float(consulta.pagoOptica), req.sede.id);
            }

            if (ordenTrabajo) {
                await OrdenTrabajoService.agregar_orden_trabajo(t, objVenta);
            }

            await t.commit();
        }
        catch (error) {
            console.error("ERROR IN VentaController.add:", error);
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const ventaOutput = await Venta.findOne({
            where: { venta_key: objVenta.venta_key },
            include: [
                { model: VentaPago, as: 'array_pagos' },
                { model: VentaPagoAgrupado, as: 'array_pagos_agrupados' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo', 'precio']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: VentaConsulta, as: 'venta_consulta' }
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
                { model: VentaPagoAgrupado, as: 'array_pagos_agrupados' },
                { model: VentaConsulta, as: 'venta_consulta' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto',
                            attributes: ['id', 'nombre', 'marca', 'color', 'codigo', 'material', 'categoria', 'modelo', 'precio']
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'] },
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
        const moneda_base = await ConfiguracionService.get_moneda_base(req.sede.id);
        const tipoVenta = req.query.tipoVenta;

        const ventas = { count: 0, amount: 0 };
        const completadas = { count: 0, amount: 0 };
        const pendientes = { count: 0, amount: 0 };
        const canceladas = { count: 0, amount: 0 };

        const where = { sede: req.sede.id };
        if (tipoVenta) {
            where.tipo_venta = tipoVenta;
        }

        const array_ventas = await Venta.findAll({ where });
        for (const venta of array_ventas) {
            const tasas_actuales = venta.tasas_actuales;
            tasas_actuales.push({ id: 'bolivar', valor: 1 });
            let moneda_venta_origen = venta.moneda;
            let moneda_venta_destino = moneda_base.valor;
            let tasa_venta_origen = null;
            let tasa_venta_destino = null;
            for (const tasa of tasas_actuales) {
                if (tasa.id === moneda_venta_origen) {
                    tasa_venta_origen = tasa.valor;
                }
                if (tasa.id === moneda_venta_destino) {
                    tasa_venta_destino = tasa.valor;
                }
                if (tasa_venta_origen !== null && tasa_venta_destino !== null) {
                    break;
                }
            }

            if (tasa_venta_origen === null || tasa_venta_destino === null) {
                throw { message: `No se encontro la tasa de la moneda de la venta: ${venta.id}` };
            }

            const total_venta_tasa_base = ((venta.total * tasa_venta_origen) / tasa_venta_destino);

            if (venta.estatus_venta === 'completada') {
                completadas.count++;
                completadas.amount += total_venta_tasa_base;
            } else if (venta.estatus_venta === 'pendiente') {
                pendientes.count++;
                pendientes.amount += total_venta_tasa_base;
            } else if (venta.estatus_venta === 'anulada') {
                canceladas.count++;
                canceladas.amount += total_venta_tasa_base;
            }

            ventas.count++;
            ventas.amount += total_venta_tasa_base;
        }

        res.status(200).json({
            message: "ok",
            ventas: ventas.count,
            completadas: completadas.count,
            pendientes: pendientes.count,
            canceladas: canceladas.count,
            montoTotalGeneral: ventas.amount,
            montoCompletadas: completadas.amount,
            montoPendientes: pendientes.amount,
            montoCanceladas: canceladas.amount,
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
                { model: VentaPagoAgrupado, as: 'array_pagos_agrupados' },
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
                { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: HistorialMedico, as: 'historia_medica' },
            ]
        });

        const venta_output = await VentaService.formatear_venta_output(ventaOutput);

        res.status(200).json({ message: 'ok', venta: venta_output });
    },

    abonar: async (req, res) => {
        const venta_key = req.params.venta_key;

        const {
            montoAbonado,
            metodosDePago,
            observaciones
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

        const objTasaVenta = await VentaService.get_tasa(objVenta.moneda);
        const pagos_preparados = await VentaService.prepare_metodos_de_pago_array(metodosDePago, objTasaVenta);
        const array_tasas = await VentaService.get_tasas_actuales();

        const t = await sequelize.transaction();
        try {
            const maxNumero = await VentaPagoAgrupado.max('numero_pago', { where: { venta_key: objVenta.venta_key }, transaction: t });
            const numero_pago_temp = (maxNumero || 0) + 1;
            const numero_pago = (numero_pago_temp < 2) ? 2 : numero_pago_temp;

            await VentaPagoAgrupado.create({
                venta_key: objVenta.venta_key,
                numero_pago: numero_pago,
                monto_abonado: montoAbonado,
                observaciones: observaciones,
                tasas_actuales: array_tasas,
                created_by: req.user.cedula
            }, { transaction: t });

            for (let pago of pagos_preparados) {
                await VentaPago.create({
                    venta_key: objVenta.venta_key,
                    numero_pago: numero_pago,
                    tipo: pago.tipo,
                    monto: pago.monto,
                    moneda_id: pago.moneda_id,
                    monto_moneda_base: pago.monto_moneda_base,
                    referencia: pago.referencia,
                    bancoCodigo: pago.bancoCodigo,
                    bancoNombre: pago.bancoNombre,
                    created_by: req.user.cedula
                }, { transaction: t });
            }

            const total_pagado = await VentaPago.sum('monto_moneda_base', { where: { venta_key: objVenta.venta_key }, transaction: t });

            if (total_pagado >= objVenta.total) {
                objVenta.estatus_venta = 'completada';
                objVenta.estatus_pago = 'completada';
                objVenta.pago_completo = true;
                await objVenta.save({ transaction: t });

                // Sincronizar pago_pendiente en la historia médica si existe
                const objVentaConsulta = await VentaConsulta.findOne({ where: { venta_key: objVenta.venta_key }, transaction: t });
                if (objVentaConsulta) {
                    const objHistorial = await HistorialMedico.findOne({ where: { id: objVentaConsulta.historia_id }, transaction: t });
                    if (objHistorial) {
                        objHistorial.pago_pendiente = false;
                        await objHistorial.save({ transaction: t });
                    }
                }
            }

            await t.commit();
        }
        catch (error) {
            console.error("ERROR IN VentaController.abonar:", error);
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const ventaOutput = await Venta.findOne({
            where: { venta_key: objVenta.venta_key },
            include: [
                { model: VentaPago, as: 'array_pagos' },
                { model: VentaPagoAgrupado, as: 'array_pagos_agrupados' },
                {
                    model: VentaProducto,
                    as: 'array_productos',
                    include: [
                        {
                            model: Producto,
                            as: 'datos_producto'
                        }
                    ]
                },
                { model: VentaCashea, as: 'datos_cashea' },
                { model: VentaCasheaCuota, as: 'cuotas_cashea' },
                { model: Usuario, as: 'creater_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'] },
                { model: VentaConsulta, as: 'venta_consulta' },
                { model: OrdenTrabajo, as: 'datos_orden_trabajo' }
            ]
        });

        const venta_output = await VentaService.formatear_venta_output(ventaOutput);

        res.status(200).json({ message: 'ok', venta: venta_output });
    },
};

module.exports = VentaController;