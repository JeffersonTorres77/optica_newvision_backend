const Empresa = require('../models/Empresa');

const EmpresaController = {
    get: async (req, res) => {
        const rif = req.query.rif;
        const sede = req.query.sede;

        let attributes = ['sede', 'rif', 'nombre', 'direccion', 'telefono', 'correo'];
        let where = {};

        if (rif) where.rif = rif;
        if (sede) where.sede = sede;

        const empresas = await Empresa.findAll({
            where: where,
            attributes: attributes,
        });

        res.status(200).json({ message: 'ok', empresas: empresas });
    }
};

module.exports = EmpresaController;
