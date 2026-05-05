const CierreCajaService = require('../services/CierreCajaService');

const CierreCajaController = {
  resumen: async (req, res) => {
    const fecha = req.query.fecha;
    const sedeId = await CierreCajaService.resolverSedeOperacion(req, req.query.sede, true);
    const fechaNormalizada = CierreCajaService.normalizarFecha(fecha);
    const output = await CierreCajaService.obtenerResumenDiario(fechaNormalizada, sedeId);
    res.status(200).json(output);
  },

  publico: async (req, res) => {
    const output = await CierreCajaService.obtenerResumenPublicoPorToken(req.query.token);
    res.status(200).json(output);
  },

  apertura: async (req, res) => {
    const output = await CierreCajaService.abrirCaja(req.body, req);
    res.status(200).json(output);
  },

  transaccion_manual_add: async (req, res) => {
    const cierreId = String(req.body.cierreId || '').trim();
    if (!cierreId) {
      throw { message: 'El campo cierreId es obligatorio.' };
    }

    const output = await CierreCajaService.crearTransaccionManual(cierreId, req.body, req);
    res.status(200).json(output);
  },

  transaccion_manual_update: async (req, res) => {
    const transaccionId = String(req.params.id || '').trim();
    if (!transaccionId) {
      throw { message: 'Debe enviar el id de la transacción en la URL.' };
    }

    const output = await CierreCajaService.actualizarTransaccionManual(transaccionId, req.body, req);
    res.status(200).json(output);
  },

  cerrar: async (req, res) => {
    const output = await CierreCajaService.cerrarCaja(req.body, req);
    res.status(200).json(output);
  },

  historial: async (req, res) => {
    const fechaInicio = req.query.fechaInicio;
    const fechaFin = req.query.fechaFin;

    if (!fechaInicio || !fechaFin) {
      throw { message: 'Los parámetros fechaInicio y fechaFin son obligatorios.' };
    }

    const output = await CierreCajaService.obtenerHistorial(fechaInicio, fechaFin, req);
    res.status(200).json(output);
  },

  anular: async (req, res) => {
    const cierreId = String(req.params.id || '').trim();
    if (!cierreId) {
      throw { message: 'Debe enviar el id del cierre en la URL.' };
    }

    const motivo = String(req.body.motivo || '').trim();
    if (!motivo) {
      throw { message: 'El motivo de anulación es obligatorio.' };
    }

    const output = await CierreCajaService.anularCierre(cierreId, motivo, req);
    res.status(200).json(output);
  }
};

module.exports = CierreCajaController;