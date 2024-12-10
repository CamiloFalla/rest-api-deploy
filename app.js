import express, { json, static as serveStatic } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import corsMiddleware from './middlewares/cors.js';
import empleadosRouter from './routes/empleados.js';
import cargosRouter from './routes/cargos.js';
import metodrosaRouter from './routes/metodorosa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();

// CORS
app.use(corsMiddleware);
app.use(json());
app.disable('x-powered-by');

app.use('/data/images', serveStatic(join(__dirname, 'data/images')));

// Rutas
app.use('/cargos', cargosRouter);
app.use('/empleados', empleadosRouter);
app.use('/metodorosa', metodrosaRouter);

const PORT = process.env.PORT ?? 12348;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});