const { z } = require('zod');

// Definir el enum para áreas permitidas
const areaEnum = z.enum([
  'Operaciones',
  'Comercial',
  'Contabilidad',
  'Tecnología',
  'Talento Humano',
  'Legal'
]);

// Esquema del empleado
const employeeSchema = z.object({
  iduniqemp: z.string(),
  name: z.string(),
  cargo: z.string(),
  area: areaEnum,
  initevaluate: z.boolean()
});

module.exports = { employeeSchema };