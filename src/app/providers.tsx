import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/queryClient";

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

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
        {isDev && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
      </QueryClientProvider>
    </ClerkProvider>
  );
}
