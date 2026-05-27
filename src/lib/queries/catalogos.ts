import { useQueries, useQuery } from "@tanstack/react-query";
import { listTiposCuenta } from "../../features/cuentas/api/cuentas.api";
import { listCentralBanks, listRoles } from "../../features/personas/api/personas.api";
import { listTiposTransaccion } from "../../features/transacciones/api/transacciones.api";
import { queryKeys } from "./keys";

// Catálogos: datos que cambian muy raramente. Stale time alto.
const CATALOG_STALE_TIME = 15 * 60_000; // 15 min

export function useTiposCuenta(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.tiposCuenta(),
    queryFn: () => listTiposCuenta(),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useTiposTransaccion(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.tiposTransaccion(),
    queryFn: () => listTiposTransaccion(),
    enabled: options.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useRoles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.catalogos.roles(),
    queryFn: () => listRoles(),
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
export function useInternalCatalogs(options: { enabled?: boolean; bankEnvironment?: string } = {}) {
  const enabled = options.enabled ?? true;
  const env = options.bankEnvironment ?? "test";

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.catalogos.roles(),
        queryFn: () => listRoles(),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: queryKeys.catalogos.tiposCuenta(),
        queryFn: () => listTiposCuenta(),
        enabled,
        staleTime: CATALOG_STALE_TIME,
      },
      {
        queryKey: queryKeys.catalogos.tiposTransaccion(),
        queryFn: () => listTiposTransaccion(),
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
