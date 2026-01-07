const OrdenTrabajo = require('../models/OrdenTrabajo');
const { Op } = require('sequelize');
const FormatUtils = require('../utils/FormatUtils');
const Venta = require('../models/Venta');
const VentaProducto = require('../models/VentaProducto');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const HistorialMedico = require('../models/HistorialMedico');

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
                        { model: Usuario, as: 'asesor_user', attributes: ['id', 'cedula', 'nombre'] },
                        { model: Usuario, as: 'especialista_user', attributes: ['id', 'cedula', 'nombre'] },
                        { model: HistorialMedico, as: 'historia_medica' },
                    ]
                },
            ]
        });

        for (let orden of ordenes) {
            const historia_medica = orden.venta.historia_medica;
            const especialista_user = orden.venta.especialista_user;
            const asesor_user = orden.venta.asesor_user;

            array_output.push({
                id: orden.id,
                ordenId: orden.orden_key,
                ventaId: orden.venta_key,
                numero_venta: "V-" + String(orden.venta.numero_control).padStart(6, "0"),
                numero_recibo: "R-" + String(orden.venta.numero_control).padStart(6, "0"),
                sede: orden.sede,
                cliente: {
                    historia_medica: {
                        id: historia_medica.id,
                        numero: historia_medica.numero,
                        fecha: historia_medica.fecha,
                        otro_motivo_consulta: historia_medica.otro_motivo_consulta,
                        tipo_cristal_actual: historia_medica.tipo_cristal_actual,
                        ultima_graduacion: historia_medica.ultima_graduacion,
                        diagnostico: historia_medica.diagnostico,
                        tratamiento: historia_medica.tratamiento,
                        conformidad_nota: historia_medica.conformidad_nota,
                        motivo_consulta: historia_medica.motivo_consulta,
                        examen_ocular_lensometria: historia_medica.examen_ocular_lensometria,
                        examen_ocular_refraccion: historia_medica.examen_ocular_refraccion,
                        examen_ocular_refraccion_final: historia_medica.examen_ocular_refraccion_final,
                        examen_ocular_avsc_avae_otros: historia_medica.examen_ocular_avsc_avae_otros,
                        recomendaciones: historia_medica.recomendaciones
                    },
                    tipo: orden.venta.cliente_tipo,
                    informacion: {
                        tipoPersona: orden.venta.cliente_informacion_persona,
                        nombreCompleto: orden.venta.cliente_informacion_nombre,
                        cedula: orden.venta.cliente_informacion_cedula,
                        telefono: orden.venta.cliente_informacion_telefono,
                        email: orden.venta.cliente_informacion_email
                    }
                },
                especialista: {
                    id: (especialista_user) ? especialista_user.id : null,
                    cedula: orden.venta.especialista_cedula,
                    nombre: (especialista_user) ? especialista_user.nombre : null
                },
                asesor: {
                    id: orden.venta.asesor_id,
                    cedula: (asesor_user) ? asesor_user.cedula : null,
                    nombre: (asesor_user) ? asesor_user.nombre : null
                },
                productos: orden.venta.array_productos.map(producto => producto.datos_producto),
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