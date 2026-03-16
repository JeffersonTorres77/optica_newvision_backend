require('dotenv').config();
const { sequelize } = require('../../config/db');
const Usuario = require('../../models/Usuario');
const Producto = require('../../models/Producto');
const Paciente = require('../../models/Paciente');
const HistorialMedico = require('../../models/HistorialMedico');
const Sede = require('../../models/Sede');
const Tasa = require('../../models/Tasa');
const bcrypt = require('bcryptjs');

async function prepare() {
    console.log("Preparing environment for Payment Methods tests (Guarenas)...");

    try {
        // 1. Ensure Sede Guarenas exists
        await Sede.findOrCreate({
            where: { id: 'guarenas' },
            defaults: { nombre: 'Sede Guarenas', pkey: 'GUARENAS' }
        });

        // 2. Ensure Test User exists (Guarenas)
        const hashedPassword = await bcrypt.hash('999999999', 10);
        await Usuario.findOrCreate({
            where: { cedula: '999999999' },
            defaults: {
                nombre: 'Test Pagos',
                password: hashedPassword,
                sede: 'guarenas',
                rol: 1,
                cargo: 1,
                estatus: 1
            }
        });

        // 3. Ensure Products exist for Guarenas
        await Producto.findOrCreate({
            where: { id: 101 },
            defaults: {
                nombre: 'Producto Pago A',
                marca: 'Test',
                material: 'Pasta',
                categoria: 'Monturas',
                precio: 86.21,
                precio_con_iva: 100,
                moneda: 'dolar',
                sede_id: 'guarenas',
                stock: 100,
                aplica_iva: true,
                codigo: 'PAG-A',
                activo: 1
            }
        });

        await Producto.findOrCreate({
            where: { id: 102 },
            defaults: {
                nombre: 'Producto Pago B',
                marca: 'Test',
                material: 'Pasta',
                categoria: 'Monturas',
                precio: 43.10,
                precio_con_iva: 50,
                moneda: 'dolar',
                sede_id: 'guarenas',
                stock: 100,
                aplica_iva: true,
                codigo: 'PAG-B',
                activo: 1
            }
        });

        // 4. Ensure Patient exists
        const [paciente] = await Paciente.findOrCreate({
            where: { cedula: '999999999' },
            defaults: {
                nombre: 'Paciente Pagos',
                sede_id: 'guarenas',
                pkey: 'PAG-999',
                telefono: '04120000000',
                email: 'test@test.com',
                direccion: 'Direccion de prueba',
                fecha_nacimiento: '1990-01-01',
                genero: 'M',
                ocupacion: 'Pruebas',
                redes_sociales: [],
                sin_cedula: false
            }
        });

        // 5. Ensure Medical Histories exist
        for (let i = 1; i <= 3; i++) {
            await HistorialMedico.findOrCreate({
                where: { id: 999000 + i },
                defaults: {
                    numero: `HIST-999-00${i}`,
                    fecha: '2026-03-16',
                    paciente_id: 'PAG-999',
                    motivo_consulta: [],
                    examen_ocular_lensometria: {},
                    examen_ocular_refraccion: {},
                    examen_ocular_refraccion_final: {},
                    examen_ocular_avsc_avae_otros: {},
                    recomendaciones: {},
                    created_by: '999999999',
                    updated_by: '999999999',
                    formula_externa: false,
                    pago_pendiente: false
                }
            });
        }

        // 6. Ensure Tasa exists
        await Tasa.findOrCreate({
            where: { id: 'bolivar' },
            defaults: {
                nombre: 'Bolivar',
                simbolo: 'Bs',
                tasa: 60, // Fixed rate for testing
                principal: false
            }
        });
        await Tasa.findOrCreate({
            where: { id: 'dolar' },
            defaults: {
                nombre: 'Dolar',
                simbolo: '$',
                tasa: 1,
                principal: true
            }
        });

        console.log("Environment ready.");
    } catch (err) {
        console.error("Error preparing environment:", err);
        process.exit(1);
    }
    process.exit(0);
}

prepare();
