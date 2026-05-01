const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const DEFAULT_CLIENT = {
    cedula: "999999999",
    nombre: "Test User",
    tipoCliente: "cliente_general",
    tipoPersona: "natural"
};

async function runTests() {
    console.log("Starting Consultation Linkage Verification Tests...");

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

        const testHistories = [999001, 999002, 999003];
        const results = [];

        for (const historyId of testHistories) {
            console.log(`\nCreating Consultation Sale for History ID: ${historyId}...`);
            try {
                const saleRes = await axios.post(`${API_URL}/ventas-add`, {
                    tipoVenta: "solo_consulta",
                    moneda: "dolar",
                    sede: "guarenas",
                    cliente: DEFAULT_CLIENT,
                    total: 50,
                    metodosDePago: [{ tipo: "efectivo", monto: 50, moneda: "dolar" }],
                    formaPagoDetalle: { tipo: "contado" },
                    consulta: {
                        historiaId: historyId,
                        pagoMedico: 40,
                        pagoOptica: 10,
                        esFormulaExterna: false,
                        tipoEspecialista: "Optometrista",
                        montoOriginal: 50
                    }
                }, config);

                const ventaKey = saleRes.data.venta.key;
                console.log(`✅ Sale Created. Venta Key: ${ventaKey}`);
                results.push({ historyId, ventaKey, status: 'CREATED' });

            } catch (err) {
                const errorData = err.response ? JSON.stringify(err.response.data, null, 2) : err.message;
                console.error(`❌ Failed to create sale for History ID: ${historyId}`, errorData);
                results.push({ historyId, status: 'FAILED', error: errorData });
            }
        }

        console.log("\n--- VERIFICATION RESULTS ---");
        console.table(results);

    } catch (globalErr) {
        console.error("Global Error:", globalErr.message);
    }
}

runTests();
