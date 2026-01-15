const JsonUtil = {
    get: (obj, key) => {
        const raw = obj.getDataValue(key);

        if (Array.isArray(raw) || typeof raw === 'object') {
            return raw
        };

        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }

        return [];
    },

    set: (obj, key, value) => {
        if (!Array.isArray(value) && typeof value !== 'object') {
            throw new Error(`El valor de ${key} debe ser un json valido`);
        }
        obj.setDataValue(key, value);
    }
};

module.exports = JsonUtil;