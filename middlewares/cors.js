import cors from 'cors';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir cualquier origen para pruebas locales
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
});

export default corsMiddleware;