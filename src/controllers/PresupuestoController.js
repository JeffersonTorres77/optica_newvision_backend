const PresupuestoService = require('../services/PresupuestoService');

const PresupuestoController = {
  get: async (req, res) => {
    const id = String(req.params.id || '').trim() || null;
    const output = await PresupuestoService.get(req, id);
    res.status(200).json(output);
  },

  add: async (req, res) => {
    const output = await PresupuestoService.add(req.body, req);
    res.status(200).json(output);
  },

  update: async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) {
      throw { message: 'Debe enviar el id del presupuesto en la URL.' };
    }

    const output = await PresupuestoService.update(id, req.body, req);
    res.status(200).json(output);
  },

  delete: async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) {
      throw { message: 'Debe enviar el id del presupuesto en la URL.' };
    }

    const output = await PresupuestoService.delete(id, req);
    res.status(200).json(output);
  },

  renovar: async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) {
      throw { message: 'Debe enviar el id del presupuesto en la URL.' };
    }

    const output = await PresupuestoService.renovar(id, req.body?.dias, req);
    res.status(200).json(output);
  },

  auto_archivar: async (req, res) => {
    const output = await PresupuestoService.autoArchivar(req.body?.dias, req);
    res.status(200).json(output);
  }
};

module.exports = PresupuestoController;