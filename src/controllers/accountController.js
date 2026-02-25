const Rol = require('./../models/Rol');
const Otp = require('./../models/Otp');
const VerificationUtils = require('../utils/VerificationUtils');
const OtpUtils = require('../utils/OtpUtils');
const HashUtils = require('../utils/HashUtil');
const DateUtils = require('../utils/DateUtils');
const FilesUtils = require('../utils/FilesUtils');
const path = require('path');
const EnvioCorreo = require('./../config/correo');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { Op } = require('sequelize');
const upload = require('../config/uploader');
const multer = require('multer');

const accountController = {
  upload_profile_image: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    const objUser = await Usuario.findOne({ where: { cedula: req.user.cedula } });
    if (!objUser) {
      throw { message: "Usuario no encontrado." };
    }

    // Usamos el middleware de Multer para manejar la subida
    req.nombre_imagen = `profile-${objUser.cedula}`;
    upload.single('imagen')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: err.message });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo o el formato no es válido' });
      }

      // La imagen se guardó correctamente
      const imageUrl = `/public/images/${req.file.filename}`;

      objUser.ruta_imagen = imageUrl + "?t=" + Date.now();
      await objUser.save();

      res.status(200).json({ message: 'ok', image_url: objUser.ruta_imagen });
    });
  },

  remove_profile_image: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    const objUser = await Usuario.findOne({ where: { cedula: req.user.cedula } });
    if (!objUser) {
      throw { message: "Usuario no encontrado." };
    }

    objUser.ruta_imagen = null;
    await objUser.save();

    res.status(200).json({ message: 'ok' });
  },

  edit_profile: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    const {
      nombre,
      correo,
      telefono,
      fecha_nacimiento,
    } = req.body;

    /**
     * Validamos los datos
     */
    if (!VerificationUtils.verify_correo(correo)) {
      throw { message: "El correo no es valido." };
    }
    if (!VerificationUtils.verify_nombre(nombre)) {
      throw { message: "El nombre no puede estar vacio." };
    }
    if (!VerificationUtils.verify_telefono(telefono)) {
      throw { message: "El telefono debe contener 11 digitos." };
    }
    if (!VerificationUtils.verify_fecha(fecha_nacimiento)) {
      throw { message: "El formato de la fecha de nacimiento es erroneo." };
    }

    /**
     * Verificamos que el correo no exista
     */
    const existingEmail = await Usuario.count({ where: { cedula: { [Op.ne]: req.user.cedula }, correo: correo } }) > 0;
    if (existingEmail) {
      throw { message: "El correo ya esta registrado." };
    }

    /**
     * Modificamos los datos
     */
    const user = await Usuario.findOne({ where: { cedula: req.user.cedula } });
    if (!user) {
      throw { message: "Usuario no encontrado." };
    }
    user.nombre = nombre;
    user.correo = correo;
    user.telefono = telefono;
    user.fecha_nacimiento = fecha_nacimiento;
    user.save();

    /**
     * Fin
     */
    res.status(200).json({ message: 'ok' });
  },

  change_password__send_otp: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    /**
     * Generamos OTP
     */
    const otp = OtpUtils.GenerarOTP();
    const timestamp = Date.now();

    /**
     * Desactivamos los OTPs anteriores
     */
    const OtpsActivos = await Otp.findAll({ where: { usu_cedula: req.user.cedula, activo: true } });
    OtpsActivos.forEach(async (otp) => {
      otp.historial = [
        ...otp.historial,
        { accion: "cancelado", datetime: DateUtils.getDate() }
      ];
      otp.activo = false;
      await otp.save();
    });

    /**
     * Guardamos el OTP
     */
    let obj_otp = await Otp.create({
      usu_cedula: req.user.cedula,
      otp: otp,
      ip: req.ip,
      correo: req.user.correo,
      historial: [],
      activo: true,
      verificado: false
    });

    /**
     * Enviamos el correo
     */
    let ruta_template = path.join(__dirname, '..', 'emails', 'templateOpt.html');
    let contenido = FilesUtils.readfile(ruta_template)
      .replace('{{username}}', req.user.nombre)
      .replace('{{otp}}', obj_otp.otp)
    await EnvioCorreo.send(
      req.user.correo,
      'Cambio de contraseña',
      contenido
    );

    /**
     * Fin
     */
    res.status(200).json({ message: 'ok' });
  },

  change_password__verify_otp: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    const { otp } = req.body;

    /**
     * Validamos el OTP
     */
    if (!VerificationUtils.verify_otp(otp)) {
      throw { message: "Formato del OTP invalido." };
    }

    /**
     * Buscamos y verificamos el OTP
     */
    const obj_otp = await Otp.findOne({ where: { usu_cedula: req.user.cedula, activo: true } });
    if (!obj_otp) {
      throw { message: "OTP no encontrado." };
    }

    if (obj_otp.otp != otp) {
      obj_otp.historial = [
        ...obj_otp.historial,
        { accion: "erroneo", datetime: DateUtils.getDate() }
      ];
      throw { message: "OTP incorrecto." };
    }

    /**
     * Cambiamos el status
     */
    obj_otp.historial = [
      ...obj_otp.historial,
      { accion: "verificado", datetime: DateUtils.getDate() }
    ];
    obj_otp.verificado = true;
    obj_otp.save();

    /**
     * Fin
     */
    res.status(200).json({ message: 'ok' });
  },

  change_password__change_password: async (req, res) => {
    if (!req.user) {
      throw { message: "Sesion invalida." };
    }

    const { otp, newPassword: clave } = req.body;

    /**
     * Validamos la clave
     */
    if (!VerificationUtils.verify_clave(clave)) {
      throw { message: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (!VerificationUtils.verify_otp(otp)) {
      throw { message: "Formato del OTP invalido." };
    }

    /**
     * Encriptamos la clave
     */
    const hashedPassword = await bcrypt.hash(clave, 10);

    /**
     * Asignamos la clave
     */
    const objUser = await Usuario.findOne({ where: { cedula: req.user.cedula } });
    if (!objUser) {
      throw { message: "Usuario no encontrado." };
    }

    /**
     * Consultamos y validamos el status del otp
     */
    const obj_otp = await Otp.findOne({ where: { usu_cedula: req.user.cedula, activo: true } });
    if (!obj_otp) {
      throw { message: "Codigo OTP no encontrado." };
    }
    if (obj_otp.verificado === false) {
      throw { message: "Codigo OTP no verificado." };
    }
    if (obj_otp.activo === false) {
      throw { message: "Codigo OTP vencido." };
    }

    /**
     * Modificamos el OTP
     */
    obj_otp.historial = [
      ...obj_otp.historial,
      { accion: "desactivado", datetime: DateUtils.getDate() }
    ];
    obj_otp.activo = false;
    obj_otp.save();

    /**
     * Modificamos el usuario
     */
    objUser.password = hashedPassword;
    objUser.save();

    /**
     * Fin
     */
    res.status(200).json({ message: 'ok' });
  },
};

module.exports = accountController;
