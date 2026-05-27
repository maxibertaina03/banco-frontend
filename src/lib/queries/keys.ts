// Query keys centralizadas. Patrón de TanStack Query: arrays serializables,
// estructurados de general a específico. Permite invalidación parcial:
// `queryClient.invalidateQueries({ queryKey: queryKeys.personas.all })`
// invalida TODO lo relacionado a personas.

export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
  },
  personas: {
    all: ["personas"] as const,
    list: () => [...queryKeys.personas.all, "list"] as const,
    full: (personaId: string) => [...queryKeys.personas.all, "full", personaId] as const,
    audit: (usuarioId: string) => [...queryKeys.personas.all, "audit", usuarioId] as const,
  },
  transacciones: {
    all: ["transacciones"] as const,
    byPersona: (personaId: string) => [...queryKeys.transacciones.all, "byPersona", personaId] as const,
    byCuenta: (cuentaId: string) => [...queryKeys.transacciones.all, "byCuenta", cuentaId] as const,
  },
  catalogos: {
    all: ["catalogos"] as const,
    roles: () => [...queryKeys.catalogos.all, "roles"] as const,
    tiposCuenta: () => [...queryKeys.catalogos.all, "tiposCuenta"] as const,
    tiposTransaccion: () => [...queryKeys.catalogos.all, "tiposTransaccion"] as const,
    bancos: (environment: string) => [...queryKeys.catalogos.all, "bancos", environment] as const,
  },
};
