import { z } from "zod";

// Mismas reglas que `completarPerfilSchema` en banco-backend `auth-router.js`.
export const completarPerfilSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  apellido: z.string().trim().min(1, "Requerido"),
  dni: z
    .string()
    .trim()
    .min(7, "DNI muy corto")
    .max(10, "DNI muy largo")
    .regex(/^\d+$/, "Solo números"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  telefono: z.string().trim().min(6, "Teléfono muy corto"),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .refine((v) => {
      const date = new Date(v);
      return !isNaN(date.getTime()) && date < new Date();
    }, "Fecha inválida o futura"),
});

export type FormularioCompletarPerfil = z.infer<typeof completarPerfilSchema>;
