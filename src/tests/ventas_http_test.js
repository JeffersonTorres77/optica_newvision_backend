const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Support files directory
const SUPPORT_DIR = path.join(__dirname, 'ventas_http_test');
const REPORT_PATH = path.join(SUPPORT_DIR, 'report.md');

const BASE_URL = 'http://localhost:3000/api';
const CREDENTIALS = { sede: 'guatire', cedula: '999999999', password: '999999999' };

// Load templates from root
const templates = {
    solo_productos: JSON.parse(fs.readFileSync(path.join(__dirname, '../../solo-productos.json'), 'utf8').replace(/\/\/.*$/gm, '')),
    solo_consulta: JSON.parse(fs.readFileSync(path.join(__dirname, '../../solo-consulta.json'), 'utf8').replace(/\/\/.*$/gm, '')),
    consulta_productos: JSON.parse(fs.readFileSync(path.join(__dirname, '../../productos-mas-consulta.json'), 'utf8').replace(/\/\/.*$/gm, ''))
};

// Hardcoded IDs according to preparation script (could be made dynamic via a research utility if needed)
const HISTORY_ID = 270002; 
const PROD_1 = 10;
const PROD_2 = 11;

const cases = [
    {
        name: "1.1: Solo Productos - Base",
        body: {
            ...templates.solo_productos,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.solo_productos.cliente, cedula: "999999999" },
            productos: [{ id: PROD_1,    cantidad: 1, tipo: "PRODUCTO", descripcion: "Test P1" }],
            total: 174, impuesto: 16, metodosDePago: [{ tipo: "efectivo", monto: 174, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "1.2: Solo Productos - Con Descuento",
        body: {
            ...templates.solo_productos,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.solo_productos.cliente, cedula: "999999999" },
            productos: [{ id: PROD_2,    cantidad: 1, tipo: "PRODUCTO", descripcion: "Test P2" }],
            descuento: 10, total: 129.20, impuesto: 16, metodosDePago: [{ tipo: "efectivo", monto: 129.20, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "1.3: Solo Productos - Múltiples ítems",
        body: {
            ...templates.solo_productos,
            moneda: "dolar", sede: "guatire",
            productos: [
                { id: PROD_1,    cantidad: 1, tipo: "PRODUCTO", descripcion: "Item 1" },
                { id: PROD_2,    cantidad: 1, tipo: "PRODUCTO", descripcion: "Item 2" }
            ],
            total: 313.20, impuesto: 16, metodosDePago: [{ tipo: "efectivo", monto: 313.20, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "2.1: Solo Consulta - Optometrista",
        body: {
            ...templates.solo_consulta,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.solo_consulta.cliente, cedula: "999999999" },
            especialista: { cedula: "11554570" },
            consulta: { historiaId: HISTORY_ID, pagoMedico: 40, pagoOptica: 20, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 60 },
            total: 60, metodosDePago: [{ tipo: "efectivo", monto: 60, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "2.2: Solo Consulta - Especialista Externo",
        body: {
            ...templates.solo_consulta,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.solo_consulta.cliente, cedula: "999999999" },
            especialista: { cedula: "11554570" },
            consulta: { historiaId: HISTORY_ID, pagoMedico: 50, pagoOptica: 10, esFormulaExterna: true, tipoEspecialista: "Externo", montoOriginal: 60 },
            total: 60, metodosDePago: [{ tipo: "efectivo", monto: 60, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "2.3: Solo Consulta - Pago MIX",
        body: {
            ...templates.solo_consulta,
            moneda: "dolar", sede: "guatire",
            total: 80,
            metodosDePago: [
                { tipo: "efectivo", monto: 30, moneda: "dolar" },
                { tipo: "pagomovil", monto: 50 * 100, referncia: "1234", bancoCodigo: "0102", moneda: "bolivar" }
            ],
            consulta: { historiaId: HISTORY_ID, pagoMedico: 50, pagoOptica: 30, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 80 },
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "3.1: Consulta + Productos - Base",
        body: {
            ...templates.consulta_productos,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.consulta_productos.cliente, cedula: "999999999" },
            especialista: { cedula: "11554570" },
            productos: [{ id: PROD_1,    cantidad: 1, tipo: "PRODUCTO" }],
            total: 234, metodosDePago: [{ tipo: "efectivo", monto: 234, moneda: "dolar" }],
            consulta: { historiaId: HISTORY_ID, pagoMedico: 40, pagoOptica: 20, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 60 },
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "3.2: Consulta + Productos - Varios ítems",
        body: {
            ...templates.consulta_productos,
            moneda: "dolar", sede: "guatire",
            cliente: { ...templates.consulta_productos.cliente, cedula: "999999999" },
            productos: [
                { id: PROD_1,    cantidad: 1, tipo: "PRODUCTO" },
                { id: PROD_2,    cantidad: 1, tipo: "PRODUCTO" }
            ],
            consulta: { historiaId: HISTORY_ID, pagoMedico: 40, pagoOptica: 20, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 60 },
            total: 373.20, metodosDePago: [{ tipo: "efectivo", monto: 373.20, moneda: "dolar" }],
            formaPagoDetalle: { tipo: "contado" }
        }
    },
    {
        name: "3.3: Consulta + Productos - Pago Parcial (Abono)",
        body: {
            ...templates.consulta_productos,
            moneda: "dolar", sede: "guatire",
            productos: [{ id: PROD_2,    cantidad: 1, tipo: "PRODUCTO" }],
            consulta: { historiaId: HISTORY_ID, pagoMedico: 40, pagoOptica: 20, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 60 },
            metodosDePago: [{ tipo: "efectivo", monto: 100, moneda: "dolar" }],
            total: 199.20,
            formaPagoDetalle: { tipo: "abono" }
        }
    }
];

async function run() {
    console.log('# REPORT: SALES HTTP API TESTING\n');
    let results = "# Sales API Test Report\n\n";
    
    try {
        console.log('Authenticating...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
        const token = loginRes.data.token;
        console.log('Authenticated successfully.\n');

        const headers = { 'Authorization': `Bearer ${token}` };

        for (const testCase of cases) {
            process.stdout.write(`Running: ${testCase.name}... `);
            try {
                const res = await axios.post(`${BASE_URL}/ventas-add`, testCase.body, { headers });
                console.log('✅');
                results += `### ${testCase.name}\n- **Status**: PASSED ✅\n- **Response**: \`\`\`json\n${JSON.stringify(res.data.venta, null, 2)}\n\`\`\`\n\n`;
            } catch (e) {
                console.log('❌');
                const errorData = e.response ? e.response.data : e.message;
                results += `### ${testCase.name}\n- **Status**: FAILED ❌\n- **Error**: \`\`\`json\n${JSON.stringify(errorData, null, 2)}\n\`\`\`\n\n`;
            }
        }
    } catch (e) {
        console.log('💥 Critical Error.');
        results += `## Global Error\n- **Message**: ${e.message}\n`;
    }

    fs.writeFileSync(REPORT_PATH, results);
    console.log(`\nReport generated: ${REPORT_PATH}`);
}

run();
