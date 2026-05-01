require('dotenv').config();
const { sequelize } = require('../../config/db');
const Usuario = require('../../models/Usuario');
const Producto = require('../../models/Producto');
const Paciente = require('../../models/Paciente');
const HistorialMedico = require('../../models/HistorialMedico');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function prepare() {
    console.log('--- PREPARING TEST ENVIRONMENT (GUATIRE) ---');
    try {
        // 1. User
        const cedula = '999999999';
        const passwordPlain = '999999999';
        let user = await Usuario.findOne({ where: { cedula } });
        if (!user) {
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            await Usuario.create({ cedula, nombre: 'Test API User', password: hashedPassword, rol_id: 1, activo: 1, cargo_id: 1 });
            console.log('✅ User created.');
        } else {
            console.log('ℹ️ User exists.');
        }

        // 2. Products
        const products = [
            { sede_id: 'guatire', nombre: 'Lentes Guatire 1', marca: 'Ray-Ban', color: 'Negro', codigo: 'GT-001', material: 'Pasta', categoria: 'Lentes de Sol', modelo: 'Wayfarer', precio: 150.00, precio_con_iva: 174.00, moneda: 'dolar', stock: 10, activo: 1, aplica_iva: 1 },
            { sede_id: 'guatire', nombre: 'Lentes Guatire 2', marca: 'Oakley', color: 'Azul', codigo: 'GT-002', material: 'Metal', categoria: 'Lentes Deportivos', modelo: 'Holbrook', precio: 120.00, precio_con_iva: 139.20, moneda: 'dolar', stock: 15, activo: 1, aplica_iva: 1 }
        ];
        for (const p of products) {
            const exists = await Producto.findOne({ where: { codigo: p.codigo, sede_id: 'guatire' } });
            if (!exists) { await Producto.create(p); console.log(`✅ Product ${p.codigo} created.`); }
        }

        // 3. Patient & History
        let paciente = await Paciente.findOne({ where: { cedula, sede_id: 'guatire' } });
        if (!paciente) {
            paciente = await Paciente.create({ pkey: uuidv4(), sede_id: 'guatire', cedula, nombre: 'Paciente Test Guatire', email: 'paciente@test.com', fecha_nacimiento: '1990-01-01', telefono: '04120000000', ocupacion: 'Pruebas', genero: 'M', direccion: 'Guatire, Miranda', redes_sociales: [], activo: 1 });
            console.log('✅ Patient created.');
        }
        let historia = await HistorialMedico.findOne({ where: { paciente_id: paciente.pkey } });
        if (!historia) {
            await HistorialMedico.create({ numero: 'H-GT-001', fecha: new Date(), paciente_id: paciente.pkey, motivo_consulta: ['Prueba de API'], diagnostico: 'Sano', examen_ocular_lensometria: [], examen_ocular_refraccion: [], examen_ocular_refraccion_final: [], examen_ocular_avsc_avae_otros: [], recomendaciones: [], created_by: '999999999', updated_by: '999999999' });
            console.log('✅ Medical History created.');
        }

    } catch (e) {
        console.error('❌ Error during preparation:', e);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    prepare();
}

module.exports = prepare;
