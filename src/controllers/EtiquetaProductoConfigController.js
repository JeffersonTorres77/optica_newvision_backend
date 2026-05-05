const EtiquetaProductoConfig = require('../models/EtiquetaProductoConfig');
const Sede = require('../models/Sede');

const DEFAULT_FIELDS = [
    { key: 'codigo', label: 'Codigo', enabled: true, order: 0 },
    { key: 'nombre', label: 'Nombre', enabled: true, order: 1 },
    { key: 'marca', label: 'Marca', enabled: false, order: 2 },
    { key: 'precio', label: 'Precio', enabled: true, order: 3 }
];

function clone_default_fields() {
    return DEFAULT_FIELDS.map((field) => ({ ...field }));
}

function parse_fields(fields) {
    if (!fields) {
        return clone_default_fields();
    }

    try {
        const parsed = JSON.parse(fields);
        return Array.isArray(parsed) ? parsed : clone_default_fields();
    } catch (_) {
        return clone_default_fields();
    }
}

function normalize_field(field, index) {
    const key = String(field?.key || '').trim();
    const label = String(field?.label || '').trim();

    if (!key || !label) {
        throw { message: `Cada item de fields debe incluir key y label. Error en posicion ${index}.` };
    }

    return {
        key,
        label,
        enabled: field?.enabled !== false,
        order: Number.isInteger(field?.order) ? field.order : index
    };
}

function normalize_fields(fields) {
    if (!Array.isArray(fields) || !fields.length) {
        throw { message: 'El campo fields debe ser un arreglo con al menos un elemento.' };
    }

    return fields.map(normalize_field);
}

function normalize_positive_integer(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw { message: `El campo ${fieldName} debe ser un entero mayor a 0.` };
    }

    return parsed;
}

function normalize_nullable_integer(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw { message: `El campo ${fieldName} debe ser null o un entero mayor o igual a 0.` };
    }

    return parsed;
}

function map_config_output(config) {
    return {
        sede: config.sede,
        fields: parse_fields(config.fields),
        columns: config.columns,
        labelWidthMm: config.label_width_mm,
        labelHeightMm: config.label_height_mm,
        showBorder: !!config.show_border,
        cantidadMasivaDefault: config.cantidad_masiva_default,
        updatedAt: config.updated_at
    };
}

async function resolve_sede_or_fail(sede) {
    const sedeId = String(sede || '').trim();

    if (!sedeId) {
        throw { message: 'Debe enviar la sede.' };
    }

    const sedeModel = await Sede.findByPk(sedeId);
    if (!sedeModel) {
        throw { message: `La sede ${sedeId} no existe.` };
    }

    return sedeId;
}

async function get_or_create_config(sede) {
    const [config] = await EtiquetaProductoConfig.findOrCreate({
        where: { sede },
        defaults: {
            sede,
            fields: JSON.stringify(clone_default_fields()),
            columns: 3,
            label_width_mm: 63,
            label_height_mm: 34,
            show_border: true,
            cantidad_masiva_default: 2
        }
    });

    return config;
}

const EtiquetaProductoConfigController = {
    get: async (req, res) => {
        const sede = await resolve_sede_or_fail(req.query.sede || req.sede?.id);
        const config = await get_or_create_config(sede);

        res.status(200).json({
            message: 'Configuración de etiquetas obtenida correctamente',
            configuracion: map_config_output(config)
        });
    },

    update: async (req, res) => {
        const sede = await resolve_sede_or_fail(req.body.sede || req.sede?.id);
        const fields = normalize_fields(req.body.fields);
        const columns = normalize_positive_integer(req.body.columns, 'columns');
        const labelWidthMm = normalize_positive_integer(req.body.labelWidthMm, 'labelWidthMm');
        const labelHeightMm = normalize_positive_integer(req.body.labelHeightMm, 'labelHeightMm');
        const cantidadMasivaDefault = normalize_nullable_integer(
            req.body.cantidadMasivaDefault,
            'cantidadMasivaDefault'
        );

        const config = await get_or_create_config(sede);
        config.fields = JSON.stringify(fields);
        config.columns = columns;
        config.label_width_mm = labelWidthMm;
        config.label_height_mm = labelHeightMm;
        config.show_border = req.body.showBorder !== false;
        config.cantidad_masiva_default = cantidadMasivaDefault;
        await config.save();

        res.status(200).json({
            message: 'Configuración de etiquetas actualizada correctamente',
            configuracion: map_config_output(config)
        });
    }
};

module.exports = EtiquetaProductoConfigController;