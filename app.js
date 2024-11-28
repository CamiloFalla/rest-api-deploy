import express, { json, static as serveStatic } from 'express';
import cors from 'cors';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import empleadosRouter from './routes/empleados.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(json());
app.disable('x-powered-by');

// Servir imágenes desde una carpeta estática
app.use('/data/images', serveStatic(join(__dirname, 'data/images')));

// Configurar rutas de empleados
app.use('/empleados', empleadosRouter);

const PORT = process.env.PORT ?? 12348;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});