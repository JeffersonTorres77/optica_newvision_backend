const HistorialMedico = require('../models/HistorialMedico');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const { Op } = require('sequelize');
const Venta = require('../models/Venta');
const VentaConsulta = require('../models/VentaConsulta');
const VerificationUtils = require('../utils/VerificationUtils');

function ordenarVentasPorRecencia(actual, siguiente) {
    const actualTiempo = new Date(actual.fecha || actual.created_at || 0).getTime();
    const siguienteTiempo = new Date(siguiente.fecha || siguiente.created_at || 0).getTime();

    if (siguienteTiempo !== actualTiempo) {
        return siguienteTiempo - actualTiempo;
    }

    return Number(siguiente.id || 0) - Number(actual.id || 0);
}

function formatearNumeroVenta(numeroControl) {
    const numero = Number(numeroControl || 0);

    if (!Number.isFinite(numero) || numero <= 0) {
        return null;
    }

    return `V-${String(numero).padStart(6, '0')}`;
}

async function obtenerTrazabilidadVentaHistorial(historiaId) {
    const ventasConsulta = await VentaConsulta.findAll({ where: { historia_id: historiaId } });

    if (ventasConsulta.length === 0) {
        return {
            ventaActiva: null,
            ventasRelacionadas: []
        };
    }

    const ventaKeys = Array.from(new Set(
        ventasConsulta
            .map((ventaConsulta) => `${ventaConsulta.venta_key || ''}`.trim())
            .filter(Boolean)
    ));

    const ventas = ventaKeys.length > 0
        ? await Venta.findAll({ where: { venta_key: { [Op.in]: ventaKeys } } })
        : [];

    const ventasRelacionadas = ventas
        .sort(ordenarVentasPorRecencia)
        .map((venta) => ({
            ventaKey: venta.venta_key,
            numeroControl: venta.numero_control,
            numeroVenta: formatearNumeroVenta(venta.numero_control),
            numero_venta: formatearNumeroVenta(venta.numero_control),
            estadoVenta: venta.estatus_venta,
            estadoPago: venta.estatus_pago,
            pagoCompleto: !!venta.pago_completo,
            fecha: venta.fecha,
            anulada: venta.estatus_venta === 'anulada'
        }));

    return {
        ventaActiva: ventasRelacionadas.find((venta) => !venta.anulada) || null,
        ventasRelacionadas
    };
}

