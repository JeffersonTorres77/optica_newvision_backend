const Tasa = require("../models/Tasa");
const VerificationUtils = require("../utils/VerificationUtils");
const axios = require('axios');
const cheerio = require('cheerio');
const { Op } = require('sequelize');
const TasaHistorial = require("../models/TasaHistorial");
const Usuario = require("../models/Usuario");

const TasasController = {
    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        await asegurar_existencia_tasas();
        
        const id = req.params.id;
        let tasas = [];
        
        // Consultamos las tasas
        if (id) {
            tasas = await Tasa.findAll({
                where: { id: id },
                attributes: ['id','nombre','simbolo','valor','rastreo_bcv','ultimo_tipo_cambio','updated_at']
            });
        } else {
            tasas = await Tasa.findAll({
                attributes: ['id','nombre','simbolo','valor','rastreo_bcv','ultimo_tipo_cambio','updated_at']
            });
        }

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok', tasas: tasas });
    },
    
    update: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        await asegurar_existencia_tasas();

        const id = req.params.id;
        const {
            valor: valor,
        } = req.body;

        const objTasa = await Tasa.findOne({ where: { id: id } });
        if(!objTasa) {
            throw { message: `La tasa enviada no existe: '${id}'` };
        }
        if(!VerificationUtils.verify_numero(valor)) {
            throw { message: `El valor enviado no es numerico: '${valor}'` };
        }

        let valor_numerico = Number(valor);
        valor_numerico = Number(valor_numerico.toFixed(4));

        const valor_anterior = objTasa.valor;

        objTasa.valor = valor_numerico;
        objTasa.rastreo_bcv = false;
        objTasa.ultimo_tipo_cambio = "Manual";
        await objTasa.save();

        await TasaHistorial.create({
            tasa_id: id,
            valor_nuevo: valor,
            usu_cedula: req.user.cedula,
            tipo_cambio: 'manual',
        });
        
        res.status(200).json({ message: 'ok', tasa: objTasa });
    },
    
    update_with_bcv: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;

        await asegurar_existencia_tasas();
        const tasas_bcv = await obtenerDolarBCV();
        if(typeof tasas_bcv === 'string') {
            throw { message: tasas_bcv };
        }

        let tasas_cambio = ['dolar', 'euro'];

        if(id) {
            const objTasaCambio = await Tasa.findOne({ where: { id: id } });
            if(!objTasaCambio) {
                throw { message: `La tasa enviada no existe: '${id}'` };
            }
            tasas_cambio = [objTasaCambio.id];
        }
        
        for(const tasa_id of tasas_cambio) {
            const objTasa = await Tasa.findOne({ where: { id: tasa_id } });

            let valor_numerico = Number(tasas_bcv[tasa_id]);
            valor_numerico = Number(valor_numerico.toFixed(4));

            const valor_anterior = objTasa.valor;

            objTasa.valor = valor_numerico;
            objTasa.ultimo_tipo_cambio = 'Manual con BCV';
            await objTasa.save();

            await TasaHistorial.create({
                tasa_id: objTasa.id,
                valor_nuevo: objTasa.valor,
                usu_cedula: req.user.cedula,
                tipo_cambio: 'manual con BCV',
            });
        }
        
        const tasas = await Tasa.findAll({
            where: { id: { [Op.in]: tasas_cambio } },
            attributes: ['id', 'nombre', 'simbolo', 'valor', 'rastreo_bcv', 'updated_at']
        });

        res.status(200).json({ message: 'ok', tasa: tasas });
    },

    get_tasa_bcv: async (req, res) => {
        const tasas_bcv = await obtenerDolarBCV();
        if(typeof tasas_bcv === 'string') {
            throw { message: tasas_bcv };
        }

        let tasas = {
            dolar: 0,
            euro: 0
        };
        for(const tasa_id of ['dolar', 'euro']) {
            let valor_numerico = Number(tasas_bcv[tasa_id]);
            valor_numerico = Number(valor_numerico.toFixed(4));

            tasas[tasa_id] = valor_numerico;
        }

        res.status(200).json({ message: 'ok', tasa: tasas });
    },

    get_history: async(req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;
        let fecha_inicio = req.params.fecha_inicio;
        let fecha_final = req.params.fecha_final;

        const objTasa = await Tasa.findOne({ where: { id: id } });
        if(!objTasa) {
            throw { message: `La tasa enviada no existe: '${id}'` };
        }

        let historial = [];

        if(fecha_inicio && fecha_final) {
            if (!VerificationUtils.verify_fecha(fecha_inicio)) {
                throw { message: "La fecha de inicio no tiene el formato correcto." };
            }
            if (!VerificationUtils.verify_fecha(fecha_final)) {
                throw { message: "La fecha final no tiene el formato correcto." };
            }
            if(fecha_inicio > fecha_final) {
                throw { message: "La fecha de inicio tiene que ser menor o igual que la fecha final." };
            }

            fecha_inicio = `${fecha_inicio} 00:00:00`;

            fecha_final = `${fecha_final} 23:59:59`;

            historial = await TasaHistorial.findAll({
                where: { tasa_id : objTasa.id, created_at: { [Op.between]: [fecha_inicio, fecha_final] } },
                attributes: ['id','valor_nuevo','tipo_cambio','updated_at'],
                include: {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['cedula', 'nombre']
                }
            });
        } else {
            historial = await TasaHistorial.findAll({
                where: { tasa_id : objTasa.id },
                attributes: ['id','valor_nuevo','tipo_cambio','updated_at'],
                include: {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['cedula', 'nombre']
                }
            });
        }
        
        res.status(200).json({ message: 'ok', historial: historial});
    },

    rastreo_automatico: async(req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;
        const {
            rastrear_auto: activar,
        } = req.body;

        const objTasa = await Tasa.findOne({ where: { id: id } });
        if(!objTasa) {
            throw { message: `La tasa enviada no existe: '${id}'` };
        }
        if (typeof activar !== 'boolean') {
            throw { message: "El valor del rastreo debe ser booleano. " };
        }

        objTasa.rastreo_bcv = activar;
        await objTasa.save();

        if(activar && ['dolar','euro'].includes(objTasa.id)) {
            const tasas_bcv = await obtenerDolarBCV();
            if(typeof tasas_bcv === 'string') {
                // throw { message: tasas_bcv };
                res.status(201).json({ message: 'El rastreo automatico se activo pero no se pudo actualizar ahora mismo con el BCV.', tasa: objTasa });
                return;
            }

            let valor_numerico = Number(tasas_bcv[objTasa.id]);
            valor_numerico = Number(valor_numerico.toFixed(4));
            objTasa.valor = valor_numerico;
            objTasa.ultimo_tipo_cambio = "Automatico";
            await objTasa.save();
        }
        
        res.status(200).json({ message: 'ok', tasa: objTasa });
    },
};

