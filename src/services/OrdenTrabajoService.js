const OrdenTrabajo = require('../models/OrdenTrabajo');
const { Op } = require('sequelize');
const FormatUtils = require('../utils/FormatUtils');
const Venta = require('../models/Venta');
const VentaProducto = require('../models/VentaProducto');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const HistorialMedico = require('../models/HistorialMedico');
const VentaConsulta = require('../models/VentaConsulta');

const OrdenTrabajoService = {

    agregar_orden_trabajo: async (t, objVenta) => {
        const anio = new Date().getFullYear();
        let consecutivo = await OrdenTrabajo.max('consecutivo', { where: { sede: objVenta.sede, anio: anio } });
        consecutivo += 1;
        let orden_key = `OT-${objVenta.sede.toUpperCase()}-${anio}-${String(consecutivo).padStart(3, '0')}`;

        const obj_orden_trabajo = await OrdenTrabajo.create({
            orden_key: orden_key,
            sede: objVenta.sede,
            venta_key: objVenta.venta_key,
            estado: 'en_tienda',
            fecha_inicio_proceso: null,
            fecha_entrega_estimada: null,
            progreso: 0,
            observaciones: null,
            anio: anio,
            consecutivo: consecutivo,
            archivado: 0,
        }, { transaction: t });
    },

    formatear_get_orden_trabajo: async (array_ordenes_id) => {
        const array_output = [];
        const ordenes = await OrdenTrabajo.findAll({
            where: { id: array_ordenes_id },
            include: [
                {
                    model: Venta, as: 'venta',
                    include: [
                        {
                            model: VentaProducto, as: 'array_productos',
                            include: [
                                {
                                    model: Producto, as: 'datos_producto',
                                    attributes: ['id', 'nombre', 'precio', 'marca', 'codigo', 'modelo']
                                }
                            ]
                        },
                        {
                            model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'],
                            include: [{ association: 'cargo', attributes: ['id', 'nombre'], required: false }]
                        },
                        {
                            model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'],
                            include: [{ association: 'cargo', attributes: ['id', 'nombre'], required: false }]
                        },
                        { model: HistorialMedico, as: 'historia_medica' },
                        { model: VentaConsulta, as: 'venta_consulta', required: false },
                    ]
                },
            ]
        });

        for (let orden of ordenes) {
            if (!orden.venta) {
                throw { message: 'Existen ordenes sin venta asociada, contactar al administrador' };
            }

            const historia_medica = (orden.venta.historia_medica) ? orden.venta.historia_medica : null;
            const venta_consulta = (orden.venta.venta_consulta) ? orden.venta.venta_consulta : null;
            const especialista_user = (orden.venta.especialista_user) ? orden.venta.especialista_user : null;
            const asesor_user = (orden.venta.asesor_user) ? orden.venta.asesor_user : null;
            const especialista = OrdenTrabajoService.formatear_especialista_orden(historia_medica, especialista_user, venta_consulta);
            const formulaOriginal = OrdenTrabajoService.formatear_formula_original(historia_medica);
            const datosConsulta = OrdenTrabajoService.formatear_datos_consulta_historia(historia_medica, especialista, formulaOriginal, venta_consulta);

            array_output.push({
                id: orden.id,
                ordenId: orden.orden_key,
                ventaId: orden.venta_key,
                numero_venta: "V-" + String(orden.venta.numero_control).padStart(6, "0"),
                numero_recibo: "R-" + String(orden.venta.numero_control).padStart(6, "0"),
                sede: orden.sede,
                cliente: {
                    historia_medica: (historia_medica) ? {
                        id: historia_medica.id,
                        numero: historia_medica.numero,
                        fecha: historia_medica.fecha,
                        otro_motivo_consulta: historia_medica.otro_motivo_consulta,
                        tipo_cristal_actual: historia_medica.tipo_cristal_actual,
                        tipo_lentes_contacto: historia_medica.tipo_lentes_contacto,
                        ultima_graduacion: historia_medica.ultima_graduacion,
                        diagnostico: historia_medica.diagnostico,
                        tratamiento: historia_medica.tratamiento,
                        conformidad_nota: historia_medica.conformidad_nota,
                        motivo_consulta: historia_medica.motivo_consulta,
                        formula_externa: !!historia_medica.formula_externa,
                        especialista_tipo: historia_medica.especialista_tipo,
                        especialista_cedula: historia_medica.especialista_cedula,
                        especialista_externo_nombre: historia_medica.especialista_externo_nombre,
                        especialista_externo_lugar: historia_medica.especialista_externo_lugar,
                        formula_original_tipo: historia_medica.formula_original_tipo,
                        formula_original_nombre: historia_medica.formula_original_nombre,
                        formula_original_lugar: historia_medica.formula_original_lugar,
                        examen_ocular_lensometria: historia_medica.examen_ocular_lensometria,
                        examen_ocular_refraccion: historia_medica.examen_ocular_refraccion,
                        examen_ocular_refraccion_final: historia_medica.examen_ocular_refraccion_final,
                        examen_ocular_avsc_avae_otros: historia_medica.examen_ocular_avsc_avae_otros,
                        datosConsulta: datosConsulta
                    } : null,
                    tipo: orden.venta.cliente_tipo,
                    informacion: {
                        tipoPersona: orden.venta.cliente_informacion_persona,
                        nombreCompleto: orden.venta.cliente_informacion_nombre,
                        cedula: orden.venta.cliente_informacion_cedula,
                        telefono: orden.venta.cliente_informacion_telefono,
                        email: orden.venta.cliente_informacion_email
                    }
                },
                especialista: especialista,
                asesor: {
                    id: orden.venta.asesor_id,
                    cedula: (asesor_user) ? asesor_user.cedula : null,
                    nombre: (asesor_user) ? asesor_user.nombre : null,
                    cargo: (asesor_user && asesor_user.cargo) ? asesor_user.cargo.nombre : null
                },
                productos: orden.venta.array_productos.map(producto => {
                    const datosProducto = producto.datos_producto
                        ? producto.datos_producto.get({ plain: true })
                        : null;

                    return {
                        ...(datosProducto || {}),
                        cantidad: Number(producto.cantidad || 0)
                    };
                }),
                estado: orden.estado,
                fechaInicioProceso: orden.fecha_inicio_proceso,
                fechaCreacion: orden.created_at,
                fechaEntregaEstimada: orden.fecha_entrega_estimada,
                progreso: orden.progreso,
                observaciones: orden.observaciones,
                archivado: (orden.archivado === 1) ? true : false
            });
        }

        return array_output;
    },

    formatear_especialista_orden: (historia_medica, especialista_user, venta_consulta) => {
        const tipoHistoria = OrdenTrabajoService.normalizar_tipo_especialista(historia_medica?.especialista_tipo);
        const tipoConsulta = OrdenTrabajoService.normalizar_tipo_especialista(venta_consulta?.tipo_especialista);
        const tipo = tipoHistoria || tipoConsulta || null;
        const esExterno = tipo === 'EXTERNO';

        return {
            id: esExterno ? null : (especialista_user ? especialista_user.id : null),
            cedula: historia_medica?.especialista_cedula || especialista_user?.cedula || null,
            nombre: esExterno
                ? (historia_medica?.especialista_externo_nombre || null)
                : (especialista_user ? especialista_user.nombre : null),
            tipo: tipo,
            cargo: esExterno ? null : (especialista_user?.cargo ? especialista_user.cargo.nombre : null),
            externo: {
                nombre: historia_medica?.especialista_externo_nombre || null,
                lugarConsultorio: historia_medica?.especialista_externo_lugar || null,
            }
        };
    },

    formatear_formula_original: (historia_medica) => {
        if (!historia_medica) {
            return null;
        }

        if (!historia_medica.formula_original_tipo && !historia_medica.formula_original_nombre && !historia_medica.formula_original_lugar) {
            return null;
        }

        return {
            medicoOrigen: {
                tipo: historia_medica.formula_original_tipo || null,
                nombre: historia_medica.formula_original_nombre || null,
                lugarConsultorio: historia_medica.formula_original_lugar || null,
            }
        };
    },

    formatear_datos_consulta_historia: (historia_medica, especialista, formulaOriginal, venta_consulta) => {
        if (!historia_medica && !venta_consulta) {
            return null;
        }

        return {
            motivo: historia_medica?.motivo_consulta || [],
            otroMotivo: historia_medica?.otro_motivo_consulta || null,
            tipoCristalActual: historia_medica?.tipo_cristal_actual || null,
            tipoLentesContacto: historia_medica?.tipo_lentes_contacto || null,
            fechaUltimaGraduacion: historia_medica?.ultima_graduacion || null,
            formulaExterna: historia_medica ? !!historia_medica.formula_externa : !!venta_consulta?.es_formula_externa,
            pagoPendiente: historia_medica ? !!historia_medica.pago_pendiente : null,
            especialista: especialista,
            formulaOriginal: formulaOriginal,
        };
    },

    normalizar_tipo_especialista: (tipo) => {
        if (!tipo) {
            return null;
        }

        return String(tipo).trim().toUpperCase();
    },

    validar_estado_orden_trabajo: (estado) => {
        const validStatuses = [
            'en_tienda',
            'proceso_laboratorio',
            'listo_laboratorio',
            'pendiente_retiro',
            'entregado'
        ];
        return validStatuses.includes(estado);
    },

};

module.exports = OrdenTrabajoService;