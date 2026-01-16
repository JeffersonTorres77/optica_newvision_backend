const VerificationUtils = require('../utils/VerificationUtils');
const Paciente = require('./../models/Paciente');
const Cliente = require('./../models/Cliente');
const HashUtils = require('../utils/HashUtil');
const { Op } = require('sequelize');
const Empresa = require('../models/Empresa');
const EmpresaService = require('../services/EmpresaService');

const PacienteController = {
    add: async (req, res) => {
        try {
            if (!req.user) {
                throw { message: "Sesion invalida." };
            }

            const {
                informacionPersonal: informacionPersonal,
                redesSociales: redes_sociales,
                historiaClinica: historiaClinica,
                empresa: empresa,
            } = req.body;

            if (!validar_estructura_informacion_personal(informacionPersonal)) {
                throw { message: "La estructura de 'informacionPersonal' es incorrecta." };
            }
            if (!validar_estructura_historia_clinica(historiaClinica)) {
                throw { message: "La estructura de 'historiaClinica' es incorrecta." };
            }
            if (informacionPersonal.esMenorSinCedula !== false && informacionPersonal.esMenorSinCedula !== true && informacionPersonal.esMenorSinCedula !== null) {
                throw { message: "EL parametro 'esMenorSinCedula' debe ser true, false o null" };
            }
            if (!VerificationUtils.verify_cedula(informacionPersonal.cedula)) {
                throw { message: "La cedula no es valida." };
            }
            if (!VerificationUtils.verify_nombre(informacionPersonal.nombreCompleto)) {
                throw { message: "El nombre no puede estar vacio." };
            }
            if (!VerificationUtils.verify_fecha(informacionPersonal.fechaNacimiento)) {
                throw { message: "La fecha no tiene el formato correcto" };
            }
            if (informacionPersonal.telefono != null && !VerificationUtils.verify_telefono(informacionPersonal.telefono)) {
                throw { message: "El telefono debe contener 11 digitos." };
            }
            if (informacionPersonal.email != null && !VerificationUtils.verify_correo(informacionPersonal.email)) {
                throw { message: "El correo no es valido." };
            }
            if (!['m', 'f'].includes(informacionPersonal.genero.toLowerCase())) {
                throw { message: "El genero debe ser 'm' (Masculino) o 'f' (Femenino)." };
            }
            if (informacionPersonal.ocupacion !== null && typeof informacionPersonal.ocupacion !== 'string') {
                throw { message: "La ocupacion debe ser nula o una cadena de texto." };
            }
            if (informacionPersonal.direccion !== null && typeof informacionPersonal.direccion !== 'string') {
                throw { message: "La direccion debe ser nula o una cadena de texto." };
            }
            if (!validar_array_redes_sociales(redes_sociales)) {
                throw { message: "Las redes sociales enviadas no tienen el formato esperado: [{platform, username}]" };
            }
            if (historiaClinica.usuarioLentes !== null && typeof historiaClinica.usuarioLentes !== 'string') {
                throw { message: "El parametro 'historiaClinica.usuarioLentes' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.fotofobia !== null && typeof historiaClinica.fotofobia !== 'string') {
                throw { message: "El parametro 'historiaClinica.fotofobia' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.usoDispositivo !== null && typeof historiaClinica.usoDispositivo !== 'string') {
                throw { message: "El parametro 'historiaClinica.usoDispositivo' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.traumatismoOcular !== null && typeof historiaClinica.traumatismoOcular !== 'string') {
                throw { message: "El parametro 'historiaClinica.traumatismoOcular' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.traumatismoOcularDescripcion !== null && typeof historiaClinica.traumatismoOcularDescripcion !== 'string') {
                throw { message: "El parametro 'historiaClinica.traumatismoOcularDescripcion' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.cirugiaOcular !== null && typeof historiaClinica.cirugiaOcular !== 'string') {
                throw { message: "El parametro 'historiaClinica.cirugiaOcular' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.cirugiaOcularDescripcion !== null && typeof historiaClinica.cirugiaOcularDescripcion !== 'string') {
                throw { message: "El parametro 'historiaClinica.cirugiaOcularDescripcion' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.alergicoA !== null && typeof historiaClinica.alergicoA !== 'string') {
                throw { message: "El parametro 'historiaClinica.alergicoA' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.antecedentesPersonales !== null && !Array.isArray(historiaClinica.antecedentesPersonales)) {
                throw { message: "El parametro 'historiaClinica.antecedentesPersonales' debe ser nula o un array." };
            }
            if (historiaClinica.antecedentesFamiliares !== null && !Array.isArray(historiaClinica.antecedentesFamiliares)) {
                throw { message: "El parametro 'historiaClinica.antecedentesFamiliares' debe ser nula o un array." };
            }
            if (historiaClinica.patologias !== null && !Array.isArray(historiaClinica.patologias)) {
                throw { message: "El parametro 'historiaClinica.patologias' debe ser nula o un array." };
            }
            if (historiaClinica.patologiaOcular !== null && !Array.isArray(historiaClinica.patologiaOcular)) {
                throw { message: "El parametro 'historiaClinica.patologiaOcular' debe ser nula o un array." };
            }

            const sin_cedula = (informacionPersonal.esMenorSinCedula === true) ? true : false;

            // Validamos usuario duplicado
            if (!sin_cedula) {
                const count = await Paciente.count({ where: { sede_id: req.sede.id, cedula: informacionPersonal.cedula } });
                if (count > 0) {
                    throw { message: `Ya esta registrado un paciente con la cedula '${informacionPersonal.cedula}' en la sede '${req.sede.id}'.` };
                }
            }
            else {
                const count = await Paciente.count({ where: { sede_id: req.sede.id, cedula: informacionPersonal.cedula, nombre: informacionPersonal.nombreCompleto } });
                if (count > 0) {
                    console.log(count);
                    throw { message: `Ya esta registrado un paciente menor de edad con la cedula '${req.sede.id}' en la sede '${informacionPersonal.cedula}' a nombre de '${informacionPersonal.nombreCompleto}'.` };
                }
            }

            let empresa_rif = null;
            let obj_empresa = null;
            if (empresa) {
                await EmpresaService.guardar_empresa({
                    sede: req.sede.id,
                    rif: empresa.rif,
                    nombre: empresa.nombre,
                    telefono: empresa.telefono,
                    direccion: empresa.direccion,
                    correo: empresa.correo
                });
                obj_empresa = {
                    sede: req.sede.id,
                    rif: empresa.rif,
                    nombre: empresa.nombre,
                    telefono: empresa.telefono,
                    direccion: empresa.direccion,
                    correo: empresa.correo
                };
                empresa_rif = empresa.rif;
            }

            const objPaciente = await Paciente.create({
                sede_id: req.sede.id,
                cedula: informacionPersonal.cedula,
                sin_cedula: sin_cedula,
                nombre: informacionPersonal.nombreCompleto,
                fecha_nacimiento: informacionPersonal.fechaNacimiento,
                telefono: (informacionPersonal.telefono == null) ? "" : informacionPersonal.telefono,
                email: (informacionPersonal.email == null) ? "" : informacionPersonal.email,
                ocupacion: (informacionPersonal.ocupacion == null) ? "" : informacionPersonal.ocupacion,
                genero: informacionPersonal.genero.toLowerCase(),
                direccion: (informacionPersonal.direccion == null) ? "" : informacionPersonal.direccion,
                redes_sociales: redes_sociales,
                empresa_rif: empresa_rif,
                tiene_lentes: historiaClinica.usuarioLentes,
                fotofobia: historiaClinica.fotofobia,
                uso_dispositivo_electronico: historiaClinica.usoDispositivo,
                traumatismo_ocular: historiaClinica.traumatismoOcular,
                traumatismo_ocular_descripcion: historiaClinica.traumatismoOcularDescripcion,
                cirugia_ocular: historiaClinica.cirugiaOcular,
                cirugia_ocular_descripcion: historiaClinica.cirugiaOcularDescripcion,
                alergias: historiaClinica.alergicoA,
                antecedentes_personales: historiaClinica.antecedentesPersonales,
                antecedentes_familiares: historiaClinica.antecedentesFamiliares,
                patologias: historiaClinica.patologias,
                patologia_ocular: historiaClinica.patologiaOcular,
            });

            objPaciente.pkey = HashUtils.generate(objPaciente.id);
            objPaciente.save();

            const paciente = objPaciente.get({ plain: true });
            const paciente_output = {
                id: paciente.id,
                key: paciente.pkey,
                sedeId: paciente.sede_id,
                created_at: paciente.created_at,
                updated_at: paciente.updated_at,
                informacionPersonal: {
                    esMenorSinCedula: paciente.sin_cedula,
                    nombreCompleto: paciente.nombre,
                    cedula: paciente.cedula,
                    telefono: paciente.telefono,
                    email: paciente.email,
                    fechaNacimiento: paciente.fecha_nacimiento,
                    ocupacion: paciente.ocupacion,
                    genero: paciente.genero,
                    direccion: paciente.direccion
                },
                redesSociales: paciente.redes_sociales,
                historiaClinica: {
                    usuarioLentes: paciente.tiene_lentes,
                    fotofobia: paciente.fotofobia,
                    usoDispositivo: paciente.uso_dispositivo_electronico,
                    traumatismoOcular: paciente.traumatismo_ocular,
                    traumatismoOcularDescripcion: paciente.traumatismo_ocular_descripcion,
                    cirugiaOcular: paciente.cirugia_ocular,
                    cirugiaOcularDescripcion: paciente.cirugia_ocular_descripcion,
                    alergicoA: paciente.alergias,
                    antecedentesPersonales: paciente.antecedentes_personales,
                    antecedentesFamiliares: paciente.antecedentes_familiares,
                    patologias: paciente.patologias,
                    patologiaOcular: paciente.patologia_ocular
                },
                empresa: obj_empresa
            };
            res.status(200).json({ message: 'ok', paciente: paciente_output });
        } catch (err) {
            console.error(err);
            res.status(400).json(err);
        }
    },

    update: async (req, res) => {
        try {
            if (!req.user) {
                throw { message: "Sesion invalida." };
            }

            const id = req.params.id;
            const objPaciente = await Paciente.findOne({ where: { pkey: id } });
            if (!objPaciente) {
                throw { message: "El paciente enviado no existe." };
            }
            if (objPaciente.sede_id != req.sede.id) {
                throw { message: "No se puede modificar pacientes de otras sedes." };
            }

            const {
                informacionPersonal: informacionPersonal,
                redesSociales: redes_sociales,
                historiaClinica: historiaClinica,
                empresa: empresa
            } = req.body;

            if (!validar_estructura_informacion_personal(informacionPersonal)) {
                throw { message: "La estructura de 'informacionPersonal' es incorrecta." };
            }
            if (!validar_estructura_historia_clinica(historiaClinica)) {
                throw { message: "La estructura de 'historiaClinica' es incorrecta." };
            }
            if (informacionPersonal.esMenorSinCedula !== false && informacionPersonal.esMenorSinCedula !== true && informacionPersonal.esMenorSinCedula !== null) {
                throw { message: "EL parametro 'esMenorSinCedula' debe ser true, false o null" };
            }
            if (!VerificationUtils.verify_cedula(informacionPersonal.cedula)) {
                throw { message: "La cedula no es valida." };
            }
            if (!VerificationUtils.verify_nombre(informacionPersonal.nombreCompleto)) {
                throw { message: "El nombre no puede estar vacio." };
            }
            if (!VerificationUtils.verify_fecha(informacionPersonal.fechaNacimiento)) {
                throw { message: "La fecha no tiene el formato correcto" };
            }
            if (informacionPersonal.telefono != null && !VerificationUtils.verify_telefono(informacionPersonal.telefono)) {
                throw { message: "El telefono debe contener 11 digitos." };
            }
            if (informacionPersonal.email != null && !VerificationUtils.verify_correo(informacionPersonal.email)) {
                throw { message: "El correo no es valido." };
            }
            if (!['m', 'f'].includes(informacionPersonal.genero.toLowerCase())) {
                throw { message: "El genero debe ser 'm' (Masculino) o 'f' (Femenino)." };
            }
            if (informacionPersonal.ocupacion !== null && typeof informacionPersonal.ocupacion !== 'string') {
                throw { message: "La ocupacion debe ser nula o una cadena de texto." };
            }
            if (informacionPersonal.direccion !== null && typeof informacionPersonal.direccion !== 'string') {
                throw { message: "La direccion debe ser nula o una cadena de texto." };
            }
            if (!validar_array_redes_sociales(redes_sociales)) {
                throw { message: "Las redes sociales enviadas no tienen el formato esperado: [{platform, username}]" };
            }
            if (historiaClinica.usuarioLentes !== null && typeof historiaClinica.usuarioLentes !== 'string') {
                throw { message: "El parametro 'historiaClinica.usuarioLentes' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.fotofobia !== null && typeof historiaClinica.fotofobia !== 'string') {
                throw { message: "El parametro 'historiaClinica.fotofobia' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.usoDispositivo !== null && typeof historiaClinica.usoDispositivo !== 'string') {
                throw { message: "El parametro 'historiaClinica.usoDispositivo' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.traumatismoOcular !== null && typeof historiaClinica.traumatismoOcular !== 'string') {
                throw { message: "El parametro 'historiaClinica.traumatismoOcular' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.traumatismoOcularDescripcion !== null && typeof historiaClinica.traumatismoOcularDescripcion !== 'string') {
                throw { message: "El parametro 'historiaClinica.traumatismoOcularDescripcion' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.cirugiaOcular !== null && typeof historiaClinica.cirugiaOcular !== 'string') {
                throw { message: "El parametro 'historiaClinica.cirugiaOcular' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.cirugiaOcularDescripcion !== null && typeof historiaClinica.cirugiaOcularDescripcion !== 'string') {
                throw { message: "El parametro 'historiaClinica.cirugiaOcularDescripcion' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.alergicoA !== null && typeof historiaClinica.alergicoA !== 'string') {
                throw { message: "El parametro 'historiaClinica.alergicoA' debe ser nula o una cadena de texto." };
            }
            if (historiaClinica.antecedentesPersonales !== null && !Array.isArray(historiaClinica.antecedentesPersonales)) {
                throw { message: "El parametro 'historiaClinica.antecedentesPersonales' debe ser nula o un array." };
            }
            if (historiaClinica.antecedentesFamiliares !== null && !Array.isArray(historiaClinica.antecedentesFamiliares)) {
                throw { message: "El parametro 'historiaClinica.antecedentesFamiliares' debe ser nula o un array." };
            }
            if (historiaClinica.patologias !== null && !Array.isArray(historiaClinica.patologias)) {
                throw { message: "El parametro 'historiaClinica.patologias' debe ser nula o un array." };
            }
            if (historiaClinica.patologiaOcular !== null && !Array.isArray(historiaClinica.patologiaOcular)) {
                throw { message: "El parametro 'historiaClinica.patologiaOcular' debe ser nula o un array." };
            }

            const sin_cedula = (informacionPersonal.esMenorSinCedula === true) ? true : false;

            // Validamos usuario duplicado
            if (!sin_cedula) {
                const count = await Paciente.count({ where: { id: { [Op.ne]: objPaciente.id }, sede_id: req.sede.id, cedula: informacionPersonal.cedula } });
                if (count > 0) {
                    throw { message: `Ya esta registrado un paciente con la cedula '${informacionPersonal.cedula}' en la sede '${req.sede.id}'.` };
                }
            }
            else {
                const count = await Paciente.count({ where: { id: { [Op.ne]: objPaciente.id }, sede_id: req.sede.id, cedula: informacionPersonal.cedula, nombre: informacionPersonal.nombreCompleto } });
                if (count > 0) {
                    throw { message: `Ya esta registrado un paciente menor de edad con la cedula '${req.sede.id}' en la sede '${informacionPersonal.cedula}' a nombre de '${informacionPersonal.nombreCompleto}'.` };
                }
            }

            let empresa_rif = null;
            let obj_empresa = null;
            if (empresa && empresa.rif) {
                await EmpresaService.guardar_empresa({
                    sede: req.sede.id,
                    rif: empresa.rif,
                    nombre: empresa.nombre,
                    telefono: empresa.telefono,
                    direccion: empresa.direccion,
                    correo: empresa.correo
                });
                obj_empresa = {
                    sede: req.sede.id,
                    rif: empresa.rif,
                    nombre: empresa.nombre,
                    telefono: empresa.telefono,
                    direccion: empresa.direccion,
                    correo: empresa.correo
                };
                empresa_rif = empresa.rif;
            }

            objPaciente.cedula = informacionPersonal.cedula;
            objPaciente.sin_cedula = sin_cedula;
            objPaciente.nombre = informacionPersonal.nombreCompleto;
            objPaciente.fecha_nacimiento = informacionPersonal.fechaNacimiento;
            objPaciente.telefono = (informacionPersonal.telefono == null) ? "" : informacionPersonal.telefono;
            objPaciente.email = (informacionPersonal.email == null) ? "" : informacionPersonal.email;
            objPaciente.ocupacion = (informacionPersonal.ocupacion == null) ? "" : informacionPersonal.ocupacion;
            objPaciente.genero = informacionPersonal.genero.toLowerCase();
            objPaciente.direccion = (informacionPersonal.direccion == null) ? "" : informacionPersonal.direccion;
            objPaciente.redes_sociales = redes_sociales;
            objPaciente.empresa_rif = empresa_rif;
            objPaciente.tiene_lentes = historiaClinica.usuarioLentes;
            objPaciente.fotofobia = historiaClinica.fotofobia;
            objPaciente.uso_dispositivo_electronico = historiaClinica.usoDispositivo;
            objPaciente.traumatismo_ocular = historiaClinica.traumatismoOcular;
            objPaciente.traumatismo_ocular_descripcion = historiaClinica.traumatismoOcularDescripcion;
            objPaciente.cirugia_ocular = historiaClinica.cirugiaOcular;
            objPaciente.cirugia_ocular_descripcion = historiaClinica.cirugiaOcularDescripcion;
            objPaciente.alergias = historiaClinica.alergicoA;
            objPaciente.antecedentes_personales = historiaClinica.antecedentesPersonales;
            objPaciente.antecedentes_familiares = historiaClinica.antecedentesFamiliares;
            objPaciente.patologias = historiaClinica.patologias;
            objPaciente.patologia_ocular = historiaClinica.patologiaOcular;
            objPaciente.save();

            // Ajustamos el cliente si existe
            const objCliente = await Cliente.findOne();
            if (objCliente) {
                objCliente.nombre = objPaciente.nombre;
                objCliente.telefono = objPaciente.telefono;
                objCliente.email = objPaciente.email;
                objCliente.save();
            }

            const paciente = objPaciente.get({ plain: true });
            const paciente_output = {
                id: paciente.id,
                key: paciente.pkey,
                sedeId: paciente.sede_id,
                created_at: paciente.created_at,
                updated_at: paciente.updated_at,
                informacionPersonal: {
                    esMenorSinCedula: paciente.sin_cedula,
                    nombreCompleto: paciente.nombre,
                    cedula: paciente.cedula,
                    telefono: paciente.telefono,
                    email: paciente.email,
                    fechaNacimiento: paciente.fecha_nacimiento,
                    ocupacion: paciente.ocupacion,
                    genero: paciente.genero,
                    direccion: paciente.direccion
                },
                redesSociales: paciente.redes_sociales,
                historiaClinica: {
                    usuarioLentes: paciente.tiene_lentes,
                    fotofobia: paciente.fotofobia,
                    usoDispositivo: paciente.uso_dispositivo_electronico,
                    traumatismoOcular: paciente.traumatismo_ocular,
                    traumatismoOcularDescripcion: paciente.traumatismo_ocular_descripcion,
                    cirugiaOcular: paciente.cirugia_ocular,
                    cirugiaOcularDescripcion: paciente.cirugia_ocular_descripcion,
                    alergicoA: paciente.alergias,
                    antecedentesPersonales: paciente.antecedentes_personales,
                    antecedentesFamiliares: paciente.antecedentes_familiares,
                    patologias: paciente.patologias,
                    patologiaOcular: paciente.patologia_ocular
                },
                empresa: obj_empresa
            };

            res.status(200).json({ message: 'ok', paciente: paciente_output });
        } catch (err) {
            console.error(err);
            res.status(400).json(err);
        }
    },

    get: async (req, res) => {
        try {
            if (!req.user) {
                throw { message: "Sesion invalida." };
            }

            const paciente_id = req.params.id;
            let pacientes_db = [];
            const attributes = [
                'id', 'pkey', 'sede_id', 'cedula', 'sin_cedula', 'nombre', 'fecha_nacimiento', 'telefono', 'email', 'ocupacion', 'genero', 'direccion', 'redes_sociales', 'created_at', 'updated_at',
                'tiene_lentes', 'fotofobia', 'uso_dispositivo_electronico', 'traumatismo_ocular', 'traumatismo_ocular_descripcion', 'cirugia_ocular', 'cirugia_ocular_descripcion', 'alergias',
                'antecedentes_personales', 'antecedentes_familiares', 'patologias', 'patologia_ocular'
            ];

            if (paciente_id) {
                pacientes_db = await Paciente.findAll({
                    where: { pkey: paciente_id },
                    attributes: attributes,
                    include: ['sede', 'empresa']
                });
            } else {
                pacientes_db = await Paciente.findAll({
                    attributes: attributes,
                    include: ['sede', 'empresa']
                });
            }

            let pacientes_output = [];
            for (let paciente of pacientes_db) {
                pacientes_output.push({
                    id: paciente.id,
                    key: paciente.pkey,
                    sedeId: paciente.sede_id,
                    created_at: paciente.created_at,
                    updated_at: paciente.updated_at,
                    informacionPersonal: {
                        esMenorSinCedula: paciente.sin_cedula,
                        nombreCompleto: paciente.nombre,
                        cedula: paciente.cedula,
                        telefono: paciente.telefono,
                        email: paciente.email,
                        fechaNacimiento: paciente.fecha_nacimiento,
                        ocupacion: paciente.ocupacion,
                        genero: paciente.genero,
                        direccion: paciente.direccion
                    },
                    redesSociales: paciente.redes_sociales,
                    historiaClinica: {
                        usuarioLentes: paciente.tiene_lentes,
                        fotofobia: paciente.fotofobia,
                        usoDispositivo: paciente.uso_dispositivo_electronico,
                        traumatismoOcular: paciente.traumatismo_ocular,
                        traumatismoOcularDescripcion: paciente.traumatismo_ocular_descripcion,
                        cirugiaOcular: paciente.cirugia_ocular,
                        cirugiaOcularDescripcion: paciente.cirugia_ocular_descripcion,
                        alergicoA: paciente.alergias,
                        antecedentesPersonales: paciente.antecedentes_personales,
                        antecedentesFamiliares: paciente.antecedentes_familiares,
                        patologias: paciente.patologias,
                        patologiaOcular: paciente.patologia_ocular
                    },
                    empresa: (paciente.empresa) ? {
                        rif: paciente.empresa.rif,
                        nombre: paciente.empresa.nombre,
                        direccion: paciente.empresa.direccion,
                        correo: paciente.empresa.correo,
                        telefono: paciente.empresa.telefono
                    } : null
                });
            }

            res.status(200).json({ message: 'ok', pacientes: pacientes_output });
        } catch (err) {
            console.error(err);
            res.status(400).json(err);
        }
    },

    delete: async (req, res) => {
        try {
            if (!req.user) {
                throw { message: "Sesion invalida." };
            }

            const paciente_id = req.params.id;

            const paciente = await Paciente.findOne({ where: { pkey: paciente_id } });
            if (!paciente) {
                throw { message: "Paciente no existe." };
            }
            if (paciente.sede_id != req.sede.id) {
                throw { message: "No se puede eliminar pacientes de otras sedes." };
            }
            await paciente.destroy();

            res.status(200).json({ message: 'ok' });
        } catch (err) {
            console.error(err);
            res.status(400).json(err);
        }
    },
};

function validar_estructura_informacion_personal(objeto) {
    return (
        objeto && typeof objeto === 'object' &&
        'esMenorSinCedula' in objeto &&
        'nombreCompleto' in objeto &&
        'cedula' in objeto &&
        'telefono' in objeto &&
        'email' in objeto &&
        'fechaNacimiento' in objeto &&
        'ocupacion' in objeto &&
        'genero' in objeto &&
        'direccion' in objeto
    );
}

function validar_estructura_historia_clinica(objeto) {
    return (
        objeto && typeof objeto === 'object' &&
        'usuarioLentes' in objeto &&
        'fotofobia' in objeto &&
        'usoDispositivo' in objeto &&
        'traumatismoOcular' in objeto &&
        'traumatismoOcularDescripcion' in objeto &&
        'cirugiaOcular' in objeto &&
        'cirugiaOcularDescripcion' in objeto &&
        'alergicoA' in objeto &&
        'antecedentesPersonales' in objeto &&
        'antecedentesFamiliares' in objeto &&
        'patologias' in objeto &&
        'patologiaOcular' in objeto
    );
}

function validar_array_redes_sociales(redes) {
    return (
        Array.isArray(redes) &&
        redes.every(item =>
            typeof item === 'object' &&
            item !== null &&
            'platform' in item &&
            'username' in item
        )
    );
}

module.exports = PacienteController;