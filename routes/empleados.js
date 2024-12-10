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

// Obtener todos los empleados con sus áreas y cargos
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT e.*, c.nombre AS cargo_nombre, a.nombre AS area_nombre
      FROM empleados e
      JOIN cargos c ON e.id_cargo = c.id_cargo
      JOIN areas a ON c.id_area = a.id_area
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener empleados", error: error.message });
  }
});

// Obtener empleado por ID
router.get("/:id_empleado", async (req, res) => {
  const { id_empleado } = req.params;
  try {
    const query = `
      SELECT e.*, c.nombre AS cargo_nombre, a.nombre AS area_nombre, c.id_area
      FROM empleados e
      JOIN cargos c ON e.id_cargo = c.id_cargo
      JOIN areas a ON c.id_area = a.id_area
      WHERE e.id_empleado = $1
    `;
    const { rows } = await pool.query(query, [id_empleado]);
    res.json(rows.length ? rows[0] : { message: "Empleado no encontrado" });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener empleado", error: error.message });
  }
});

// Actualizar un empleado
router.patch("/:id_empleado", async (req, res) => {
  const { id_empleado } = req.params;
  const updates = req.body;

  try {
    const setQuery = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = Object.values(updates);

    const { rowCount } = await pool.query(
      `UPDATE empleados SET ${setQuery} WHERE id_empleado = $${values.length + 1}`,
      [...values, id_empleado]
    );

    res.json(rowCount ? { message: "Empleado actualizado" } : { message: "Empleado no encontrado" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar empleado", error: error.message });
  }
});



// **Crear un empleado**
router.post('/', async (req, res) => {
  try {
    // Validación del cuerpo de la solicitud
    const validatedEmployee = employeeSchema.parse(req.body); // Asegura que los datos sean válidos
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

    // Consulta SQL para insertar el empleado
    const query = `
      INSERT INTO empleados (id_cargo, nombre, apellidos, username, email, fecha_nacimiento, fecha_ingreso, residencia, ciudad_residencia, estrato, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [id_cargo, nombre, apellidos, username, email, fecha_nacimiento, fecha_ingreso, residencia, ciudad_residencia, estrato, activo];
    const { rows } = await pool.query(query, values);

    // Devolver el empleado creado
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error); // Log para depuración
    res.status(400).json({ message: 'Datos inválidos', errors: error.errors || error.message });
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

// Empleados.js (ruta de subir imagen)
router.post('/:id_empleado/upload', upload.single('image'), async (req, res) => {
  const { id_empleado } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió un archivo. Verifica el campo "image".' });
  }

  try {
    // Obtener el username del empleado desde la base de datos
    const usernameQuery = 'SELECT username FROM empleados WHERE id_empleado = $1';
    const { rows } = await pool.query(usernameQuery, [id_empleado]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const { username } = rows[0];

    const bucket = process.env.BUCKET_NAME;
    const key = `test-folder/empleados/${username}/perfil/${req.file.originalname}`;

    console.log('Subiendo archivo al bucket:', bucket);
    console.log('Clave (ruta en S3):', key);

    const result = await uploadFile(req.file, bucket, key);

    const imageUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Actualizar la URL de la imagen en la base de datos
    const { rowCount } = await pool.query(
      'UPDATE empleados SET imagen = $1 WHERE id_empleado = $2',
      [imageUrl, id_empleado]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json({ message: 'Imagen subida correctamente', imageUrl });
  } catch (error) {
    console.error('Error al subir la imagen:', error);
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



// **Actualizar información de un empleado**
router.patch('/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;

  try {
    const updates = req.body;

    // Verificar si se incluye un nuevo cargo en la solicitud
    if (updates.cargo) {
      const cargoQuery = 'SELECT id_cargo FROM cargos WHERE nombre = $1';
      const { rows } = await pool.query(cargoQuery, [updates.cargo]);

      if (rows.length) {
        updates.id_cargo = rows[0].id_cargo; // Asociar el ID del cargo existente
      } else {
        // Crear un nuevo cargo si no existe
        const createCargoQuery = `
          INSERT INTO cargos (nombre, id_area)
          VALUES ($1, $2)
          RETURNING id_cargo
        `;
        const { rows: newCargo } = await pool.query(createCargoQuery, [updates.cargo, 1]); // ID de área predeterminado
        updates.id_cargo = newCargo[0].id_cargo;
      }

      delete updates.cargo; // Eliminar el campo cargo ya que será manejado como id_cargo
    }

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




export default router;