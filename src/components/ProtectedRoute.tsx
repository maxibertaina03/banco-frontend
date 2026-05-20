import { useUser } from "@clerk/clerk-react";
import { LoginPage } from "./LoginPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
