const VerificationUtils = require('../utils/VerificationUtils');
const Paciente = require('./../models/Paciente');
const PacienteSede = require('./../models/PacienteSede');
const PacienteAlias = require('./../models/PacienteAlias');
const Cliente = require('./../models/Cliente');
const HashUtils = require('../utils/HashUtil');
const { Op } = require('sequelize');
const Empresa = require('../models/Empresa');
const Sede = require('../models/Sede');
const EmpresaService = require('../services/EmpresaService');

const PacienteController = {
    add: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const {
            informacionPersonal: informacionPersonal,
            redesSociales: redes_sociales,
            historiaClinica: historiaClinica,
            informacionEmpresa: empresa,
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

        const sin_cedula = (informacionPersonal.esMenorSinCedula === true) ? true : false;

        // Validamos usuario duplicado
        if (!sin_cedula) {
            const pacienteMismaSede = await buscarPacienteDisponibleEnSedePorCedula(informacionPersonal.cedula, req.sede.id);
            if (pacienteMismaSede) {
                const sedeActualNombre = await obtenerNombreSede(req.sede.id);
                const sedeOrigenId = String(pacienteMismaSede.sede_id || '').trim();
                const sedeOrigenNombre = sedeOrigenId ? await obtenerNombreSede(sedeOrigenId) : '';

                if (sedeOrigenId && sedeOrigenId !== String(req.sede.id || '').trim()) {
                    throw {
                        message: `El paciente con la cedula '${informacionPersonal.cedula}' ya esta asociado a la sede '${sedeActualNombre || req.sede.id}'. Su sede de origen es '${sedeOrigenNombre || sedeOrigenId}'.`
                    };
                }

                throw { message: `Ya esta registrado un paciente con la cedula '${informacionPersonal.cedula}' en la sede '${sedeActualNombre || req.sede.id}'.` };
            }

            const pacienteGlobal = await Paciente.findOne({
                where: { cedula: informacionPersonal.cedula },
                include: ['empresa']
            });

            if (pacienteGlobal) {
                const asociacionesPrevias = await PacienteSede.findAll({
                    where: { paciente_key: pacienteGlobal.pkey },
                    attributes: ['sede_id', 'created_at']
                });

                const sedesPreviasIds = asociacionesPrevias
                    .map((registro) => String(registro.sede_id || '').trim())
                    .filter((sedeId) => sedeId && sedeId !== req.sede.id);

                const sedesPrevias = sedesPreviasIds.length
                    ? (await Sede.findAll({
                        where: { id: sedesPreviasIds },
                        attributes: ['id', 'nombre']
                    })).map((sede) => {
                        const sedeId = String(sede.id || '').trim();
                        const asociacion = asociacionesPrevias.find((registro) => String(registro.sede_id || '').trim() === sedeId);

                        return {
                            id: sedeId,
                            nombre: String(sede.nombre || sede.id || '').trim(),
                            fechaAsociacion: asociacion?.created_at || null
                        };
                    })
                    : [];

                await asegurarPacienteEnSede(pacienteGlobal.pkey, req.sede.id);
                return res.status(200).json({
                    message: 'ok',
                    paciente: await construirPacienteOutput(pacienteGlobal.get({ plain: true }), pacienteGlobal.empresa || null),
                    reutilizado: true,
                    sedesPrevias
                });
            }
        }
        else {
            const count = await Paciente.count({ where: { sede_id: req.sede.id, cedula: informacionPersonal.cedula, nombre: informacionPersonal.nombreCompleto } });
            if (count > 0) {
                console.log(count);
                throw { message: `Ya esta registrado un paciente menor de edad con la cedula '${informacionPersonal.cedula}' en la sede '${req.sede.id}' a nombre de '${informacionPersonal.nombreCompleto}'.` };
            }
        }

        let empresa_rif = null;
        let obj_empresa = null;
        if (empresa && empresa.empresaRif) {
            await EmpresaService.guardar_empresa({
                sede: req.sede.id,
                rif: (empresa.empresaRif) ? empresa.empresaRif : null,
                nombre: (empresa.empresaNombre) ? empresa.empresaNombre : null,
                telefono: (empresa.empresaTelefono) ? empresa.empresaTelefono : null,
                direccion: (empresa.empresaDireccion) ? empresa.empresaDireccion : null,
                correo: (empresa.empresaCorreo) ? empresa.empresaCorreo : null
            });
            obj_empresa = {
                sede: req.sede.id,
                rif: (empresa.empresaRif) ? empresa.empresaRif : null,
                nombre: (empresa.empresaNombre) ? empresa.empresaNombre : null,
                telefono: (empresa.empresaTelefono) ? empresa.empresaTelefono : null,
                direccion: (empresa.empresaDireccion) ? empresa.empresaDireccion : null,
                correo: (empresa.empresaCorreo) ? empresa.empresaCorreo : null
            };
            empresa_rif = empresa.empresaRif;
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
        });

        objPaciente.pkey = HashUtils.generate(objPaciente.id);
        objPaciente.save();
        await asegurarPacienteEnSede(objPaciente.pkey, req.sede.id);

        const paciente = objPaciente.get({ plain: true });
        const paciente_output = await construirPacienteOutput(paciente, obj_empresa);
        res.status(200).json({ message: 'ok', paciente: paciente_output });
    },

    update: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;
        const objPaciente = await resolverPacientePorKey(id);
        if (!objPaciente) {
            throw { message: "El paciente enviado no existe." };
        }
        if (!(await pacienteDisponibleEnSede(objPaciente, req.sede.id))) {
            throw { message: "No se puede modificar pacientes de otras sedes." };
        }

        const {
            informacionPersonal: informacionPersonal,
            redesSociales: redes_sociales,
            historiaClinica: historiaClinica,
            informacionEmpresa: empresa
        } = req.body;

        if (!historiaClinica.patologiaOcular) {
            historiaClinica.patologiaOcular = '';
        }

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

        const sin_cedula = (informacionPersonal.esMenorSinCedula === true) ? true : false;

        // Validamos usuario duplicado
        if (!sin_cedula) {
            const pacienteGlobal = await Paciente.findOne({
                where: {
                    id: { [Op.ne]: objPaciente.id },
                    cedula: informacionPersonal.cedula
                }
            });

            if (pacienteGlobal) {
                throw { message: `Ya existe un paciente global con la cedula '${informacionPersonal.cedula}'.` };
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
        if (empresa && empresa.empresaRif) {
            await EmpresaService.guardar_empresa({
                sede: req.sede.id,
                rif: (empresa.empresaRif) ? empresa.empresaRif : null,
                nombre: (empresa.empresaNombre) ? empresa.empresaNombre : null,
                telefono: (empresa.empresaTelefono) ? empresa.empresaTelefono : null,
                direccion: (empresa.empresaDireccion) ? empresa.empresaDireccion : null,
                correo: (empresa.empresaCorreo) ? empresa.empresaCorreo : null
            });
            obj_empresa = {
                sede: req.sede.id,
                rif: (empresa.empresaRif) ? empresa.empresaRif : null,
                nombre: (empresa.empresaNombre) ? empresa.empresaNombre : null,
                telefono: (empresa.empresaTelefono) ? empresa.empresaTelefono : null,
                direccion: (empresa.empresaDireccion) ? empresa.empresaDireccion : null,
                correo: (empresa.empresaCorreo) ? empresa.empresaCorreo : null
            };
            empresa_rif = empresa.empresaRif;
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
            },
            informacionEmpresa: (obj_empresa) ? {
                referidoEmpresa: true,
                empresaRif: obj_empresa.rif,
                empresaNombre: obj_empresa.nombre,
                empresaDireccion: obj_empresa.direccion,
                empresaCorreo: obj_empresa.correo,
                empresaTelefono: obj_empresa.telefono
            } : {
                referidoEmpresa: false
            }
        };

        res.status(200).json({ message: 'ok', paciente: paciente_output });
    },

    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const paciente_id = req.params.id;
        let pacientes_db = [];
        const attributes = [
            'id', 'pkey', 'sede_id', 'cedula', 'sin_cedula', 'nombre', 'fecha_nacimiento', 'telefono', 'email', 'ocupacion', 'genero', 'direccion', 'redes_sociales', 'created_at', 'updated_at',
            'tiene_lentes', 'fotofobia', 'uso_dispositivo_electronico', 'traumatismo_ocular', 'traumatismo_ocular_descripcion', 'cirugia_ocular', 'cirugia_ocular_descripcion', 'alergias',
            'antecedentes_personales', 'antecedentes_familiares', 'patologias'
        ];

        if (paciente_id) {
            pacientes_db = await Paciente.findAll({
                where: { pkey: await resolverPacienteKeyCanonico(paciente_id) },
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
            pacientes_output.push(await construirPacienteOutput(paciente.get({ plain: true }), paciente.empresa || null));
        }

        res.status(200).json({ message: 'ok', pacientes: pacientes_output });
    },

    buscarCoincidencias: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const tipo = String(req.query.tipo || 'cedula').trim().toLowerCase();
        const cedula = String(req.query.cedula || '').trim();

        if (!cedula || !VerificationUtils.verify_cedula(cedula)) {
            throw { message: "La cedula no es valida." };
        }

        if (!['cedula', 'representante'].includes(tipo)) {
            throw { message: "El tipo de busqueda no es valido." };
        }

        if (tipo === 'cedula') {
            const paciente = await Paciente.findOne({
                where: { cedula },
                include: ['sede', 'empresa']
            });

            if (!paciente) {
                return res.status(200).json({
                    message: 'ok',
                    tipo,
                    estado: 'no_encontrado',
                    paciente: null
                });
            }

            const disponibleEnSedeActual = await pacienteDisponibleEnSede(paciente, req.sede.id);

            return res.status(200).json({
                message: 'ok',
                tipo,
                estado: disponibleEnSedeActual ? 'asociado_sede_actual' : 'disponible_en_otra_sede',
                paciente: await construirPacienteOutput(paciente.get({ plain: true }), paciente.empresa || null)
            });
        }

        const pacientesDb = await Paciente.findAll({
            where: {
                cedula,
                sin_cedula: true
            },
            include: ['sede', 'empresa'],
            order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
        });

        const pacientes = [];
        for (const paciente of pacientesDb) {
            const output = await construirPacienteOutput(paciente.get({ plain: true }), paciente.empresa || null);
            pacientes.push({
                ...output,
                disponibleEnSedeActual: await pacienteDisponibleEnSede(paciente, req.sede.id)
            });
        }

        return res.status(200).json({
            message: 'ok',
            tipo,
            estado: pacientes.length ? 'coincidencias' : 'no_encontrado',
            pacientes
        });
    },

    enlazarASedeActual: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const pacienteKey = String(req.params.id || '').trim();
        if (!pacienteKey) {
            throw { message: "Paciente no existe." };
        }

        const paciente = await resolverPacientePorKey(pacienteKey);
        if (!paciente) {
            throw { message: "Paciente no existe." };
        }

        const yaDisponible = await pacienteDisponibleEnSede(paciente, req.sede.id);
        if (!yaDisponible) {
            await asegurarPacienteEnSede(paciente.pkey, req.sede.id);
        }

        const pacienteCompleto = await Paciente.findOne({
            where: { pkey: paciente.pkey },
            include: ['sede', 'empresa']
        });

        return res.status(200).json({
            message: 'ok',
            paciente: await construirPacienteOutput(pacienteCompleto.get({ plain: true }), pacienteCompleto.empresa || null),
            reutilizado: true,
            yaDisponible
        });
    },

    delete: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const paciente_id = req.params.id;

        const paciente = await resolverPacientePorKey(paciente_id);
        if (!paciente) {
            throw { message: "Paciente no existe." };
        }
        if (!(await pacienteDisponibleEnSede(paciente, req.sede.id))) {
            throw { message: "No se puede eliminar pacientes de otras sedes." };
        }
        await paciente.destroy();

        res.status(200).json({ message: 'ok' });
    },
};

