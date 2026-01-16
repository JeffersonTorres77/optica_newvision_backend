const Empresa = require('../models/Empresa');
const { Op } = require('sequelize');

const EmpresaService = {

    guardar_empresa: async (objEmpresa) => {
        const obj_empresa = await Empresa.findOne({ where: { rif: objEmpresa.rif } });
        if (!obj_empresa) {
            await Empresa.create({
                sede: objEmpresa.sede,
                rif: objEmpresa.rif,
                nombre: objEmpresa.nombre,
                telefono: objEmpresa.telefono,
                correo: objEmpresa.correo,
                direccion: objEmpresa.direccion
            });
        } else {
            await Empresa.update({
                nombre: objEmpresa.nombre,
                telefono: objEmpresa.telefono,
                correo: objEmpresa.correo,
                direccion: objEmpresa.direccion
            }, { where: { rif: objEmpresa.rif } });
        }
    },

};

module.exports = EmpresaService;