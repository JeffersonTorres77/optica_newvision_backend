const Cliente = require('../models/Cliente');
const Empresa = require('../models/Empresa');
const Paciente = require('../models/Paciente');
const PacienteSede = require('../models/PacienteSede');
const VerificationUtils = require('../utils/VerificationUtils');
const { Op } = require('sequelize');

const ClienteController = {
    add: async (req, res) => {
        const {
            cedula,
            nombre,
            telefono,
            email
        } = req.body;

        if (telefono && !VerificationUtils.verify_telefono(telefono)) {
            throw { message: "El telefono debe contener 11 digitos." };
        }
        if (email && !VerificationUtils.verify_correo(email)) {
            throw { message: "El correo no es valido." };
        }

        // Validar existencia previa por cédula en la misma sede
        const existingCliente = await Cliente.findOne({
            where: { cedula: cedula }
        });

        if (existingCliente) {
            throw { message: `Ya existe un cliente con la cédula ${cedula}.` };
        }

        const newCliente = await Cliente.create({
            sede_id: req.sede.id,
            cedula,
            nombre,
            telefono: telefono || null,
            email: email || null
        });

        res.status(200).json({ message: 'ok', cliente: newCliente });
    },

    get: async (req, res) => {
        const cedula = req.query.cedula;

        if (!cedula) {
            throw { message: 'La cédula es requerida.' };
        }

        // Objeto de salida
        let existen_datos = false;
        const datos = {
            cedula: null,
            nombre: null,
            telefono: null,
            email: null,
            es_paciente: false,
            pacienteKey: null,
            pacienteId: null,
            pacienteSedeId: null,
            informacionEmpresa: {
                referidoEmpresa: false,
                empresaRif: null,
                empresaNombre: null,
                empresaDireccion: null,
                empresaCorreo: null,
                empresaTelefono: null
            }
        };

        const cliente = await Cliente.findOne({ where: { cedula: cedula } });
        const paciente = await Paciente.findOne({
            where: { cedula: cedula },
            include: [{ model: Empresa, as: 'empresa' }]
        });

        if (cliente || paciente) {
            existen_datos = true;
        }

        if (cliente) {
            datos.cedula = cliente.cedula;
            datos.nombre = cliente.nombre;
            datos.telefono = cliente.telefono;
            datos.email = cliente.email;
        } else if (paciente) {
            datos.cedula = paciente.cedula;
            datos.nombre = paciente.nombre;
            datos.telefono = paciente.telefono;
            datos.email = paciente.email;
        }

        if (paciente) {
            datos.es_paciente = true;
            datos.pacienteKey = paciente.pkey || null;
            datos.pacienteId = paciente.id ? String(paciente.id) : null;
            datos.pacienteSedeId = paciente.sede_id || null;
            if (paciente.empresa) {
                const empresa = paciente.empresa;
                datos.informacionEmpresa.referidoEmpresa = true;
                datos.informacionEmpresa.empresaRif = paciente.empresa_rif;
                datos.informacionEmpresa.empresaNombre = (empresa.nombre) ? empresa.nombre : null;
                datos.informacionEmpresa.empresaDireccion = (empresa.direccion) ? empresa.direccion : null;
                datos.informacionEmpresa.empresaCorreo = (empresa.correo) ? empresa.correo : null;
                datos.informacionEmpresa.empresaTelefono = (empresa.telefono) ? empresa.telefono : null;
            }
        }

        res.status(200).json({ message: 'ok', cedula: cedula, cliente: datos });
    },

    update: async (req, res) => {
        const { cedula } = req.params;
        const {
            nombre,
            telefono,
            email
        } = req.body;

        const cliente = await Cliente.findOne({
            where: { cedula }
        });

        if (!cliente) {
            throw { message: "Cliente no encontrado." };
        }

        if (telefono && !VerificationUtils.verify_telefono(telefono)) {
            throw { message: "El telefono debe contener 11 digitos." };
        }
        if (email && !VerificationUtils.verify_correo(email)) {
            throw { message: "El correo no es valido." };
        }

        if (nombre) cliente.nombre = nombre;
        if (telefono !== undefined) cliente.telefono = telefono || null;
        if (email !== undefined) cliente.email = email || null;

        await cliente.save();

        res.status(200).json({ message: 'ok', cliente });
    },

    delete: async (req, res) => {
        const { cedula } = req.params;

        const cliente = await Cliente.findOne({
            where: { cedula }
        });

        if (!cliente) {
            throw { message: "Cliente no encontrado." };
        }

        await cliente.destroy();

        res.status(200).json({ message: 'ok' });
    }
};

module.exports = ClienteController;
