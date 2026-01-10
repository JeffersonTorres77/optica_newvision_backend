require('dotenv').config();
const express = require('express');
const routes = require('./routes/apiRoute');
const { testConnection } = require('./config/db');
const cors = require('cors');
const Usuario = require('./models/Usuario');
const path = require('path');
const HashUtils = require('./utils/HashUtil');
const Paciente = require('./models/Paciente');
const HistorialMedico = require('./models/HistorialMedico');

require('./crons/RastrearBcv')();
require('./crons/ArchivarOrdenesTrabajo')();

const app = express();
const port = process.env.PORT || 3000;

// Conectamos con la base de datos
testConnection();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración para servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, '../public')));

// Rutas
app.get('/', async (req, res) => {
  res.json({ message: "Hello world: 2025-08-18" });
});

/**
 * Ajuste para encriptar las keys de pacientes en las tablas de 'pacientes' y 'historias_medicas'
 */
// app.get('/ajustar-id-pacintes', async (req, res) => {
//   let countPacientes = 0;
//   let countHistorias = 0;

//   const pacientes = await Paciente.findAll();
//   for(let paciente of pacientes) {
//     countPacientes++;

//     const pkey = paciente.pkey;
//     const new_pkey = HashUtils.generate(paciente.id);

//     paciente.pkey = new_pkey;
//     paciente.save();

//     const historias = await HistorialMedico.findAll({ where: { paciente_id: pkey } });
//     for(let historia of historias) {
//       countHistorias++;

//       historia.paciente_id = new_pkey;
//       historia.save();
//     }
//   }

//   res.json({ message: "OK", total_pacientes: countPacientes, total_historias: countHistorias });
// });

app.use('/api', routes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});