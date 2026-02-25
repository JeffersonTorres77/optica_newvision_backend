const HistorialMedico = require('../models/HistorialMedico');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const VerificationUtils = require('../utils/VerificationUtils');

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
            ultima_graduacion: datosConsulta.fechaUltimaGraduacion,
            medico: datosConsulta.medico,
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

        const user_medico = await Usuario.findOne({
            where: { cedula: historial.medico },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });
        const user_creador = await Usuario.findOne({
            where: { cedula: historial.created_by },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });
        const user_modificador = await Usuario.findOne({
            where: { cedula: historial.updated_by },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });

        let user_medico_plain = null;
        if(user_medico) {
            user_medico_plain = {cedula: user_medico.cedula, nombre: user_medico.nombre, cargo: user_medico.cargo.nombre};
        }

        let user_creador_plain = null;
        if(user_creador) {
            user_creador_plain = {cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre};
        }

        let user_modificador_plain = null;
        if(user_modificador) {
            user_modificador_plain = {cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre};
        }
        
        const historial_output = {
            id: historial.id,
            nHistoria: historial.numero,
            pacienteId: historial.paciente_id,

            datosConsulta: {
                motivo: historial.motivo_consulta,
                otroMotivo: historial.otro_motivo_consulta,
                tipoCristalActual: historial.tipo_cristal_actual,
                fechaUltimaGraduacion: historial.ultima_graduacion,
                medico: user_medico_plain,
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

        if(objPaciente.sede_id != req.sede.id) {
            throw { message: "No se puede modificar historial medicos de pacientes de otras sedes." };
        }
        
        const {
            datosConsulta,
            examenOcular,
            diagnosticoTratamiento,
            recomendaciones,
            conformidad,
        } = req.body;

        // ========================================
        objHistorial.motivo_consulta = datosConsulta.motivo;
        objHistorial.otro_motivo_consulta = datosConsulta.otroMotivo;
        objHistorial.tipo_cristal_actual = datosConsulta.tipoCristalActual;
        objHistorial.ultima_graduacion = datosConsulta.fechaUltimaGraduacion;
        objHistorial.medico = datosConsulta.medico;
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
        
        const user_medico = await Usuario.findOne({
            where: { cedula: historial.medico },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });
        const user_creador = await Usuario.findOne({
            where: { cedula: historial.created_by },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });
        const user_modificador = await Usuario.findOne({
            where: { cedula: historial.updated_by },
            attributes: ['cedula','nombre','cargo_id'],
            include: ['cargo']
        });

        let user_medico_plain = null;
        if(user_medico) {
            user_medico_plain = {cedula: user_medico.cedula, nombre: user_medico.nombre, cargo: user_medico.cargo.nombre};
        }

        let user_creador_plain = null;
        if(user_creador) {
            user_creador_plain = {cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre};
        }

        let user_modificador_plain = null;
        if(user_modificador) {
            user_modificador_plain = {cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre};
        }

        const historial_output = {
            id: historial.id,
            nHistoria: historial.numero,
            pacienteId: historial.paciente_id,

            datosConsulta: {
                motivo: historial.motivo_consulta,
                otroMotivo: historial.otro_motivo_consulta,
                tipoCristalActual: historial.tipo_cristal_actual,
                fechaUltimaGraduacion: historial.ultima_graduacion,
                medico: user_medico_plain,
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
        for(let historial of historiales_bd) {
            const user_medico = await Usuario.findOne({
                where: { cedula: historial.medico },
                attributes: ['cedula','nombre','cargo_id'],
                include: ['cargo']
            });
            const user_creador = await Usuario.findOne({
                where: { cedula: historial.created_by },
                attributes: ['cedula','nombre','cargo_id'],
                include: ['cargo']
            });
            const user_modificador = await Usuario.findOne({
                where: { cedula: historial.updated_by },
                attributes: ['cedula','nombre','cargo_id'],
                include: ['cargo']
            });

            let user_medico_plain = null;
            if(user_medico) {
                user_medico_plain = {cedula: user_medico.cedula, nombre: user_medico.nombre, cargo: user_medico.cargo.nombre};
            }

            let user_creador_plain = null;
            if(user_creador) {
                user_creador_plain = {cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre};
            }

            let user_modificador_plain = null;
            if(user_modificador) {
                user_modificador_plain = {cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre};
            }

            historiales_output.push({
                id: historial.id,
                nHistoria: historial.numero,
                pacienteId: historial.paciente_id,
                sedeId: historial.paciente.sede_id,

                datosConsulta: {
                    motivo: historial.motivo_consulta,
                    otroMotivo: historial.otro_motivo_consulta,
                    tipoCristalActual: historial.tipo_cristal_actual,
                    fechaUltimaGraduacion: historial.ultima_graduacion,
                    medico: user_medico_plain,
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
            for(let historial of historiales_bd) {
                const user_medico = await Usuario.findOne({
                    where: { cedula: historial.medico },
                    attributes: ['cedula','nombre','cargo_id'],
                    include: ['cargo']
                });
                const user_creador = await Usuario.findOne({
                    where: { cedula: historial.created_by },
                    attributes: ['cedula','nombre','cargo_id'],
                    include: ['cargo']
                });
                const user_modificador = await Usuario.findOne({
                    where: { cedula: historial.updated_by },
                    attributes: ['cedula','nombre','cargo_id'],
                    include: ['cargo']
                });

                let user_medico_plain = null;
                if(user_medico) {
                    user_medico_plain = {cedula: user_medico.cedula, nombre: user_medico.nombre, cargo: user_medico.cargo.nombre};
                }

                let user_creador_plain = null;
                if(user_creador) {
                    user_creador_plain = {cedula: user_creador.cedula, nombre: user_creador.nombre, cargo: user_creador.cargo.nombre};
                }

                let user_modificador_plain = null;
                if(user_modificador) {
                    user_modificador_plain = {cedula: user_modificador.cedula, nombre: user_modificador.nombre, cargo: user_modificador.cargo.nombre};
                }

                historiales_output.push({
                    id: historial.id,
                    nHistoria: historial.numero,
                    pacienteId: historial.paciente_id,

                    datosConsulta: {
                        motivo: historial.motivo_consulta,
                        otroMotivo: historial.otro_motivo_consulta,
                        tipoCristalActual: historial.tipo_cristal_actual,
                        fechaUltimaGraduacion: historial.ultima_graduacion,
                        medico: user_medico_plain,
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

        if(objPaciente.sede_id != req.sede.id) {
            throw { message: "No se puede eliminar historial medicos de pacientes de otras sedes." };
        }
        
        await objHistorial.destroy();
        
        res.status(200).json({ message: 'ok' });
    },
};

module.exports = HistorialMedicoController;
