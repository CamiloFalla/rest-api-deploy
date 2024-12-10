import express from 'express';
import multer from 'multer';
import pool from '../models/db.js';
import { uploadFile } from '../models/s3.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Mapeo de subcategoría a columna en la base de datos
const imageColumns = {
  'A1': 'img_a1',
  'A2': 'img_a2',
  'A3': 'img_a3',
  'A4': 'img_a4',
  'B1': 'img_b1',
  'B2': 'img_b2',
  'C1': 'img_c1',
  'C2': 'img_c2'
};

// Función principal de cálculo ROSA (ejemplo)
function computeROSA(responses) {
  const puntuacionA = calcularSilla(responses);
  const puntuacionB = calcularPantallaTelefono(responses);
  const puntuacionC = calcularTecladoRaton(responses);
  const puntuacionD = Math.max(puntuacionB, puntuacionC);
  const puntuacionFinal = Math.max(puntuacionA, puntuacionD);

  let recomendaciones = "Riesgo bajo - Mantener posición";
  if (puntuacionFinal >= 5) {
    recomendaciones = "Riesgo alto - Realizar cambios inmediatos";
  }

  return {
    puntuacionA,
    puntuacionB,
    puntuacionC,
    puntuacionD,
    puntuacionFinal,
    recomendaciones
  };
}

// Funciones de cálculo (ejemplo, ajusta según tu lógica)
function calcularSilla(responses) {
  const A1 = evaluarOpcion(responses["A1"], "A1");
  const A2 = evaluarOpcion(responses["A2"], "A2");
  const A3 = evaluarOpcion(responses["A3"], "A3");
  const A4 = evaluarOpcion(responses["A4"], "A4");
  let A = A1 + A2 + A3 + A4;

  const usoSillaHoras = responses.usoSillaHoras || 0;
  if (usoSillaHoras > 4) A += 1;

  return A;
}

function calcularPantallaTelefono(responses) {
  const B1 = evaluarOpcion(responses["B1"], "B1");
  const B2 = evaluarOpcion(responses["B2"], "B2");
  return Math.max(B1, B2);
}

function calcularTecladoRaton(responses) {
  const C1 = evaluarOpcion(responses["C1"], "C1");
  const C2 = evaluarOpcion(responses["C2"], "C2");
  return Math.max(C1, C2);
}

// Función genérica para evaluar una subcategoría (ejemplo)
function evaluarOpcion(data, subCat) {
  // Ajusta tu lógica según subCat, acá solo ejemplo genérico
  let base = 1;
  if (data?.unique && !data.unique.endsWith("-1")) {
    base = 2; 
    if (data.unique.endsWith("-3")) {
      base = 3;
    }
  }
  let adicionales = (data?.additional || []).length;
  return base + adicionales;
}

// Ruta para recibir todo al final
router.post('/:id_empleado/final', upload.any(), async (req, res) => {
  const { id_empleado } = req.params;
  const responses = JSON.parse(req.body.responses); 

  try {
    const { rows } = await pool.query('SELECT username FROM empleados WHERE id_empleado=$1', [id_empleado]);
    if (rows.length === 0) return res.status(404).json({ message: 'Empleado no encontrado' });

    const { username } = rows[0];

    const resultado = computeROSA(responses);

    const year = new Date().getFullYear();
    const estado = true;
    const calificacion = resultado.puntuacionFinal;
    const backlogcal = resultado.recomendaciones;
    const respuestas_json = JSON.stringify(responses);

    const insertQuery = `
      INSERT INTO evaluaciones_rosa (id_empleado, año, estado, calificacion, backlogcal, respuestas_json)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_evaluacion
    `;
    const insertValues = [id_empleado, year, estado, calificacion, backlogcal, respuestas_json];
    const insertResult = await pool.query(insertQuery, insertValues);

    const id_evaluacion = insertResult.rows[0].id_evaluacion;

    // Subir imágenes a S3 (opcional)
    for (const file of req.files) {
      const subCategoriaId = file.fieldname.replace('file_', ''); 
      const bucket = process.env.BUCKET_NAME;
      const key = `test-folder/empleados/${username}/evaluacionRosa/${year}/${id_evaluacion}/${subCategoriaId}.jpg`;

      await uploadFile(file, bucket, key);
      const imageUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // Actualizar columna correspondiente
      const columnName = imageColumns[subCategoriaId];
      if (columnName) {
        await pool.query(
          `UPDATE evaluaciones_rosa SET ${columnName} = $1 WHERE id_evaluacion = $2`,
          [imageUrl, id_evaluacion]
        );
      }
    }

    res.json({
      id_evaluacion,
      ...resultado
    });

  } catch (error) {
    console.error('Error al procesar la evaluación final ROSA:', error);
    res.status(500).json({ message: 'Error interno al procesar la evaluación', error: error.message });
  }
});

// Obtener la evaluación por id_evaluacion
router.get('/evaluation/:id_evaluacion', async (req, res) => {
  const { id_evaluacion } = req.params;
  const { rows } = await pool.query('SELECT * FROM evaluaciones_rosa WHERE id_evaluacion=$1', [id_evaluacion]);
  if (rows.length === 0) return res.status(404).json({ message: 'Evaluación no encontrada' });
  res.json(rows[0]);
});

// Obtener la evaluación actual del año en curso para un empleado (la más reciente)
router.get('/:id_empleado/current', async (req, res) => {
  const { id_empleado } = req.params;
  const year = new Date().getFullYear();
  const query = `
    SELECT * FROM evaluaciones_rosa
    WHERE id_empleado=$1 AND año=$2
    ORDER BY id_evaluacion DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id_empleado, year]);
  if (rows.length === 0) return res.status(404).json({ message: 'No hay evaluación para este empleado en el año actual' });
  res.json(rows[0]);
});

export default router;