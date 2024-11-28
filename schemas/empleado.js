import { z } from 'zod';

// Definir el enum para áreas permitidas
export const areaEnum = z.enum([
  'Operaciones',
  'Comercial',
  'Contabilidad',
  'Tecnología',
  'Talento Humano',
  'Legal'
]);

// Esquema del empleado
export const employeeSchema = z.object({
  iduniqemp: z.string(),
  name: z.string(),
  cargo: z.string(),
  area: areaEnum,
  initevaluate: z.boolean()
});