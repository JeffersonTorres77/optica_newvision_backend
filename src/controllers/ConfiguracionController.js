const Tasa = require('../models/Tasa');
const ConfiguracionService = require('../services/ConfiguracionService');
const { sequelize } = require('../config/db');
const Configuracion = require('../models/Configuracion');
const BancoReceptorConfig = require('../models/BancoReceptorConfig');
const MetodoPagoConfig = require('../models/MetodoPagoConfig');

function map_banco_output(banco) {
    return {
        codigo: banco.codigo,
        nombre: banco.nombre,
        scope: banco.scope,
        activo: !!banco.activo
    };
}

function parse_accounts(accounts) {
    if (!accounts) {
        return [];
    }

    try {
        const parsed = JSON.parse(accounts);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function map_metodo_output(metodo) {
    return {
        key: metodo.metodo_key,
        label: metodo.label,
        description: metodo.description,
        enabled: !!metodo.enabled,
        currency: metodo.currency,
        requiresReceiverAccount: !!metodo.requires_receiver_account,
        isCustom: !!metodo.is_custom,
        accounts: parse_accounts(metodo.accounts)
    };
}

const DESTINOS_CORREO_NOTIFICACION = new Set(['principal', 'secundario', 'ambos']);

function normalizar_destino_correo_notificacion(destino, correoSecundario = '') {
    const valor = `${destino || ''}`.trim().toLowerCase();
    const correoSecundarioNormalizado = `${correoSecundario || ''}`.trim();

    if (!DESTINOS_CORREO_NOTIFICACION.has(valor)) {
        return 'principal';
    }

    if (!correoSecundarioNormalizado && valor !== 'principal') {
        return 'principal';
    }

    return valor;
}

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

    get_costos_consultas: async (req, res) => {
        const { costo_total_consulta, costo_medico_consulta } = await ConfiguracionService.get_costos_consultas(req.sede.id);
        res.status(200).json({
            totalConsulta: costo_total_consulta.valor,
            costoMedico: costo_medico_consulta.valor,
            costoOptica: ''+(costo_total_consulta.valor - costo_medico_consulta.valor)+''
        });
    },

    correos_notificacion_get: async (req, res) => {
        const {
            correo_notificacion_1,
            correo_notificacion_2,
            correo_notificacion_destino
        } = await ConfiguracionService.get_correos_notificacion(req.sede.id);

        const destino = normalizar_destino_correo_notificacion(
            correo_notificacion_destino?.valor,
            correo_notificacion_2?.valor
        );

        res.status(200).json({
            message: 'Correos de notificacion obtenidos correctamente',
            configuracion: {
                correo_notificacion_1: correo_notificacion_1.valor,
                correo_notificacion_2: correo_notificacion_2.valor,
                correo_notificacion_destino: destino
            }
        });
    },

    correos_notificacion_update: async (req, res) => {
        const configuracionActual = await ConfiguracionService.get_correos_notificacion(req.sede.id);
        const payload = {};
        let correoNotificacion1 = `${configuracionActual.correo_notificacion_1?.valor || ''}`.trim();
        let correoNotificacion2 = `${configuracionActual.correo_notificacion_2?.valor || ''}`.trim();
        let destinoCorreo = `${configuracionActual.correo_notificacion_destino?.valor || 'principal'}`.trim().toLowerCase();

        if (Object.prototype.hasOwnProperty.call(req.body, 'correo_notificacion_1')) {
            correoNotificacion1 = String(req.body.correo_notificacion_1 || '').trim();
            payload.correo_notificacion_1 = correoNotificacion1;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'correo_notificacion_2')) {
            correoNotificacion2 = String(req.body.correo_notificacion_2 || '').trim();
            payload.correo_notificacion_2 = correoNotificacion2;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'correo_notificacion_destino')) {
            destinoCorreo = String(req.body.correo_notificacion_destino || '').trim().toLowerCase();
        }

        const destinoNormalizado = normalizar_destino_correo_notificacion(destinoCorreo, correoNotificacion2);

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'correo_notificacion_destino') ||
            Object.prototype.hasOwnProperty.call(req.body, 'correo_notificacion_2') ||
            destinoNormalizado !== `${configuracionActual.correo_notificacion_destino?.valor || 'principal'}`.trim().toLowerCase()
        ) {
            payload.correo_notificacion_destino = destinoNormalizado;
        }

        if (!Object.keys(payload).length) {
            throw { message: 'Debe enviar correo_notificacion_1, correo_notificacion_2 o correo_notificacion_destino en el body.' };
        }

        const t = await sequelize.transaction();

        try {
            for (const [clave, valor] of Object.entries(payload)) {
                await ConfiguracionService.upsert_configuracion(
                    req.sede.id,
                    clave,
                    valor,
                    `Configuracion ${clave} para la sede ${req.sede.id}`,
                    t
                );
            }

            await t.commit();
        }
        catch (error) {
            await t.rollback();
            throw { message: error.message || error.toString() };
        }

        const {
            correo_notificacion_1,
            correo_notificacion_2,
            correo_notificacion_destino
        } = await ConfiguracionService.get_correos_notificacion(req.sede.id);

        const destino = normalizar_destino_correo_notificacion(
            correo_notificacion_destino?.valor,
            correo_notificacion_2?.valor
        );

        res.status(200).json({
            message: 'Correos de notificacion actualizados correctamente',
            configuracion: {
                correo_notificacion_1: correo_notificacion_1.valor,
                correo_notificacion_2: correo_notificacion_2.valor,
                correo_notificacion_destino: destino
            }
        });
    },

    bancos_receptores_get: async (req, res) => {
        const bancos = await BancoReceptorConfig.findAll({
            where: { sede: req.sede.id },
            order: [['scope', 'ASC'], ['nombre', 'ASC']]
        });

        res.status(200).json({
            message: 'Catálogo de bancos disponible',
            bancos: bancos.map(map_banco_output)
        });
    },

    bancos_receptores_save: async (req, res) => {
        const codigo = String(req.body.codigo || '').trim();
        const nombre = String(req.body.nombre || '').trim();
        const scope = req.body.scope === 'international' ? 'international' : 'national';
        const activo = req.body.activo !== false;

        if (!codigo || !nombre) {
            throw { message: 'Los campos codigo y nombre son obligatorios.' };
        }

        const existe = await BancoReceptorConfig.findOne({
            where: { sede: req.sede.id, codigo }
        });

        if (existe) {
            throw { message: `El banco ${codigo} ya existe para la sede ${req.sede.id}.` };
        }

        const banco = await BancoReceptorConfig.create({
            sede: req.sede.id,
            codigo,
            nombre,
            scope,
            activo
        });

        res.status(200).json({
            message: 'Banco receptor guardado correctamente',
            banco: map_banco_output(banco)
        });
    },

    bancos_receptores_update: async (req, res) => {
        const codigo = String(req.params.codigo || '').trim();
        if (!codigo) {
            throw { message: 'Debe enviar el codigo del banco en la URL.' };
        }

        const banco = await BancoReceptorConfig.findOne({
            where: { sede: req.sede.id, codigo }
        });

        if (!banco) {
            throw { message: `No existe el banco ${codigo} para la sede ${req.sede.id}.` };
        }

        banco.nombre = String(req.body.nombre || banco.nombre).trim();
        banco.scope = req.body.scope === 'international' ? 'international' : 'national';
        banco.activo = req.body.activo !== false;
        await banco.save();

        res.status(200).json({
            message: 'Banco receptor actualizado correctamente',
            banco: map_banco_output(banco)
        });
    },

    metodos_pago_config_get: async (req, res) => {
        const metodos = await MetodoPagoConfig.findAll({
            where: { sede: req.sede.id },
            order: [['metodo_key', 'ASC']]
        });

        const ultimaActualizacion = metodos.length
            ? new Date(Math.max(...metodos.map(m => new Date(m.updated_at).getTime()))).toISOString()
            : null;

        res.status(200).json({
            message: 'Métodos de pago configurables obtenidos correctamente',
            metodos: metodos.map(map_metodo_output),
            ultimaActualizacion
        });
    },

    metodos_pago_config_save: async (req, res) => {
        const key = String(req.body.key || '').trim();
        if (!key) {
            throw { message: 'El campo key es obligatorio.' };
        }

        const existe = await MetodoPagoConfig.findOne({
            where: { sede: req.sede.id, metodo_key: key }
        });

        if (existe) {
            throw { message: `El método ${key} ya existe para la sede ${req.sede.id}.` };
        }

        const metodo = await MetodoPagoConfig.create({
            sede: req.sede.id,
            metodo_key: key,
            label: String(req.body.label || '').trim(),
            description: String(req.body.description || '').trim(),
            enabled: req.body.enabled !== false,
            currency: String(req.body.currency || '').trim(),
            requires_receiver_account: req.body.requiresReceiverAccount === true,
            is_custom: req.body.isCustom === true,
            accounts: JSON.stringify(Array.isArray(req.body.accounts) ? req.body.accounts : [])
        });

        res.status(200).json({
            message: 'Método de pago guardado correctamente',
            metodo: map_metodo_output(metodo),
            ultimaActualizacion: metodo.updated_at ? new Date(metodo.updated_at).toISOString() : new Date().toISOString()
        });
    },

    metodos_pago_config_update: async (req, res) => {
        const key = String(req.params.key || '').trim();
        if (!key) {
            throw { message: 'Debe enviar el key del método en la URL.' };
        }

        const metodo = await MetodoPagoConfig.findOne({
            where: { sede: req.sede.id, metodo_key: key }
        });

        if (!metodo) {
            throw { message: `No existe el método ${key} para la sede ${req.sede.id}.` };
        }

        metodo.label = String(req.body.label || metodo.label).trim();
        metodo.description = String(req.body.description || metodo.description).trim();
        metodo.enabled = req.body.enabled !== false;
        metodo.currency = String(req.body.currency || metodo.currency).trim();
        metodo.requires_receiver_account = req.body.requiresReceiverAccount === true;
        metodo.is_custom = req.body.isCustom === true;
        metodo.accounts = JSON.stringify(Array.isArray(req.body.accounts) ? req.body.accounts : []);
        await metodo.save();

        res.status(200).json({
            message: 'Método de pago actualizado correctamente',
            metodo: map_metodo_output(metodo),
            ultimaActualizacion: metodo.updated_at ? new Date(metodo.updated_at).toISOString() : new Date().toISOString()
        });
    },
};

module.exports = ConfiguracionController;
