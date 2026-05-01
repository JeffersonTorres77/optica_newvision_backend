const Rol = require('./../models/Rol');
const Usuario = require('../models/Usuario');
const Cargo = require('../models/Cargo');
const VerificationUtils = require('../utils/VerificationUtils');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');


const UsuarioController = {
    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const cedula = req.params.cedula;
        let usuarios = [];

        if (cedula) {
            usuarios = await Usuario.findAll({
                where: { cedula: cedula },
                attributes: ['id','cedula','nombre','correo','telefono','fecha_nacimiento','ruta_imagen','avatar_url','activo','created_at','updated_at'],
                include: ['rol','cargo']
            });
        } else {
            usuarios = await Usuario.findAll({
                attributes: ['id','cedula','nombre','correo','telefono','fecha_nacimiento','ruta_imagen','avatar_url','activo','created_at','updated_at'],
                include: ['rol','cargo']
            });
        }

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok', usuarios: usuarios });
    },
    add: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const {
            rolId: rol_id,
            cargoId: cargo_id,
            cedula: cedula,
            nombre: nombre_temp,
            email: correo_temp,
            phone: telefono_temp,
            fechaRegistro: fecha_nacimiento_temp,
        } = req.body;

        const nombre = (nombre_temp == "") ? null : nombre_temp;
        const correo = (correo_temp == "") ? null : correo_temp;
        const telefono = (telefono_temp == "") ? null : telefono_temp;
        const fecha_nacimiento = (fecha_nacimiento_temp == "") ? null : fecha_nacimiento_temp;

        /**
         * Validamos los datos
         */
        if (!VerificationUtils.verify_cedula(cedula)) {
            throw { message: "La cedula no es valida." };
        }
        if (nombre != null && !VerificationUtils.verify_nombre(nombre)) {
            throw { message: "El nombre no puede estar vacio." };
        }
        if (correo != null && !VerificationUtils.verify_correo(correo)) {
            throw { message: "El correo no es valido." };
        }
        if (telefono != null && !VerificationUtils.verify_telefono(telefono)) {
            throw { message: "El telefono debe contener 11 digitos." };
        }
        if (fecha_nacimiento != null && !VerificationUtils.verify_fecha(fecha_nacimiento)) {
            throw { message: "La fecha no tiene el formato correcto" };
        }

        /**
         * Verificamos los datos
         */
        // Rol
        const rol = await Rol.findOne({ where: { id: rol_id } });
        if (!rol) {
            throw { message: `Rol no encontrado: '${rol_id}'.` };
        }

        // Cargo
        const cargo = await Cargo.findOne({ where: { id: cargo_id } });
        if (!cargo) {
            throw { message: `Cargo no encontrado: '${cargo_id}'.` };
        }

        // Cedula
        const existingUser = await Usuario.count({ where: { cedula: cedula } }) > 0;
        if (existingUser) {
            throw { message: "El numero de cedula ya esta registrado." };
        }

        // Correo
        if(correo != null) {
            const existingEmail = await Usuario.count({ where: { correo: correo } }) > 0;
            if (existingEmail) {
                throw { message: "El correo ya esta registrado." };
            }
        }


        /**
         * Encriptar la contraseña
         */
        const hashedPassword = await bcrypt.hash(cedula, 10);

        let user = await Usuario.findOne({
            where: { cedula: cedula },
            paranoid: false
        });
        
        /**
         * Rehusamos el usuario
         */
        if(user) {
            await user.restore();
            user.rol_id = rol.id;
            user.cargo_id = cargo.id;
            user.cedula = cedula;
            user.nombre = nombre;
            user.correo = correo;
            user.telefono = telefono;
            user.fecha_nacimiento = fecha_nacimiento;
            await user.save();

            await Usuario.update(
                { created_at: new Date() },
                { where: { cedula: user.cedula }, individualHooks: false }
            );
        }
        /**
         * Crear el usuario
         */
        else {
            user = await Usuario.create({
                rol_id: rol.id,
                cargo_id: cargo.id,
                cedula: cedula,
                nombre: nombre,
                correo: correo,
                telefono: telefono,
                fecha_nacimiento: fecha_nacimiento,
                password: hashedPassword,
                activo: true,
            });
        }

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok', cedula: user.cedula, nombre: user.nombre });
    },
    update: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }
        
        const cedula = req.params.cedula;

        const {
            rolId: rol_id,
            cargoId: cargo_id,
            cedula: nueva_cedula,
            nombre: nombre_temp,
            email: correo_temp,
            fechaRegistro: fecha_nacimiento_temp,
        } = req.body;

          
        const nombre = (nombre_temp == "") ? null : nombre_temp;
        const correo = (correo_temp == "") ? null : correo_temp;
        const fecha_nacimiento = (fecha_nacimiento_temp == "") ? null : fecha_nacimiento_temp;

        if(req.user.cedula == cedula && rol_id != 'admin') {
            throw { message: "No se puede cambiar el rol de admin al usuario actual." };
        }

        /**
         * Validamos los datos
         */
        const user = await Usuario.findOne({ where: { cedula: cedula } });
        if (!user) {
            throw { message: "Usuario no encontrado." };
        }
        if (!VerificationUtils.verify_cedula(nueva_cedula)) {
            throw { message: "La cedula no es valida." };
        }
        if (nombre != null && !VerificationUtils.verify_nombre(nombre)) {
            throw { message: "El nombre no puede estar vacio." };
        }
        if (correo != null && !VerificationUtils.verify_correo(correo)) {
            throw { message: "El correo no es valido." };
        }
        if (fecha_nacimiento != null && !VerificationUtils.verify_fecha(fecha_nacimiento)) {
            throw { message: "La fecha no tiene el formato correcto" };
        }

        /**
         * Verificamos datos
         */
        // Rol
        const rol = await Rol.findOne({ where: { id: rol_id } });
        if (!rol) {
            throw { message: `Rol no encontrado: '${rol_id}'.` };
        }

        // Cargo
        const cargo = await Cargo.findOne({ where: { id: cargo_id } });
        if (!cargo) {
            throw { message: `Cargo no encontrado: '${cargo_id}'.` };
        }

        // Cedula
        if(cedula != nueva_cedula) {
            const existe_cedula = await Usuario.count({ where: { cedula: nueva_cedula } }) > 0;
            if (existe_cedula) {
                throw { message: `Ya existe un usuario con el numero de cedula enviado: ${nueva_cedula}.` };
            }
        }

        // Correo
        if(correo != null) {
            const existe_correo = await Usuario.count({ where: { cedula: { [Op.ne]: cedula }, correo: correo } }) > 0;
            if (existe_correo) {
                throw { message: `Ya existe un usuario con el correo enviado: ${correo}.` };
            }
        }

        /**
         * Modificamos los datos
         */
        user.rol_id = rol.id;
        user.cargo_id = cargo.id;
        user.cedula = nueva_cedula;
        user.nombre = nombre;
        user.correo = correo;
        user.fecha_nacimiento = fecha_nacimiento;
        await user.save();

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok' });
    },
    delete: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const cedula = req.params.cedula;

        if(req.user.cedula == cedula) {
            throw { message: "No se puede eliminar el usuario actual." };
        }
        
        const user = await Usuario.findOne({ where: { cedula: cedula } });
        if (!user) {
            throw { message: "Usuario no encontrado." };
        }
        await user.destroy();

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok' });
    },
    activar: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }
        
        const cedula = req.params.cedula;

        const {
            estatus: activar
        } = req.body;

        if(req.user.cedula == cedula) {
            throw { message: "No se puede cambiar el estatus al usuario actual." };
        }

        /**
         * Validamos los datos
         */
        const user = await Usuario.findOne({ where: { cedula: cedula } });
        if (!user) {
            throw { message: "Usuario no encontrado." };
        }
        if (typeof activar !== 'boolean') {
            throw { message: "El valor del estatus debe ser booleano. " };
        }

        /**
         * Modificamos los datos
         */
        user.activo = activar;
        await user.save();

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok' });
    },
};

module.exports = UsuarioController;