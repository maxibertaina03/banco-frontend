import { z } from "zod";
import { parsearMonto } from "../utils/currency";

// El campo `cbuDestino` se completa por el lookup en Brocoly (no es input
// directo del usuario), pero igual lo validamos al enviar.
export const transferenciaSchema = z.object({
  cuentaOrigenId: z.string().min(1, "Seleccioná una cuenta origen"),
  cbuDestino: z
    .string()
    .regex(/^\d{22}$/, "CBU destino inválido (deben ser 22 dígitos)"),
  monto: z
    .string()
    .min(1, "Ingresá un monto")
    // Con Number(), "1.500" daba 1,5: se transferían $1,50 en vez de mil quinientos.
    .refine((v) => parsearMonto(v) !== null, "Ingresá un monto válido, por ejemplo 1.500 o 1500,50"),
  descripcion: z.string().trim().max(140, "Máximo 140 caracteres").optional().default(""),
});

export type FormularioTransferencia = z.infer<typeof transferenciaSchema>;
