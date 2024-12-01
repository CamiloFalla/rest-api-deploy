import { z } from 'zod';

export const areaEnum = z.enum([
  'Operaciones',
  'Comercial',
  'Contabilidad',
  'Tecnología',
  'Talento Humano',
  'Legal',
]);

export const employeeSchema = z.object({
  id_cargo: z.number(),
  nombre: z.string(),
  apellidos: z.string(),
  username: z.string(),
  email: z.string(),
  fecha_nacimiento: z.string(),
  fecha_ingreso: z.string(),
  residencia: z.string(),
  ciudad_residencia: z.string(),
  estrato: z.number(),
  activo: z.boolean(),
});