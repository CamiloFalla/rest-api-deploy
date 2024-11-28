const express = require('express')
const cors = require('cors')
const crypto = require('node:crypto')
const path = require('node:path')
const fs = require('node:fs')
const multer = require('multer');
const empleados = require('./empleados.json')
const { employeeSchema } =require('./schemas/empleado')
const validator = require('validator')


const app = express()

// Configuración de CORS
const corsOptions = {
  origin: 'http://localhost:8080', // Permitir solo esta URL de origen
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type'] // Encabezados permitidos
}

app.use(cors(corsOptions));

app.use(express.json())
app.disable('x-powered-by')

// Servir imágenes desde una carpeta estática
app.use('/data/images', express.static(path.join(__dirname, 'data/images')))

// Validar y sanitizar datos con un middleware (opcional)
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key])
      }
    })
  }
  next()
});

const upload = multer({
  dest: path.join(__dirname, 'data/images/employee'),
  limits: { fileSize: 2 * 1024 * 1024 }, // Límite de 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('El archivo debe ser una imagen'), false);
    }
    cb(null, true);
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' })
})

app.get('/empleados', (req, res) => {
  const { area } = req.query

  // Agregar rutas de imágenes al JSON
  const empleadosWithImages = empleados.map(employee => {
    const imagePath = `data/images/employee/${employee.name}/${employee.name}.jpg`;
    return {
      ...employee,
      imageUrl: `http://localhost:${PORT}/${imagePath}`
    }
  })

  if (area) {
    const normalizedQuery = area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const filteredArea = empleados.filter(employee =>
      employee.area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    )
    return res.json({ data: filteredArea })
  }

  res.json({ data: empleados })
})

// Obtener un empleado con su imagen
app.get('/empleados/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params
  const employee = empleados.find(employee => employee.iduniqemp === iduniqemp)

  if (!employee) {
    return res.status(404).json({ message: 'Empleado no encontrado' })
  }

  const imagePath = `data/images/employee/${employee.name}/${employee.name}.jpg`
  res.json({
    ...employee,
    imageUrl: `http://localhost:${PORT}/${imagePath}`
  })
})

app.post('/empleados', (req, res) => {
  try {
    // Validar la entrada usando Zod
    const validatedEmployee = employeeSchema.parse(req.body)

    // Verificar si el empleado ya existe
    const exists = empleados.find(emp => emp.iduniqemp === validatedEmployee.iduniqemp)
    if (exists) {
      return res.status(409).json({
        message: `El empleado con iduniqemp ${validatedEmployee.iduniqemp} ya existe.`
      })
    }

    const newEmployee = {
      id: crypto.randomUUID(), // Genera un ID único
      ...validatedEmployee
    };

    empleados.push(newEmployee)

    // Generar ruta de imagen
    const imagePath = `data/images/employee/${newEmployee.name}/${newEmployee.name}.jpg`

    res.status(201).json({
      message: 'Empleado creado',
      employee: {
        ...newEmployee,
        imageUrl: `http://localhost:${PORT}/${imagePath}`
      }
    })
  } catch (error) {
    res.status(400).json({
      message: 'Datos inválidos',
      errors: error.errors
    });
  }
});

app.patch('/empleados/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params

  // Buscar al empleado
  const employee = empleados.find(employee => employee.iduniqemp === iduniqemp)

  if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' })

  try {
    // Crear un esquema parcial para validar solo los campos enviados
    const partialEmployeeSchema = employeeSchema.partial()

    // Validar los datos enviados
    const updates = partialEmployeeSchema.parse(req.body)

    // Actualizar el empleado
    Object.assign(employee, updates)

    const imagePath = `data/images/employee/${employee.name}/${employee.name}.jpg`

    res.json({
      message: 'Empleado actualizado',
      employee: {
        ...employee,
        imageUrl: `http://localhost:${PORT}/${imagePath}`
      }
    });
  } catch (error) {
    res.status(400).json({
      message: 'Datos inválidos',
      errors: error.errors
    });
  }
});

app.delete('/empleados/:iduniqemp', (req, res) => {
  const { iduniqemp } = req.params

  // Encontrar el índice del empleado
  const index = empleados.findIndex(employee => employee.iduniqemp === iduniqemp)

  if (index === -1) {
    return res.status(404).json({ message: 'Empleado no encontrado' })
  }

  // Eliminar empleado del array
  const [deletedEmployee] = empleados.splice(index, 1)

  res.json({
    message: 'Empleado eliminado',
    employee: deletedEmployee
  })
})

app.post('/empleados/:iduniqemp/upload', upload.single('image'), (req, res) => {
  const { iduniqemp } = req.params

  // Buscar al empleado
  const employee = empleados.find(employee => employee.iduniqemp === iduniqemp)

  if (!employee) {
    return res.status(404).json({ message: 'Empleado no encontrado' })
  }

   // Crear la ruta esperada para la imagen
   const employeeImageDir = path.join(__dirname, `data/images/employee/${employee.name}`)
   const employeeImagePath = path.join(employeeImageDir, `${employee.name}.jpg`)
 
   // Verificar si el directorio del empleado existe, si no, crearlo
   if (!fs.existsSync(employeeImageDir)) {
     fs.mkdirSync(employeeImageDir, { recursive: true })
   }
 
   // Renombrar la imagen al formato esperado
   fs.rename(req.file.path, employeeImagePath, err => {
     if (err) {
       return res.status(500).json({ message: 'Error al procesar la imagen', error: err.message })
     }
 
     res.json({
       message: 'Imagen subida correctamente',
       imageUrl: `http://localhost:${PORT}/data/images/employee/${employee.name}/${employee.name}.jpg`
     })
   })
})

const PORT = process.env.PORT ?? 12348

app.listen(PORT, () => {
  console.log(`servidor escuchando en http://localhost:${PORT}`)
})

