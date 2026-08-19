import { z } from "zod";

// Alias Brocoly: letras, números, puntos y guiones — mismo regex que el
// backend (banco-backend `central-bank-router.js`).
const aliasRegex = /^[A-Za-z0-9.\-]+$/;

export const destinatarioSchema = z.object({
  alias: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres")
    .refine((v) => v === "" || aliasRegex.test(v), {
      message: "Solo letras, números, puntos y guiones",
    })
    .optional()
    .default(""),
  cbu: z
    .string()
    .trim()
    .regex(/^\d{22}$/, "El CBU debe tener exactamente 22 dígitos"),
  banco: z.string().trim().max(100, "Máximo 100 caracteres").optional().default(""),
});

export type FormularioDestinatario = z.infer<typeof destinatarioSchema>;
