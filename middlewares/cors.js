import cors from 'cors';

const allowedOrigins = [
  'http://localhost:8080', 
  'http://localhost:3000'
];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Permitir acceso
    } else {
      callback(new Error('Not allowed by CORS')); // Bloquear acceso
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type'], // Encabezados permitidos
});

export default corsMiddleware;