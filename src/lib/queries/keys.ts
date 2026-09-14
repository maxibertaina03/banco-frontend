// Query keys centralizadas. Patrón de TanStack Query: arrays serializables,
// estructurados de general a específico. Permite invalidación parcial:
// `queryClient.invalidateQueries({ queryKey: queryKeys.personas.all })`
// invalida TODO lo relacionado a personas.

export const queryKeys = {
  auth: {
    perfil: ["auth", "perfil"] as const,
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
  mercado: {
    all: ["mercado"] as const,
    cotizacion: () => [...queryKeys.mercado.all, "cotizacion"] as const,
    tasas: () => [...queryKeys.mercado.all, "tasas"] as const,
  },
  cuentas: {
    all: ["cuentas"] as const,
    movimientos: (cuentaId: string, page: number) => [...queryKeys.cuentas.all, "movimientos", cuentaId, page] as const,
    resumenGastos: (cuentaId: string, periodo: string) => [...queryKeys.cuentas.all, "resumenGastos", cuentaId, periodo] as const,
  },
  tarjetas: {
    all: ["tarjetas"] as const,
    byPersona: (personaId: string) => [...queryKeys.tarjetas.all, "byPersona", personaId] as const,
    resumen: (tarjetaId: string) => [...queryKeys.tarjetas.all, "resumen", tarjetaId] as const,
  },
  prestamos: {
    all: ["prestamos"] as const,
    list: () => [...queryKeys.prestamos.all, "list"] as const,
    detalle: (prestamoId: string) => [...queryKeys.prestamos.all, "detalle", prestamoId] as const,
  },
  plazosFijos: {
    all: ["plazosFijos"] as const,
    list: () => [...queryKeys.plazosFijos.all, "list"] as const,
  },
  pagos: {
    all: ["pagos"] as const,
    empresas: () => [...queryKeys.pagos.all, "empresas"] as const,
    deuda: (empresaId: string, numeroCliente: string) => [...queryKeys.pagos.all, "deuda", empresaId, numeroCliente] as const,
    operadoras: () => [...queryKeys.pagos.all, "operadoras"] as const,
  },
};
