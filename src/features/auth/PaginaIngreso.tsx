import { SignIn } from "@clerk/clerk-react";
import { LayoutAcceso } from "./LayoutAcceso";

export function PaginaIngreso() {
  return (
    <LayoutAcceso
      titulo="Tu dinero, siempre en órbita."
      bajada="La banca digital que va a tu ritmo: todo lo que necesitás, en un solo lugar."
    >
      {/* `routing="path"`: los pasos intermedios (verificar el código, elegir
          método) quedan bajo /ingresar en vez de salir a la página de Clerk. */}
      <SignIn routing="path" path="/ingresar" signUpUrl="/registro" />
    </LayoutAcceso>
  );
}
