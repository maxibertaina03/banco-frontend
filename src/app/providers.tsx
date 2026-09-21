import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, useNavigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/queryClient";
import { aparienciaClerk, localizacion } from "../features/auth/clerk-config";

interface AppProvidersProps {
  children: ReactNode;
}

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isDev = import.meta.env.DEV;

if (!clerkPublishableKey) {
  throw new Error(
    "Falta VITE_CLERK_PUBLISHABLE_KEY. Configúrala en banco-frontend/.env.local y reinicia Vite.",
  );
}

/**
 * Clerk navega con nuestro router y no con recargas de página.
 *
 * Por eso el router va por fuera: `useNavigate` sólo existe adentro de él. Las
 * URLs de ingreso y registro apuntan a nuestras rutas; sin ellas, el link
 * "Registrate" mandaba a la página hospedada de Clerk.
 */
function ClerkConRouter({ children }: AppProvidersProps) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/ingresar"
      signUpUrl="/registro"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/ingresar"
      localization={localizacion}
      appearance={aparienciaClerk}
    >
      {children}
    </ClerkProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <ClerkConRouter>
        <QueryClientProvider client={queryClient}>
          {children}
          {isDev && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
        </QueryClientProvider>
      </ClerkConRouter>
    </BrowserRouter>
  );
}
