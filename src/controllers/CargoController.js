const Cargo = require('./../models/Cargo');

const CargoController = {
    get: async (req, res) => {
        if (!req.user) {
            throw { message: "Sesion invalida." };
        }

        const id = req.params.id;

        if (id) {
            cargos = await Cargo.findAll({
                where: { id: id }
            });
        } else {
            cargos = await Cargo.findAll();
        }

        /**
         * Fin
         */
        res.status(200).json({ message: 'ok', cargos: cargos });
    },
};

module.exports = CargoController;