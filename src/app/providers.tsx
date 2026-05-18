import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router";

interface AppProvidersProps {
  children: ReactNode;
}

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <BrowserRouter>{children}</BrowserRouter>
    </ClerkProvider>
  );
}
