const moment = require('moment');

const DateUtils = {
    getDate: () => {
        const fechaHora = moment().format('YYYY-MM-DD HH:mm:ss');
        return fechaHora;
    },

    subtractDays: (date, days) => {
        const fecha = moment(date).subtract(days, 'days').format('YYYY-MM-DD');
        return fecha;
    }
};

module.exports = DateUtils;