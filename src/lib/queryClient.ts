import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api/client";

// Defaults sensatos para una app bancaria:
// - staleTime 30s: los datos se consideran frescos por 30s (evita refetch en cada hover/focus).
// - gcTime 5min: las queries inactivas viven 5min en cache antes de descartarse.
// - retry: 1 reintento, pero NO para errores 4xx (input del usuario / auth).
// - refetchOnWindowFocus: true en producción (datos sensibles cambian rápido).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
