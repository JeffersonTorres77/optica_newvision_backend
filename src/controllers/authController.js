const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HashUtils = require('../utils/HashUtil');
const VerificationUtils = require('../utils/VerificationUtils');
const EnvioCorreo = require('./../config/correo');
const FilesUtils = require('../utils/FilesUtils');
const path = require('path');
const Rol = require('./../models/Rol');
const Usuario = require('../models/Usuario');
const Sede = require('../models/Sede');
const Login = require('../models/Login');

const authController = {
  login: async (req, res) => {
    const { sede: sede_key, cedula, password } = req.body;

    /**
     * Validamos los datos
     */
    if (sede_key.trim().length === 0) {
      throw { message: "La sede no puede estar vacia." };
    }
    if (cedula.trim().length === 0 || !VerificationUtils.verify_cedula(cedula)) {
      throw { message: "La cedula no puede estar vacio." };
    }
    if (password.trim().length === 0 || !VerificationUtils.verify_clave(password)) {
      throw { message: "La contraseña debe tener al menos 6 caracteres." };
    }

    /**
     * Verificar si el usuario existe
     */
    const sede = await Sede.findOne({ where: { id: sede_key } });
    if (!sede) {
      throw { message: "Sede no existe." };
    }
    const user = await Usuario.findOne({ where: { cedula: cedula }, include: ['rol', 'cargo'] });
    if (!user) {
      throw { message: "Credenciales inválidas." };
    }

    /**
     * Verificar la contraseña
     */
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw { message: "Credenciales inválidas." };
    }

    /**
     * Verificar status
     */
    if (!user.activo) {
      throw { message: "Usuario inactivo." };
    }

    /**
     * Generar un token JWT
     */
    const token = jwt.sign({ sede_id: sede.id, userCedula: user.cedula }, process.env.JWT_SECRET, { expiresIn: '24h' });

    /**
     * Guardamos el inicio de sesion
     */
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await Login.create({
      sede_id: sede.id,
      usu_cedula: user.cedula,
      token: token,
      ip: ip,
    });

    /**
     * Fin
     */
    res.status(200).json({
      message: 'ok',
      token: token,
      user: {
        id: user.id,
        cedula: user.cedula,
        correo: user.correo,
        nombre: user.nombre,
        telefono: user.telefono,
        fecha_nacimiento: user.fecha_nacimiento,
        ruta_imagen: user.ruta_imagen,
        avatar_url: user.avatar_url,
        activo: user.activo,
      },
      rol: {
        key: user.rol.id,
        name: user.rol.nombre,
      },
      cargo: {
        key: user.cargo.id,
        name: user.cargo.nombre,
      },
      sede: {
        key: sede.id,
        nombre: sede.nombre
      },
    });
  },

  get_data: async (req, res) => {
    try {
      if(!req.user) {
        throw "";
      }

      const sede = req.sede;
      const user = req.user;

      res.status(200).json({ user: {
        id: user._id,
        cedula: user.cedula,
        correo: user.correo,
        nombre: user.nombre,
        telefono: user.telefono,
        fecha_nacimiento: user.fecha_nacimiento,
        ruta_imagen: user.ruta_imagen,
        avatar_url: user.avatar_url,
        activo: user.activo,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }, rol: {
        key: user.rol.id,
        name: user.rol.nombre,
      },
      cargo: {
        key: user.cargo.id,
        name: user.cargo.nombre,
      },
      sede: {
        key: sede.id,
        nombre: sede.nombre
      }, });
    } catch(err) {
      if(err != "") {
        console.log(err);
      }
      res.status(200).json({ user: null });
    }
  },

  forgot_password: async (req, res) => {
    const { email: correo } = req.body;

    /**
     * Validar correo
     */
    if (!VerificationUtils.verify_correo(correo)) {
      throw { message: "El correo no es valido." };
    }

    /**
     * Verificar si existe
     */
    const user = await Usuario.findOne({ where: { correo: correo } });
    if (!user) {
      throw { message: "El correo no esta registrado." };
    }

    if (!user.activo) {
      throw { message: "Usuario inactivo." };
    }

    /**
     * Generar clave aleatoria
     */
    const longitud = 8;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let random_password = '';

    for (let i = 0; i < longitud; i++) {
      const randomIndex = Math.floor(Math.random() * caracteres.length);
      random_password += caracteres[randomIndex];
    }
    const hashedPassword = await bcrypt.hash(random_password, 10);

    /**
     * Modificar usuario
     */
    user.password = hashedPassword;
    user.save();

    /**
     * Enviar correo con la clave temporal
     */
    let ruta_template = path.join(__dirname, '..', 'emails', 'templateForgotPassword.html');
    let contenido = FilesUtils.readfile(ruta_template)
      .replace('{{username}}', user.nombre)
      .replace('{{temporal_password}}', random_password)
    await EnvioCorreo.send(
      user.correo,
      'Cambio de contraseña',
      contenido
    );

    /**
     * Fin
     */
    res.status(200).json({ message: 'ok' });
  },
};

module.exports = authController;
