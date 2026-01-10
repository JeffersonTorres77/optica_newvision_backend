// src/routes/index.js
const express = require('express');
const authController = require('./../controllers/authController');
const authMiddleware = require('./../middlewares/authMiddleware');
const noAuthMiddleware = require('../middlewares/noAuthMiddleware');
const accountController = require('../controllers/accountController');
const DateUtils = require('../utils/DateUtils');
const UsuarioController = require('../controllers/UsuarioController');
const RolController = require('../controllers/RolController');
const CargoController = require('../controllers/CargoController');
const TasasController = require('../controllers/TasasController');
const SedesController = require('../controllers/SedesController');
const PacienteController = require('../controllers/PacienteController');
const HistorialMedicoController = require('../controllers/HistorialMedicoController');
const ClienteController = require('../controllers/ClienteController');
const ProductoController = require('../controllers/ProductoController');
const EnvioCorreo = require('./../config/correo');
const CatchGeneric = require('../utils/CatchGeneric');
const VentaController = require('../controllers/VentaController');
const ConfiguracionController = require('../controllers/ConfiguracionController');
const OrdenTrabajoController = require('../controllers/OrdenTrabajoController');

const router = express.Router();

router.get('', (req, res) => {
  const ip = req.ip;
  const timestamp = Date.now();
  const date = DateUtils.getDate();
  res.json({ message: `Bienvenido a mi API`, ip, timestamp, date });
});

router.get('/send-email-test', async (req, res) => {
  try {
    await EnvioCorreo.send(
      'jefersonugas@gmail.com',
      'Prueba de envio de correo',
      'Prueba de envio de correo'
    );
    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});

/**
 * Auth
 */
router.get('/sedes-get', SedesController.get);

router.post('/auth/login', noAuthMiddleware, authController.login);
router.get('/auth/get_data', authMiddleware, authController.get_data);
router.post('/auth/forgot-password', noAuthMiddleware, authController.forgot_password);

router.post('/account/upload-profile-image', authMiddleware, accountController.upload_profile_image);
router.put('/account/remove-profile-image', authMiddleware, accountController.remove_profile_image);
router.post('/account/edit-profile', authMiddleware, accountController.edit_profile);
router.post('/account/change-password--send-otp', authMiddleware, accountController.change_password__send_otp);
router.post('/account/change-password--verify-otp', authMiddleware, accountController.change_password__verify_otp);
router.post('/account/change-password--change-password', authMiddleware, accountController.change_password__change_password);

router.get('/roles-get/:id?', authMiddleware, RolController.get);

router.get('/cargos-get/:id?', authMiddleware, CargoController.get);

router.get('/configuracion/moneda_base-get', authMiddleware, CatchGeneric(ConfiguracionController.consultar_moneda_base));
router.put('/configuracion/moneda_base-update', authMiddleware, CatchGeneric(ConfiguracionController.modificar_moneda_base));

router.get('/get-usuarios/:cedula?', authMiddleware, UsuarioController.get);
router.post('/add-usuarios/', authMiddleware, UsuarioController.add);
router.put('/update-usuarios/:cedula', authMiddleware, UsuarioController.update);
router.delete('/delete-usuarios/:cedula', authMiddleware, UsuarioController.delete);
router.put('/activar-usuarios/:cedula', authMiddleware, UsuarioController.activar);

router.get('/tasas/:id?', authMiddleware, TasasController.get);
router.put('/tasas-update/:id', authMiddleware, TasasController.update);
router.put('/tasas-update-with-bcv/:id?', authMiddleware, TasasController.update_with_bcv);
router.get('/get-tasa-bcv', TasasController.get_tasa_bcv);
router.get('/tasas-history/:id/:fecha_inicio?/:fecha_final?', authMiddleware, TasasController.get_history);
router.put('/tasas-rastreo-automatico/:id', authMiddleware, TasasController.rastreo_automatico);

router.get('/paciente-get/:id?', authMiddleware, PacienteController.get);
router.post('/paciente-add/', authMiddleware, PacienteController.add);
router.put('/paciente-update/:id?', authMiddleware, PacienteController.update);
router.delete('/paciente-delete/:id?', authMiddleware, PacienteController.delete);

router.get('/historial-medico-all/:id?', authMiddleware, HistorialMedicoController.get_all);
router.get('/historial-medico-paciente/:paciente_id', authMiddleware, HistorialMedicoController.get_paciente);
router.post('/historial-medico-add/', authMiddleware, HistorialMedicoController.add);
router.put('/historial-medico-update/:id?', authMiddleware, HistorialMedicoController.update);
router.delete('/historial-medico-delete/:id?', authMiddleware, HistorialMedicoController.delete);

router.get('/producto-get/:id?', authMiddleware, ProductoController.get);
router.get('/categorias-get', authMiddleware, ProductoController.get_categorias);
router.post('/producto-add', authMiddleware, ProductoController.add);
router.put('/producto-update/:id', authMiddleware, ProductoController.update);
router.delete('/producto-delete/:id', authMiddleware, ProductoController.delete);
router.put('/producto-remove-image/:id', authMiddleware, ProductoController.remove_image);

router.post('/ventas-add', authMiddleware, CatchGeneric(VentaController.add));
router.get('/ventas-get', authMiddleware, CatchGeneric(VentaController.get));
router.get('/ventas-get-total', authMiddleware, CatchGeneric(VentaController.get_total));
router.put('/ventas-anular/:venta_key', authMiddleware, CatchGeneric(VentaController.anular));
router.put('/ventas-abonar/:venta_key', authMiddleware, CatchGeneric(VentaController.abonar));

router.get('/clientes-get', authMiddleware, CatchGeneric(ClienteController.get));
router.post('/clientes-add', authMiddleware, CatchGeneric(ClienteController.add));
router.put('/clientes-update/:cedula', authMiddleware, CatchGeneric(ClienteController.update));
router.delete('/clientes-delete/:cedula', authMiddleware, CatchGeneric(ClienteController.delete));

router.get('/orden-trabajo-get', authMiddleware, CatchGeneric(OrdenTrabajoController.get));
router.put('/orden-trabajo-change-status', authMiddleware, CatchGeneric(OrdenTrabajoController.change_status));
router.put('/orden-trabajo-change-status-all', authMiddleware, CatchGeneric(OrdenTrabajoController.change_status_all));
router.put('/orden-trabajo-update-process', authMiddleware, CatchGeneric(OrdenTrabajoController.update_process));
router.put('/orden-trabajo-update-fecha-entrega-estimada', authMiddleware, CatchGeneric(OrdenTrabajoController.update_fecha_entrega_estimada));
router.put('/orden-trabajo-archive', authMiddleware, CatchGeneric(OrdenTrabajoController.archive));
router.put('/orden-trabajo-unarchive', authMiddleware, CatchGeneric(OrdenTrabajoController.unarchive));
router.put('/orden-trabajo-update-days-to-archive', authMiddleware, CatchGeneric(OrdenTrabajoController.update_days_to_archive));

module.exports = router;