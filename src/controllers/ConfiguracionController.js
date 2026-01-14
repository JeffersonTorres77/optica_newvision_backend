const Tasa = require('../models/Tasa');
const ConfiguracionService = require('../services/ConfiguracionService');
const { sequelize } = require('../config/db');
const Configuracion = require('../models/Configuracion');

const ConfiguracionController = {
    get: async (req, res) => {
        const array_configuracion = await Configuracion.findAll({ where: { sede: req.sede.id } });
        const obj_output = {};
        array_configuracion.forEach(configuracion => {
            obj_output[configuracion.clave] = configuracion.valor;
        });
        res.status(200).json({ configuracion: obj_output });
    },

    consultar_moneda_base: async (req, res) => {
        const moneda_base = await ConfiguracionService.get_moneda_base(req.sede.id);
        res.status(200).json({ moneda_base: moneda_base.valor });
    },

    modificar_moneda_base: async (req, res) => {
        const {
            monedaBase
        } = req.body;

        const objTasa = await Tasa.findOne({ where: { id: monedaBase } });
        if (!objTasa) {
            throw { message: `La tasa ${monedaBase} no existe.` };
        }

        const t = await sequelize.transaction();
        let moneda_base;

        try {
            moneda_base = await ConfiguracionService.get_moneda_base(req.sede.id);
            moneda_base.valor = objTasa.id;
            await moneda_base.save({ transaction: t });

            await ConfiguracionService.actualizar_monedas_productos(req.sede.id, objTasa, t);

            await t.commit();
        }
        catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        res.status(200).json({ moneda_base: moneda_base.valor });
    },
};

module.exports = ConfiguracionController;
