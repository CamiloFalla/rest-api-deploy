import express from 'express';
import multer from 'multer';
import { join } from 'node:path';
import { existsSync, mkdirSync, rename } from 'node:fs';
import empleados from '../empleados.json' assert { type: 'json' };
import { employeeSchema } from '../schemas/empleado.js';

const router = express.Router();

// Configuración de Multer
const upload = multer({
  dest: join('data/images/employee'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('El archivo debe ser una imagen'), false);
    }
    cb(null, true);
  },
});

// Obtener todos los empleados
router.get('/', (req, res) => {
  const { area } = req.query;

  const empleadosWithImages = empleados.map((employee) => {
    const imagePath = `data/images/employee/${employee.iduniqemp}/${employee.iduniqemp}.jpg`;
    return {
      ...employee,
      imageUrl: `http://localhost:${process.env.PORT ?? 12348}/${imagePath}`,
    };
  });

  if (area) {
    const normalizedQuery = area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filteredArea = empleadosWithImages.filter((employee) =>
      employee.area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );
    return res.json({ data: filteredArea });
  }

  res.json({ data: empleadosWithImages });
});

// Obtener un empleado por iduniqemp
router.get('/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params;
  const employee = empleados.find((emp) => emp.iduniqemp === iduniqemp);

  if (!employee) {
    return res.status(404).json({ message: 'Empleado no encontrado' });
  }

  const imagePath = `data/images/employee/${employee.iduniqemp}/${employee.iduniqemp}.jpg`;
  res.json({
    ...employee,
    imageUrl: `http://localhost:${process.env.PORT ?? 12348}/${imagePath}`,
  });
});

// Crear un nuevo empleado
router.post('/', (req, res) => {
  try {
    const validatedEmployee = employeeSchema.parse(req.body);

    const exists = empleados.find((emp) => emp.iduniqemp === validatedEmployee.iduniqemp);
    if (exists) {
      return res.status(409).json({ message: `El empleado con iduniqemp ${validatedEmployee.iduniqemp} ya existe.` });
    }

    const newEmployee = { id: crypto.randomUUID(), ...validatedEmployee };
    empleados.push(newEmployee);

    res.status(201).json({ message: 'Empleado creado', employee: newEmployee });
  } catch (error) {
    res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
  }
});

// Actualizar un empleado
router.patch('/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params;
  const employee = empleados.find((emp) => emp.iduniqemp === iduniqemp);

  if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

  try {
    const updates = employeeSchema.partial().parse(req.body);
    Object.assign(employee, updates);

    res.json({ message: 'Empleado actualizado', employee });
  } catch (error) {
    res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
  }
});

// Eliminar un empleado
router.delete('/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params;

  const index = empleados.findIndex((emp) => emp.iduniqemp === iduniqemp);
  if (index === -1) return res.status(404).json({ message: 'Empleado no encontrado' });

  const [deletedEmployee] = empleados.splice(index, 1);

  res.json({ message: 'Empleado eliminado', employee: deletedEmployee });
});

// Subir una imagen
router.post('/:iduniqemp/upload', upload.single('image'), (req, res) => {
  const { iduniqemp } = req.params;
  const employee = empleados.find((emp) => emp.iduniqemp === iduniqemp);

  if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

  const employeeImageDir = join('data/images/employee', employee.iduniqemp);
  const employeeImagePath = join(employeeImageDir, `${employee.iduniqemp}.jpg`);

  if (!existsSync(employeeImageDir)) {
    mkdirSync(employeeImageDir, { recursive: true });
  }

  rename(req.file.path, employeeImagePath, (err) => {
    if (err) return res.status(500).json({ message: 'Error al procesar la imagen', error: err.message });

    res.json({
      message: 'Imagen subida correctamente',
      imageUrl: `http://localhost:${process.env.PORT ?? 12348}/data/images/employee/${employee.iduniqemp}/${employee.iduniqemp}.jpg`,
    });
  });
});

export default router;