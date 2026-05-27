import { z } from "zod";

// El campo `cbuDestino` se completa por el lookup en Brocoly (no es input
// directo del usuario), pero igual lo validamos al enviar.
export const transferSchema = z.object({
  cuentaOrigenId: z.string().min(1, "Seleccioná una cuenta origen"),
  cbuDestino: z
    .string()
    .regex(/^\d{22}$/, "CBU destino inválido (deben ser 22 dígitos)"),
  monto: z
    .string()
    .min(1, "Ingresá un monto")
    .refine((v) => {
      const n = Number(v);
      return !isNaN(n) && n > 0;
    }, "El monto debe ser mayor a cero"),
  descripcion: z.string().trim().max(140, "Máximo 140 caracteres").optional().default(""),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
