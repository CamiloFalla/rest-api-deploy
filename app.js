import express, { json, static as serveStatic } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import corsMiddleware from './middlewares/cors.js';
import empleadosRouter from './routes/empleados.js';
import cargosRouter from './routes/cargos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();

// Configuración de CORS
app.use(corsMiddleware);
app.use(json());
app.disable('x-powered-by');

// Servir imágenes desde una carpeta estática
app.use('/data/images', serveStatic(join(__dirname, 'data/images')));

// Ruta para cargos
app.use('/cargos', cargosRouter);


// Configurar rutas de empleados
app.use('/empleados', empleadosRouter);


const PORT = process.env.PORT ?? 12348;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});