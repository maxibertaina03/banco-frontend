import { z } from "zod";

// Edición de datos personales del perfil ya completo. Todos los campos son
// opcionales pero al menos uno tiene que venir (refine al final).
export const editProfileSchema = z
  .object({
    nombre: z.string().trim().min(1, "Requerido").optional(),
    apellido: z.string().trim().min(1, "Requerido").optional(),
    telefono: z.string().trim().min(6, "Teléfono muy corto").optional(),
    email: z.string().trim().toLowerCase().email("Email inválido").optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined && v !== ""), {
    message: "Modificá al menos un campo",
  });

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
