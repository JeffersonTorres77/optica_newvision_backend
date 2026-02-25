const Rol = require('./../models/Rol');

const RolController = {
    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;

        if (id) {
            roles = await Rol.findAll({
                where: { id: id }
            });
        } else {
            roles = await Rol.findAll();
        }

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok', roles: roles });
    },
};

module.exports = RolController;