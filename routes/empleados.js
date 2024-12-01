import express from 'express';
import multer from 'multer';
import pool from '../models/db.js';
import { uploadFile } from '../models/s3.js';
import { employeeSchema } from '../schemas/empleado.js';

const router = express.Router();

// Configuración de Multer para manejo de imágenes y archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // Límite de 2 MB
});

// Middleware para registrar y validar el cuerpo JSON
router.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    console.log('Cuerpo recibido:', req.body);
    next();
  } else {
    res.status(400).json({ message: 'Cuerpo de la solicitud no válido' });
  }
});

// **Recuperar todos los empleados**
router.get('/', async (req, res) => {
  const { area } = req.query;
  try {
    const query = `
      SELECT e.*, c.nombre AS cargo, a.nombre AS area
      FROM empleados e
      JOIN cargos c ON e.id_cargo = c.id_cargo
      JOIN areas a ON c.id_area = a.id_area
    `;
    const { rows } = await pool.query(area ? `${query} WHERE a.nombre = $1` : query, area ? [area] : []);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
});

// **Recuperar un empleado por ID**
router.get('/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;
  try {
    const query = `
      SELECT e.*, c.nombre AS cargo, a.nombre AS area
      FROM empleados e
      JOIN cargos c ON e.id_cargo = c.id_cargo
      JOIN areas a ON c.id_area = a.id_area
      WHERE e.id_empleado = $1
    `;
    const { rows } = await pool.query(query, [id_empleado]);
    if (!rows.length) return res.status(404).json({ message: 'Empleado no encontrado' });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el empleado' });
  }
});

// **Crear un empleado**
router.post('/', async (req, res) => {
  try {
    const validatedEmployee = employeeSchema.parse(req.body);
    const {
      id_cargo,
      nombre,
      apellidos,
      username,
      email,
      fecha_nacimiento,
      fecha_ingreso,
      residencia,
      ciudad_residencia,
      estrato,
      activo,
    } = validatedEmployee;

    const query = `
      INSERT INTO empleados (id_cargo, nombre, apellidos, username, email, fecha_nacimiento, fecha_ingreso, residencia, ciudad_residencia, estrato, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [id_cargo, nombre, apellidos, username, email, fecha_nacimiento, fecha_ingreso, residencia, ciudad_residencia, estrato, activo];
    const { rows } = await pool.query(query, values);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Datos inválidos', errors: error.errors || error.message });
  }
});

// **Actualizar información de un empleado**
router.patch('/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;

  try {
    const updates = req.body;
    const setQuery = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(updates);

    const { rowCount } = await pool.query(
      `UPDATE empleados SET ${setQuery} WHERE id_empleado = $${values.length + 1}`,
      [...values, id_empleado]
    );

    if (!rowCount) return res.status(404).json({ message: 'Empleado no encontrado' });
    res.json({ message: 'Empleado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al actualizar el empleado', errors: error.errors || error.message });
  }
});

// **Eliminar un empleado**
router.delete('/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;

  try {
    const { rowCount } = await pool.query('DELETE FROM empleados WHERE id_empleado = $1', [id_empleado]);
    if (!rowCount) return res.status(404).json({ message: 'Empleado no encontrado' });

    res.json({ message: 'Empleado eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el empleado' });
  }
});

// **Subir una imagen de perfil**
router.post('/:id_empleado/upload', upload.single('image'), async (req, res) => {
  const { id_empleado } = req.params;

  if (!req.file) return res.status(400).json({ message: 'No se recibió un archivo' });

  try {
    const key = `empleados/${id_empleado}/perfil/${req.file.originalname}`;
    const bucket = process.env.BUCKET_NAME;

    const result = await uploadFile(req.file, bucket, key);

    const imageUrl = result.Location;
    const { rowCount } = await pool.query('UPDATE empleados SET imagen = $1 WHERE id_empleado = $2', [imageUrl, id_empleado]);

    if (!rowCount) return res.status(404).json({ message: 'Empleado no encontrado' });

    res.json({ message: 'Imagen subida correctamente', imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir la imagen', error: error.message });
  }
});

// **Subir un archivo médico**
router.post('/:id_empleado/medical/upload', upload.single('file'), async (req, res) => {
  const { id_empleado } = req.params;

  if (!req.file) return res.status(400).json({ message: 'No se recibió un archivo' });

  try {
    const key = `empleados/${id_empleado}/registros-medicos/${req.file.originalname}`;
    const bucket = process.env.BUCKET_NAME;

    const result = await uploadFile(req.file, bucket, key);

    const fileUrl = result.Location;
    const query = `
      INSERT INTO registros_medicos (id_empleado, año, archivo_examen)
      VALUES ($1, $2, $3)
    `;
    const values = [id_empleado, new Date().getFullYear(), fileUrl];

    await pool.query(query, values);
    res.json({ message: 'Archivo médico subido correctamente', fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir el archivo médico', error: error.message });
  }
});

export default router;