async function asegurarPacienteEnSede(pacienteKey, sedeId) {
    const pacienteNormalizado = String(pacienteKey || '').trim();
    const sedeNormalizada = String(sedeId || '').trim();

    if (!pacienteNormalizado || !sedeNormalizada) {
        return;
    }

    await PacienteSede.findOrCreate({
        where: {
            paciente_key: pacienteNormalizado,
            sede_id: sedeNormalizada
        },
        defaults: {
            paciente_key: pacienteNormalizado,
            sede_id: sedeNormalizada
        }
    });
}

async function resolverPacienteKeyCanonico(pacienteKey) {
    const pacienteNormalizado = String(pacienteKey || '').trim();
    if (!pacienteNormalizado) {
        return null;
    }

    const alias = await PacienteAlias.findOne({ where: { alias_key: pacienteNormalizado } });
    return String(alias?.paciente_key || pacienteNormalizado).trim();
}

async function resolverPacientePorKey(pacienteKey) {
    const canonico = await resolverPacienteKeyCanonico(pacienteKey);
    if (!canonico) {
        return null;
    }

    return Paciente.findOne({ where: { pkey: canonico } });
}

async function pacienteDisponibleEnSede(paciente, sedeId) {
    if (!paciente) {
        return false;
    }

    if (String(paciente.sede_id || '').trim() === String(sedeId || '').trim()) {
        return true;
    }

    const asociacion = await PacienteSede.findOne({
        where: {
            paciente_key: String(paciente.pkey || '').trim(),
            sede_id: String(sedeId || '').trim()
        }
    });

    return Boolean(asociacion);
}

