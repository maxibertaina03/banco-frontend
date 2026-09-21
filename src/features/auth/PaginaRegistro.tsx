import { SignUp } from "@clerk/clerk-react";
import { LayoutAcceso } from "./LayoutAcceso";

export function PaginaRegistro() {
  return (
    <LayoutAcceso
      titulo="Abrí tu cuenta y ponete en órbita."
      bajada="En un minuto tenés tu caja de ahorro con CBU propio, lista para transferir."
    >
      {/* Antes el registro abría la página hospedada de Clerk, en inglés y sin
          nuestra marca. Embebido acá, se ve igual que el ingreso. */}
      <SignUp routing="path" path="/registro" signInUrl="/ingresar" />
    </LayoutAcceso>
  );
}