const HistorialMedicoController = {
    add: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const {
            pacienteId,
            datosConsulta,
            examenOcular,
            diagnosticoTratamiento,
            recomendaciones,
            conformidad,
        } = req.body;

        const especialista = (datosConsulta && datosConsulta.especialista) ? datosConsulta.especialista : {};
        const especialistaExterno = (especialista && especialista.externo) ? especialista.externo : {};
        const formulaOriginal = (datosConsulta && datosConsulta.formulaOriginal) ? datosConsulta.formulaOriginal : {};
        const formulaOriginalMedicoOrigen = (formulaOriginal && formulaOriginal.medicoOrigen) ? formulaOriginal.medicoOrigen : {};

        const objPaciente = await Paciente.findOne({ where: { pkey: pacienteId } });
        if (!objPaciente) {
            throw { message: `El paciente no existe.` };
        }

        const now = new Date();
        const fecha = now.toISOString().slice(0, 10);
        const fecha_especial = fecha.replaceAll("-", "");
        const count_registros_hoy = await HistorialMedico.count({
            where: { fecha: fecha }
        });
        const count_especial = (count_registros_hoy + 1).toString().padStart(3, '0');

        const objHistorial = await HistorialMedico.create({
            // ========================================
            numero: `H-${fecha_especial}-${count_especial}`,
            fecha: fecha,
            paciente_id: objPaciente.pkey,
            // ========================================
            motivo_consulta: datosConsulta.motivo,
            otro_motivo_consulta: datosConsulta.otroMotivo,
            tipo_cristal_actual: datosConsulta.tipoCristalActual,
            tipo_lentes_contacto: datosConsulta.tipoLentesContacto,
            ultima_graduacion: datosConsulta.fechaUltimaGraduacion,
            especialista_tipo: especialista.tipo || null,
            especialista_cedula: especialista.cedula || null,
            especialista_externo_nombre: especialistaExterno.nombre || null,
            especialista_externo_lugar: especialistaExterno.lugarConsultorio || null,
            formula_original_tipo: formulaOriginalMedicoOrigen.tipo || null,
            formula_original_nombre: formulaOriginalMedicoOrigen.nombre || null,
            formula_original_lugar: formulaOriginalMedicoOrigen.lugarConsultorio || null,
            formula_externa: datosConsulta.formulaExterna,
            // ========================================
            examen_ocular_lensometria: examenOcular.lensometria,
            examen_ocular_refraccion: examenOcular.refraccion,
            examen_ocular_refraccion_final: examenOcular.refraccionFinal,
            examen_ocular_avsc_avae_otros: examenOcular.avsc_avae_otros,
            // ========================================
            diagnostico: diagnosticoTratamiento.diagnostico,
            tratamiento: diagnosticoTratamiento.tratamiento,
            // ========================================
            recomendaciones: recomendaciones,
            // ========================================
            conformidad_nota: conformidad.notaConformidad,
            // ========================================
            created_by: req.user.cedula,
            updated_by: req.user.cedula,
            // ========================================
        });

        const historial = objHistorial.get({ plain: true });

        const user_creador = await Usuario.findOne({
            where: { cedula: historial.created_by },
            attributes: ['cedula', 'nombre', 'cargo_id'],
            include: ['cargo']
        });
        const user_modificador = await Usuario.findOne({
            where: { cedula: historial.updated_by },
            attributes: ['cedula', 'nombre', 'cargo_id'],
            include: ['cargo']
        });
        const user_especialista = (historial.especialista_cedula)
            ? await Usuario.findOne({
                where: { cedula: historial.especialista_cedula },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            })
            : null;

        let user_creador_plain = null;
        if (user_creador) {
            user_creador_plain = { cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre };
        }

        let user_modificador_plain = null;
        if (user_modificador) {
            user_modificador_plain = { cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre };
        }

        const historial_output = {
            id: historial.id,
            nHistoria: historial.numero,
            pacienteId: historial.paciente_id,
            ventaKey: historial.venta_key,
            trazabilidadVenta: await obtenerTrazabilidadVentaHistorial(historial.id),

            datosConsulta: {
                pagoPendiente: historial.pago_pendiente,
                motivo: historial.motivo_consulta,
                otroMotivo: historial.otro_motivo_consulta,
                tipoCristalActual: historial.tipo_cristal_actual,
                tipoLentesContacto: historial.tipo_lentes_contacto,
                fechaUltimaGraduacion: historial.ultima_graduacion,
                especialista: {
                    tipo: historial.especialista_tipo,
                    cedula: historial.especialista_cedula,
                    nombre: user_especialista ? user_especialista.nombre : null,
                    cargo: (user_especialista && user_especialista.cargo) ? user_especialista.cargo.nombre : null,
                    externo: {
                        nombre: historial.especialista_externo_nombre,
                        lugarConsultorio: historial.especialista_externo_lugar,
                    }
                },
                formulaOriginal: {
                    medicoOrigen: {
                        tipo: historial.formula_original_tipo,
                        nombre: historial.formula_original_nombre,
                        lugarConsultorio: historial.formula_original_lugar,
                    }
                },
                formulaExterna: historial.formula_externa,
            },

            examenOcular: {
                lensometria: historial.examen_ocular_lensometria,
                refraccion: historial.examen_ocular_refraccion,
                refraccionFinal: historial.examen_ocular_refraccion_final,
                avsc_avae_otros: historial.examen_ocular_avsc_avae_otros,
            },

            diagnosticoTratamiento: {
                diagnostico: historial.diagnostico,
                tratamiento: historial.tratamiento,
            },

            recomendaciones: historial.recomendaciones,

            conformidad: {
                notaConformidad: historial.conformidad_nota,
            },

            auditoria: {
                fechaCreacion: historial.created_at,
                fechaActualizacion: historial.updated_at,
                creadoPor: user_creador_plain,
                actualizadoPor: user_modificador_plain,
            }
        };

        res.status(200).json({ message: 'ok', historial_medico: historial_output });
    },

    update: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const historial_numero = req.params.id;
        const objHistorial = await HistorialMedico.findOne({ where: { numero: historial_numero } });
        if (!objHistorial) {
            throw { message: `Historial medico '${historial_numero}' no existe.` };
        }

        const objPaciente = await Paciente.findOne({ where: { pkey: objHistorial.paciente_id } });
        if (!objPaciente) {
            throw { message: `El paciente del historial medico '${historial_numero}' no existe.` };
        }

        if (objPaciente.sede_id != req.sede.id) {
            throw { message: "No se puede modificar historial medicos de pacientes de otras sedes." };
        }

        const {
            datosConsulta,
            examenOcular,
            diagnosticoTratamiento,
            recomendaciones,
            conformidad,
        } = req.body;

        const especialista = (datosConsulta && datosConsulta.especialista) ? datosConsulta.especialista : {};
        const especialistaExterno = (especialista && especialista.externo) ? especialista.externo : {};
        const formulaOriginal = (datosConsulta && datosConsulta.formulaOriginal) ? datosConsulta.formulaOriginal : {};
        const formulaOriginalMedicoOrigen = (formulaOriginal && formulaOriginal.medicoOrigen) ? formulaOriginal.medicoOrigen : {};

        // ========================================
        objHistorial.motivo_consulta = datosConsulta.motivo;
        objHistorial.otro_motivo_consulta = datosConsulta.otroMotivo;
        objHistorial.tipo_cristal_actual = datosConsulta.tipoCristalActual;
        objHistorial.tipo_lentes_contacto = datosConsulta.tipoLentesContacto;
        objHistorial.ultima_graduacion = datosConsulta.fechaUltimaGraduacion;
        objHistorial.especialista_tipo = especialista.tipo || null;
        objHistorial.especialista_cedula = especialista.cedula || null;
        objHistorial.especialista_externo_nombre = especialistaExterno.nombre || null;
        objHistorial.especialista_externo_lugar = especialistaExterno.lugarConsultorio || null;
        objHistorial.formula_original_tipo = formulaOriginalMedicoOrigen.tipo || null;
        objHistorial.formula_original_nombre = formulaOriginalMedicoOrigen.nombre || null;
        objHistorial.formula_original_lugar = formulaOriginalMedicoOrigen.lugarConsultorio || null;
        objHistorial.formula_externa = datosConsulta.formulaExterna;
        // ========================================
        objHistorial.examen_ocular_lensometria = examenOcular.lensometria;
        objHistorial.examen_ocular_refraccion = examenOcular.refraccion;
        objHistorial.examen_ocular_refraccion_final = examenOcular.refraccionFinal;
        objHistorial.examen_ocular_avsc_avae_otros = examenOcular.avsc_avae_otros;
        // ========================================
        objHistorial.diagnostico = diagnosticoTratamiento.diagnostico;
        objHistorial.tratamiento = diagnosticoTratamiento.tratamiento;
        // ========================================
        objHistorial.recomendaciones = recomendaciones;
        // ========================================
        objHistorial.conformidad_nota = conformidad.notaConformidad;
        // ========================================
        objHistorial.updated_by = req.user.cedula;
        // ========================================
        objHistorial.save();

        const historial = objHistorial.get({ plain: true });

        const user_creador = await Usuario.findOne({
            where: { cedula: historial.created_by },
            attributes: ['cedula', 'nombre', 'cargo_id'],
            include: ['cargo']
        });
        const user_modificador = await Usuario.findOne({
            where: { cedula: historial.updated_by },
            attributes: ['cedula', 'nombre', 'cargo_id'],
            include: ['cargo']
        });
        const user_especialista = (historial.especialista_cedula)
            ? await Usuario.findOne({
                where: { cedula: historial.especialista_cedula },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            })
            : null;

        let user_creador_plain = null;
        if (user_creador) {
            user_creador_plain = { cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre };
        }

        let user_modificador_plain = null;
        if (user_modificador) {
            user_modificador_plain = { cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre };
        }

        const historial_output = {
            id: historial.id,
            nHistoria: historial.numero,
            pacienteId: historial.paciente_id,
            ventaKey: historial.venta_key,
            trazabilidadVenta: await obtenerTrazabilidadVentaHistorial(historial.id),

            datosConsulta: {
                pagoPendiente: historial.pago_pendiente,
                motivo: historial.motivo_consulta,
                otroMotivo: historial.otro_motivo_consulta,
                tipoCristalActual: historial.tipo_cristal_actual,
                tipoLentesContacto: historial.tipo_lentes_contacto,
                fechaUltimaGraduacion: historial.ultima_graduacion,
                especialista: {
                    tipo: historial.especialista_tipo,
                    cedula: historial.especialista_cedula,
                    nombre: user_especialista ? user_especialista.nombre : null,
                    cargo: (user_especialista && user_especialista.cargo) ? user_especialista.cargo.nombre : null,
                    externo: {
                        nombre: historial.especialista_externo_nombre,
                        lugarConsultorio: historial.especialista_externo_lugar,
                    }
                },
                formulaOriginal: {
                    medicoOrigen: {
                        tipo: historial.formula_original_tipo,
                        nombre: historial.formula_original_nombre,
                        lugarConsultorio: historial.formula_original_lugar,
                    }
                },
                formulaExterna: historial.formula_externa,
            },

            examenOcular: {
                lensometria: historial.examen_ocular_lensometria,
                refraccion: historial.examen_ocular_refraccion,
                refraccionFinal: historial.examen_ocular_refraccion_final,
                avsc_avae_otros: historial.examen_ocular_avsc_avae_otros,
            },

            diagnosticoTratamiento: {
                diagnostico: historial.diagnostico,
                tratamiento: historial.tratamiento,
            },

            recomendaciones: historial.recomendaciones,

            conformidad: {
                notaConformidad: historial.conformidad_nota,
            },

            auditoria: {
                fechaCreacion: historial.created_at,
                fechaActualizacion: historial.updated_at,
                creadoPor: user_creador_plain,
                actualizadoPor: user_modificador_plain,
            }
        };

        res.status(200).json({ message: 'ok', historial_medico: historial_output });
    },

    get_all: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const historial_numero = req.params.id;
        let historiales_bd = [];

        if (historial_numero) {
            historiales_bd = await HistorialMedico.findAll({
                where: { numero: historial_numero },
                include: ['paciente']
            });
        } else {
            historiales_bd = await HistorialMedico.findAll({
                include: ['paciente']
            });
        }

        let historiales_output = [];
        for (let historial of historiales_bd) {
            const user_creador = await Usuario.findOne({
                where: { cedula: historial.created_by },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            });
            const user_modificador = await Usuario.findOne({
                where: { cedula: historial.updated_by },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            });
            const user_especialista = (historial.especialista_cedula)
                ? await Usuario.findOne({
                    where: { cedula: historial.especialista_cedula },
                    attributes: ['cedula', 'nombre', 'cargo_id'],
                    include: ['cargo']
                })
                : null;

            let user_creador_plain = null;
            if (user_creador) {
                user_creador_plain = { cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre };
            }

            let user_modificador_plain = null;
            if (user_modificador) {
                user_modificador_plain = { cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre };
            }

            historiales_output.push({
                id: historial.id,
                nHistoria: historial.numero,
                pacienteId: historial.paciente_id,
                ventaKey: historial.venta_key,
                pagoPendiente: historial.pago_pendiente,
                sedeId: historial.paciente ? historial.paciente.sede_id : null,
                trazabilidadVenta: await obtenerTrazabilidadVentaHistorial(historial.id),

                datosConsulta: {
                    motivo: historial.motivo_consulta,
                    otroMotivo: historial.otro_motivo_consulta,
                    tipoCristalActual: historial.tipo_cristal_actual,
                    tipoLentesContacto: historial.tipo_lentes_contacto,
                    fechaUltimaGraduacion: historial.ultima_graduacion,
                    especialista: {
                        tipo: historial.especialista_tipo,
                        cedula: historial.especialista_cedula,
                        nombre: user_especialista ? user_especialista.nombre : null,
                        cargo: (user_especialista && user_especialista.cargo) ? user_especialista.cargo.nombre : null,
                        externo: {
                            nombre: historial.especialista_externo_nombre,
                            lugarConsultorio: historial.especialista_externo_lugar,
                        }
                    },
                    formulaOriginal: {
                        medicoOrigen: {
                            tipo: historial.formula_original_tipo,
                            nombre: historial.formula_original_nombre,
                            lugarConsultorio: historial.formula_original_lugar,
                        }
                    },
                    formulaExterna: historial.formula_externa,
                },

                examenOcular: {
                    lensometria: historial.examen_ocular_lensometria,
                    refraccion: historial.examen_ocular_refraccion,
                    refraccionFinal: historial.examen_ocular_refraccion_final,
                    avsc_avae_otros: historial.examen_ocular_avsc_avae_otros,
                },

                diagnosticoTratamiento: {
                    diagnostico: historial.diagnostico,
                    tratamiento: historial.tratamiento,
                },

                recomendaciones: historial.recomendaciones,

                conformidad: {
                    notaConformidad: historial.conformidad_nota,
                },

                auditoria: {
                    fechaCreacion: historial.created_at,
                    fechaActualizacion: historial.updated_at,
                    creadoPor: user_creador_plain,
                    actualizadoPor: user_modificador_plain,
                }
            });
        }

        res.status(200).json({ message: 'ok', historiales_medicos: historiales_output });
    },

    get_paciente: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const paciente_id = req.params.paciente_id;
        let historiales_bd = [];

        historiales_bd = await HistorialMedico.findAll({
            where: { paciente_id: paciente_id },
            include: ['paciente']
        });

        let historiales_output = [];
        for (let historial of historiales_bd) {
            const user_creador = await Usuario.findOne({
                where: { cedula: historial.created_by },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            });
            const user_modificador = await Usuario.findOne({
                where: { cedula: historial.updated_by },
                attributes: ['cedula', 'nombre', 'cargo_id'],
                include: ['cargo']
            });
            const user_especialista = (historial.especialista_cedula)
                ? await Usuario.findOne({
                    where: { cedula: historial.especialista_cedula },
                    attributes: ['cedula', 'nombre', 'cargo_id'],
                    include: ['cargo']
                })
                : null;

            let user_creador_plain = null;
            if (user_creador) {
                user_creador_plain = { cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre };
            }

            let user_modificador_plain = null;
            if (user_modificador) {
                user_modificador_plain = { cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre };
            }

            historiales_output.push({
                id: historial.id,
                nHistoria: historial.numero,
                pacienteId: historial.paciente_id,
                ventaKey: historial.venta_key,
                trazabilidadVenta: await obtenerTrazabilidadVentaHistorial(historial.id),

                datosConsulta: {
                    pagoPendiente: historial.pago_pendiente,
                    motivo: historial.motivo_consulta,
                    otroMotivo: historial.otro_motivo_consulta,
                    tipoCristalActual: historial.tipo_cristal_actual,
                    tipoLentesContacto: historial.tipo_lentes_contacto,
                    fechaUltimaGraduacion: historial.ultima_graduacion,
                    especialista: {
                        tipo: historial.especialista_tipo,
                        cedula: historial.especialista_cedula,
                        nombre: user_especialista ? user_especialista.nombre : null,
                        cargo: (user_especialista && user_especialista.cargo) ? user_especialista.cargo.nombre : null,
                        externo: {
                            nombre: historial.especialista_externo_nombre,
                            lugarConsultorio: historial.especialista_externo_lugar,
                        }
                    },
                    formulaOriginal: {
                        medicoOrigen: {
                            tipo: historial.formula_original_tipo,
                            nombre: historial.formula_original_nombre,
                            lugarConsultorio: historial.formula_original_lugar,
                        }
                    },
                    formulaExterna: historial.formula_externa,
                },

                examenOcular: {
                    lensometria: historial.examen_ocular_lensometria,
                    refraccion: historial.examen_ocular_refraccion,
                    refraccionFinal: historial.examen_ocular_refraccion_final,
                    avsc_avae_otros: historial.examen_ocular_avsc_avae_otros,
                },

                diagnosticoTratamiento: {
                    diagnostico: historial.diagnostico,
                    tratamiento: historial.tratamiento,
                },

                recomendaciones: historial.recomendaciones,

                conformidad: {
                    notaConformidad: historial.conformidad_nota,
                },

                auditoria: {
                    fechaCreacion: historial.created_at,
                    fechaActualizacion: historial.updated_at,
                    creadoPor: user_creador_plain,
                    actualizadoPor: user_modificador_plain,
                }
            });
        }

        res.status(200).json({ message: 'ok', historiales_medicos: historiales_output });
    },

    delete: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const historial_numero = req.params.id;

        const objHistorial = await HistorialMedico.findOne({ where: { numero: historial_numero } });
        if (!objHistorial) {
            throw { message: `Historial medico '${historial_numero}' no existe.` };
        }

        const objPaciente = await Paciente.findOne({ where: { pkey: objHistorial.paciente_id } });
        if (!objPaciente) {
            throw { message: `El paciente del historial medico '${historial_numero}' no existe.` };
        }

        if (objPaciente.sede_id != req.sede.id) {
            throw { message: "No se puede eliminar historial medicos de pacientes de otras sedes." };
        }

        await objHistorial.destroy();

        res.status(200).json({ message: 'ok' });
    },
};

module.exports = HistorialMedicoController;