async function buscarPacienteDisponibleEnSedePorCedula(cedula, sedeId) {
    const cedulaNormalizada = String(cedula || '').trim();
    if (!cedulaNormalizada) {
        return null;
    }

    const pacienteDirecto = await Paciente.findOne({
        where: {
            sede_id: sedeId,
            cedula: cedulaNormalizada
        }
    });

    if (pacienteDirecto) {
        return pacienteDirecto;
    }

    const asociaciones = await PacienteSede.findAll({
        where: { sede_id: sedeId },
        attributes: ['paciente_key']
    });
    const keys = asociaciones
        .map((item) => String(item.paciente_key || '').trim())
        .filter(Boolean);

    if (!keys.length) {
        return null;
    }

    return Paciente.findOne({
        where: {
            pkey: { [Op.in]: keys },
            cedula: cedulaNormalizada
        }
    });
}

async function obtenerNombreSede(sedeId) {
    const sedeNormalizada = String(sedeId || '').trim();
    if (!sedeNormalizada) {
        return '';
    }

    const sede = await Sede.findOne({ where: { id: sedeNormalizada }, attributes: ['nombre'] });
    return String(sede?.nombre || sedeNormalizada).trim();
}

async function obtenerSedesAsociadasPaciente(paciente) {
    const sedes = new Map();
    const sedePrincipalId = String(paciente?.sede_id || '').trim();

    if (sedePrincipalId) {
        sedes.set(sedePrincipalId, {
            id: sedePrincipalId,
            nombre: String(paciente?.sede?.nombre || sedePrincipalId).trim() || sedePrincipalId
        });
    }

    const asociaciones = await PacienteSede.findAll({
        where: { paciente_key: String(paciente?.pkey || '').trim() },
        attributes: ['sede_id']
    });

    const sedesFaltantes = asociaciones
        .map((item) => String(item.sede_id || '').trim())
        .filter((sedeId) => sedeId && !sedes.has(sedeId));

    if (sedesFaltantes.length) {
        const sedesDb = await Sede.findAll({
            where: { id: sedesFaltantes },
            attributes: ['id', 'nombre']
        });

        for (const sede of sedesDb) {
            const sedeId = String(sede.id || '').trim();
            if (!sedeId) {
                continue;
            }

            sedes.set(sedeId, {
                id: sedeId,
                nombre: String(sede.nombre || sedeId).trim() || sedeId
            });
        }

        for (const sedeId of sedesFaltantes) {
            if (!sedes.has(sedeId)) {
                sedes.set(sedeId, { id: sedeId, nombre: sedeId });
            }
        }
    }

    return Array.from(sedes.values());
}

async function construirPacienteOutput(paciente, empresa) {
    const sedesAsociadas = await obtenerSedesAsociadasPaciente(paciente);

    return {
        id: paciente.id,
        key: paciente.pkey,
        sedeId: paciente.sede_id,
        sedesAsociadas,
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
        },
        informacionEmpresa: empresa ? {
            referidoEmpresa: true,
            empresaRif: empresa.rif,
            empresaNombre: empresa.nombre,
            empresaDireccion: empresa.direccion,
            empresaCorreo: empresa.correo,
            empresaTelefono: empresa.telefono
        } : {
            referidoEmpresa: false
        }
    };
}

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
        'patologias' in objeto
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