import express from "express";
import pool from "../models/db.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Ruta recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// Obtener todos los cargos
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT c.id_cargo, c.nombre, c.id_area, a.nombre AS area
      FROM cargos c
      JOIN areas a ON c.id_area = a.id_area
      ORDER BY c.nombre;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los cargos", error: error.message });
  }
});

// Obtener todas las áreas
router.get("/areas", async (req, res) => {
  try {
    const query = `
      SELECT id_area, nombre, descripcion
      FROM areas
      ORDER BY nombre;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener áreas", error: error.message });
  }
});

// Adicionar un área
router.post("/areas", async (req, res) => {
  const { nombre, descripcion, id_empresa } = req.body;

  try {
    const query = `
      INSERT INTO areas (nombre, descripcion, id_empresa)
      VALUES ($1, $2, $3)
      RETURNING id_area, nombre, descripcion;
    `;
    const values = [nombre, descripcion, id_empresa];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el área", error: error.message });
  }
});

// Crear un cargo
router.post("/", async (req, res) => {
  const { nombre, id_area } = req.body;

  try {
    const query = `
      INSERT INTO cargos (nombre, id_area)
      VALUES ($1, $2)
      RETURNING id_cargo, nombre;
    `;
    const values = [nombre, id_area];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al agregar el cargo", error: error.message });
  }
});

// Eliminar un área
router.delete("/areas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      DELETE FROM areas
      WHERE id_area = $1
      RETURNING id_area, nombre;
    `;
    const values = [id];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "El área no existe o no se puede eliminar" });
    }

    res.json({ message: "Área eliminada correctamente", area: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el área", error: error.message });
  }
});

// Eliminar un cargo
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el cargo está asociado a empleados
    const empleadoCheck = await pool.query("SELECT COUNT(*) FROM empleados WHERE id_cargo = $1", [id]);
    if (empleadoCheck.rows[0].count > 0) {
      return res.status(400).json({
        message: "No se puede eliminar el cargo porque está relacionado con empleados.",
      });
    }

    // Intentar eliminar el cargo
    const query = `
      DELETE FROM cargos
      WHERE id_cargo = $1
      RETURNING id_cargo, nombre;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "El cargo no existe o no se puede eliminar." });
    }

    res.json({ message: "Cargo eliminado correctamente", cargo: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el cargo", error: error.message });
  }
});

export default router;