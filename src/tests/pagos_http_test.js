const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const REPORT_PATH = path.join(__dirname, 'pagos_http_test', 'report.md');

// Test Data Constants
const PROD_1 = 101; // $100
const PROD_2 = 102; // $50
const HISTORY_ID = 999001;
const DEFAULT_CLIENT = {
    cedula: "999999999",
    nombre: "Test User",
    tipoCliente: "cliente_general",
    tipoPersona: "natural"
};

async function runTests() {
    let report = "# REPORT: PAYMENT METHODS HTTP TESTING\n\n";
    console.log("Starting Payment Methods Tests...");

    try {
        // 1. Authenticate
        console.log("Authenticating...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            sede: 'guarenas',
            cedula: '999999999',
            password: '999999999'
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const testCases = [
            // --- CONTADO ---
            {
                name: "1.1: Contado - USD Full",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, metodosDePago: [{ tipo: "efectivo", monto: 100, moneda: "dolar" }],
                    formaPagoDetalle: { tipo: "contado" }
                }
            },
            {
                name: "1.2: Contado - BS Full (Rate 60)",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_2, cantidad: 2, tipo: "PRODUCTO" }],
                    total: 100, 
                    metodosDePago: [{ tipo: "pagomovil", monto: 100 * 60, moneda: "bolivar" }],
                    formaPagoDetalle: { tipo: "contado" }
                }
            },
            {
                name: "1.3: Contado - MIX (USD + BS)",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, 
                    metodosDePago: [
                        { tipo: "efectivo", monto: 50, moneda: "dolar" },
                        { tipo: "efectivo", monto: 50 * 60, moneda: "bolivar" }
                    ],
                    formaPagoDetalle: { tipo: "contado" }
                }
            },
            // --- DE CONTADO PENDIENTE ---
            {
                name: "2.1: Pendiente - Standard",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, metodosDePago: [],
                    formaPagoDetalle: { tipo: "de_contado-pendiente" }
                }
            },
            {
                name: "2.2: Pendiente - High Amount",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 5, tipo: "PRODUCTO" }],
                    total: 500, metodosDePago: [],
                    formaPagoDetalle: { tipo: "de_contado-pendiente" }
                }
            },
            {
                name: "2.3: Pendiente - Mixed (Products + Consulta)",
                body: {
                    tipoVenta: "consulta_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_2, cantidad: 1, tipo: "PRODUCTO" }],
                    consulta: { historiaId: HISTORY_ID, pagoMedico: 40, pagoOptica: 10, esFormulaExterna: false, tipoEspecialista: "Optometrista", montoOriginal: 50 },
                    total: 100, metodosDePago: [],
                    formaPagoDetalle: { tipo: "de_contado-pendiente" }
                }
            },
            // --- ABONO ---
            {
                name: "4.1: Abono - 20%",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, metodosDePago: [{ tipo: "efectivo", monto: 20, moneda: "dolar" }],
                    formaPagoDetalle: { tipo: "abono" }
                }
            },
            {
                name: "4.2: Abono - 50%",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, metodosDePago: [{ tipo: "efectivo", monto: 50, moneda: "dolar" }],
                    formaPagoDetalle: { tipo: "abono" }
                }
            },
            {
                name: "4.3: Abono - 90%",
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: 100, metodosDePago: [{ tipo: "efectivo", monto: 90, moneda: "dolar" }],
                    formaPagoDetalle: { tipo: "abono" }
                }
            }
        ];

        // Add Cashea cases with dynamic cuotas
        [3, 6, 9].forEach(n => {
            const total = 100;
            const montoInicial = total * 0.4; // 40% initial
            const montoRestante = total - montoInicial;
            const montoPorCuota = Number((montoRestante / n).toFixed(2));
            
            const cuotas = [];
            for(let i=1; i<=n; i++) {
                cuotas.push({
                    numero: i,
                    fecha: "2026-04-01",
                    monto: montoPorCuota,
                    pagada: i === 1, // First installment paid
                    seleccionada: i === 1
                });
            }

            testCases.push({
                name: `3.${n/3}: Cashea - ${n} Cuotas`,
                body: {
                    tipoVenta: "solo_productos", moneda: "dolar", sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    productos: [{ id: PROD_1, cantidad: 1, tipo: "PRODUCTO" }],
                    total: total,
                    metodosDePago: [{ tipo: "efectivo", monto: Number((montoInicial + montoPorCuota).toFixed(2)), moneda: "dolar" }],
                    formaPagoDetalle: {
                        tipo: "cashea",
                        nivel: "nivel3",
                        montoInicial: montoInicial,
                        cantidadCuotas: n.toString(),
                        montoPorCuota: montoPorCuota,
                        totalPagadoAhora: Number((montoInicial + montoPorCuota).toFixed(2)),
                        cuotas: cuotas
                    }
                }
            });
        });

        // Run all cases
        for (const test of testCases) {
            console.log(`Running: ${test.name}`);
            try {
                const res = await axios.post(`${API_URL}/ventas-add`, test.body, config);
                report += `### ✅ ${test.name}\n- **STATUS**: PASSED\n- **KEY**: ${res.data.venta.key}\n- **FORMA_PAGO**: ${res.data.venta.formaPagoDetalle.tipo}\n\n`;
            } catch (err) {
                const errorData = err.response ? JSON.stringify(err.response.data, null, 2) : err.message;
                report += `### ❌ ${test.name}\n- **STATUS**: FAILED\n- **ERROR**: ${errorData}\n\n`;
            }
        }

    } catch (globalErr) {
        report += `## Global Error\n- ${globalErr.message}\n`;
        console.error("Global Error:", globalErr);
    }

    fs.writeFileSync(REPORT_PATH, report);
    console.log(`Finished. Report saved to: ${REPORT_PATH}`);
}

runTests();
