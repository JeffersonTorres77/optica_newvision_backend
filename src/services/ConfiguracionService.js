const Configuracion = require("../models/Configuracion");
const Producto = require("../models/Producto");
const Tasa = require("../models/Tasa");
const FormatUtils = require("../utils/FormatUtils");

const ConfiguracionService = {
    get_or_create_configuracion: async function (sede_id, clave, valor_default = '', descripcion = '') {
        let configuracion = await Configuracion.findOne({ where: { sede: sede_id, clave } });
        if (!configuracion) {
            configuracion = await Configuracion.create({
                sede: sede_id,
                clave,
                valor: valor_default,
                descripcion
            });
        }
        return configuracion;
    },

    upsert_configuracion: async function (sede_id, clave, valor, descripcion, transaction = undefined) {
        let configuracion = await Configuracion.findOne({ where: { sede: sede_id, clave } });

        if (!configuracion) {
            configuracion = await Configuracion.create({
                sede: sede_id,
                clave,
                valor,
                descripcion
            }, transaction ? { transaction } : undefined);
        } else {
            configuracion.valor = valor;
            configuracion.descripcion = descripcion;
            await configuracion.save(transaction ? { transaction } : undefined);
        }

        return configuracion;
    },

    get_correos_notificacion: async function (sede_id) {
        const correo_notificacion_1 = await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'correo_notificacion_1',
            '',
            `Correo de notificacion 1 para la sede ${sede_id}`
        );

        const correo_notificacion_2 = await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'correo_notificacion_2',
            '',
            `Correo de notificacion 2 para la sede ${sede_id}`
        );

        const correo_notificacion_destino = await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'correo_notificacion_destino',
            'principal',
            `Destino de correo de notificacion para la sede ${sede_id}`
        );

        return { correo_notificacion_1, correo_notificacion_2, correo_notificacion_destino };
    },

    get_moneda_base: async function (sede_id) {
        return await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'moneda_base',
            'dolar',
            'Moneda base del sistema.'
        );
    },

    actualizar_monedas_productos: async function (sede_id, objTasa, transaction) {
        const productos = await Producto.findAll({ where: { sede_id: sede_id } });
        for (let producto of productos) {
            const objTasaPoducto = await Tasa.findOne({ where: { id: producto.moneda } });
            if (!objTasaPoducto) {
                throw { message: `La tasa ${producto.moneda} no existe.` };
            }

            producto.precio_con_iva = FormatUtils.float(((producto.precio_con_iva * objTasaPoducto.valor) / objTasa.valor));
            producto.precio = FormatUtils.float(((100 / 116) * producto.precio_con_iva));
            producto.moneda = objTasa.id;
            await producto.save({ transaction });
        }
    },

    get_costos_consultas: async function (sede_id) {
        let costo_total_consulta = await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'costo_total_consulta',
            '40',
            'Costo total de las consultas'
        );

        let costo_medico_consulta = await ConfiguracionService.get_or_create_configuracion(
            sede_id,
            'costo_medico_consulta',
            '20',
            'Costo de consulta del medico'
        );

        return { costo_total_consulta, costo_medico_consulta };
    }
};

module.exports = ConfiguracionService;