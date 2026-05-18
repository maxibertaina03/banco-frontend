export { setAccessTokenProvider } from "./api/client";

export const PREFERRED_PERSONA_ID = import.meta.env.VITE_PERSONA_ID || "";
export const PREFERRED_PERSONA_EMAIL = import.meta.env.VITE_PERSONA_EMAIL || "";

export * from "../features/personas/api/personas.api";
export * from "../features/cuentas/api/cuentas.api";
export * from "../features/destinatarios/api/destinatarios.api";
export * from "../features/transacciones/api/transacciones.api";
