import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno desde el archivo .env

const { Pool } = pkg;

async function testConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST,      // IP de tu EC2
    user: process.env.DB_USER,      // Usuario configurado
    password: process.env.DB_PASSWORD, // Contraseña configurada
    database: process.env.DB_NAME,  // Nombre de la base de datos
    port: Number(process.env.DB_PORT), // Puerto de PostgreSQL
  });

  console.log('Conectando a la base de datos con:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', result.rows);
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  } finally {
    pool.end(); // Cierra la conexión al finalizar
  }
}

testConnection();