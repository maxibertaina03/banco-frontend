import { useQueries, useQuery } from "@tanstack/react-query";
import { listarTiposDeCuenta } from "../../features/cuentas/api/cuentas.api";
import { listCentralBanks, listarRoles } from "../../features/personas/api/personas.api";
import { listarTiposDeTransaccion } from "../../features/transacciones/api/transacciones.api";
import { queryKeys } from "./keys";

// Catálogos: datos que cambian muy raramente. Stale time alto.
const CATALOG_STALE_TIME = 15 * 60_000; // 15 min

export function useTiposDeCuenta(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.tiposCuenta(),
    queryFn: () => listarTiposDeCuenta(),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useTiposDeTransaccion(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.tiposTransaccion(),
    queryFn: () => listarTiposDeTransaccion(),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useRoles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.roles(),
    queryFn: () => listarRoles(),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useCentralBanks(environment: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.bancos(environment),
    queryFn: () => listCentralBanks(environment),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

// Composición: trae los 4 catálogos en paralelo. Útil para el panel admin
// donde se necesitan todos juntos.
export function useCatalogosInternos(options: { enabled?: boolean; bankEnvironment?: string } = {}) {
  const enabled = options.enabled ?? true;
  const env = options.bankEnvironment ?? "test";

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.catalogos.roles(),
        queryFn: () => listarRoles(),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: queryKeys.catalogos.tiposCuenta(),
        queryFn: () => listarTiposDeCuenta(),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: queryKeys.catalogos.tiposTransaccion(),
        queryFn: () => listarTiposDeTransaccion(),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: queryKeys.catalogos.bancos(env),
        queryFn: () => listCentralBanks(env),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
    ],
  });

  const [roles, tiposCuenta, tiposTransaccion, bancos] = results;

  return {
    roles: roles.data ?? [],
    tiposCuenta: tiposCuenta.data ?? [],
    tiposTransaccion: tiposTransaccion.data ?? [],
    bancos: bancos.data ?? [],
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    failed: results.some((r) => r.isError),
  };
}
