import type { RolDePortal } from "../features/personas/types/personas.types";

export type Section =
  | "dashboard"
  | "cuentas"
  | "transacciones"
  | "cambio"
  | "tarjetas"
  | "prestamos"
  | "inversiones"
  | "pagos"
  | "destinatarios"
  | "admin";

export const roleLabels: Record<RolDePortal, string> = {
  admin: "Admin",
  auditor: "Auditor",
  cliente: "Cliente",
  operador: "Operador",
  tesoreria: "Tesoreria",
};

export function getSectionItems(scope: "user" | "admin") {
  return [
    { key: "dashboard" as const, label: "Resumen" },
    { key: "cuentas" as const, label: "Cuentas" },
    { key: "transacciones" as const, label: "Transferir" },
    { key: "pagos" as const, label: "Pagos" },
    { key: "cambio" as const, label: "Dólares" },
    { key: "tarjetas" as const, label: "Tarjetas" },
    { key: "prestamos" as const, label: "Préstamos" },
    { key: "inversiones" as const, label: "Inversiones" },
    { key: "destinatarios" as const, label: "Destinatarios" },
    ...(scope === "admin" ? [{ key: "admin" as const, label: "Admin" }] : []),
  ];
}
