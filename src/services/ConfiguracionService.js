const Configuracion = require("../models/Configuracion");
const Producto = require("../models/Producto");
const Tasa = require("../models/Tasa");
const FormatUtils = require("../utils/FormatUtils");

const ConfiguracionService = {
    get_moneda_base: async function (sede_id) {
        let moneda_base = await Configuracion.findOne({ where: { sede: sede_id, clave: 'moneda_base' } });
        if (!moneda_base) {
            moneda_base = await Configuracion.create({
                sede: sede_id,
                clave: 'moneda_base',
                valor: 'dolar',
                descripcion: 'Moneda base del sistema para la sede de ${req.sede.nombre}.'
            });
        }
        return moneda_base;
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
        let costo_total_consulta = await Configuracion.findOne({ where: { sede: sede_id, clave: 'costo_total_consulta' } });
        if (!costo_total_consulta) {
            costo_total_consulta = await Configuracion.create({
                sede: sede_id,
                clave: 'costo_total_consulta',
                valor: '40',
                descripcion: 'Costo total de las consultas'
            });
        }

        let costo_medico_consulta = await Configuracion.findOne({ where: { sede: sede_id, clave: 'costo_medico_consulta' } });
        if (!costo_medico_consulta) {
            costo_medico_consulta = await Configuracion.create({
                sede: sede_id,
                clave: 'costo_medico_consulta',
                valor: '20',
                descripcion: 'Costo de consulta del medico'
            });
        }

        return { costo_total_consulta, costo_medico_consulta };
    }
};

module.exports = ConfiguracionService;