async function asegurar_existencia_tasas() {
    // Creamos las tasas si no existen
    const tasas_existentes = ['dolar','euro'];
    for(const tasa_existente of tasas_existentes) {
        const existingTasa = await Tasa.count({ where: { id: tasa_existente } }) > 0;
        if (!existingTasa) {
            const objTasa = await Tasa.create({
                id: tasa_existente,
                nombre: tasa_existente,
                simbolo: "$",
                valor: 1,
                rastreo_bcv: 0,
            });
        }
    }
}

async function obtenerDolarBCV() {
  try {
    let output = { dolar: "", euro: "" };

    // Hacer la solicitud HTTP
    const { data } = await axios.get('https://www.bcv.org.ve/', {
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // Ignorar verificación SSL
    });

    // Cargar el HTML en Cheerio
    const $ = cheerio.load(data);

    // Extraer el contenido del elemento con id "dolar"
    const valor_dolar = $('#dolar .centrado').text().trim();
    output.dolar = valor_dolar.replace(',','.');
    
    const valor_euro = $('#euro .centrado').text().trim();
    output.euro = valor_euro.replace(',','.');

    return output;
  } catch (error) {
    console.error(`Error al obtener el valor de las tasas: ${error}`);
    return `Error al obtener el valor de las tasas.`;
  }
}

module.exports = TasasController;