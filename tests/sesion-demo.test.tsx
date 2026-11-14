// La sesión de prueba del lado del navegador.
//
// Lo que se cuida acá es que el modo demo no le cueste nada al cliente real:
// sin token de prueba todo sigue pasando por Clerk, igual que antes. Y que con
// token de prueba el portal deje entrar sin Clerk, que es el pedido de la
// cátedra: que al leer un QR ya quede como cliente.

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Clerk de mentira. Va dentro de `vi.hoisted` porque `vi.mock` se eleva por
// encima de todo el archivo: con un `const` común, la fábrica del mock lo
// tocaría antes de que exista.
const { clerk, setAccessTokenProvider } = vi.hoisted(() => ({
  clerk: {
    isLoaded: true,
    isSignedIn: false as boolean,
    getToken: vi.fn(async () => "token-de-clerk"),
    signOut: vi.fn(),
  },
  setAccessTokenProvider: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({ useAuth: () => clerk }));
vi.mock("../src/lib/api/client", () => ({ setAccessTokenProvider, request: vi.fn() }));

const { useSesion } = await import("../src/hooks/useSesion");
const { ProtectedRoute } = await import("../src/components/ProtectedRoute");
const { guardarToken, olvidarToken, leerToken } = await import("../src/features/demo/sesion-demo");

const TOKEN = "orbdemo_deadbeef";

/**
 * El árbol con la ruta de ingreso definida.
 *
 * No es decorativo: sin un `/ingresar` que renderice algo, el `<Navigate>` de
 * ProtectedRoute vuelve a caer en sí mismo, recalcula el `redirect_url` con la
 * URL anterior adentro y entra en un bucle infinito que cuelga el test. En la
 * app real la ruta existe, así que el bucle no se da.
 */
function montar(children: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ProtectedRoute>{children}</ProtectedRoute>} />
        <Route path="/ingresar" element={<p>pantalla de ingreso</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function Espia() {
  const s = useSesion();
  return <p data-testid="estado">{`${s.isSignedIn}|${s.esDemo}|${s.isLoaded}`}</p>;
}

beforeEach(() => {
  olvidarToken();
  clerk.isSignedIn = false;
  setAccessTokenProvider.mockClear();
});
afterEach(() => olvidarToken());

describe("useSesion", () => {
  it("sin token de prueba delega en Clerk", () => {
    clerk.isSignedIn = true;
    render(<MemoryRouter><Espia /></MemoryRouter>);
    expect(screen.getByTestId("estado")).toHaveTextContent("true|false|true");
  });

  it("con token de prueba entra aunque Clerk diga que no hay sesión", () => {
    guardarToken(TOKEN);
    render(<MemoryRouter><Espia /></MemoryRouter>);
    expect(screen.getByTestId("estado")).toHaveTextContent("true|true|true");
  });

  it("el token de prueba le gana al de Clerk", async () => {
    guardarToken(TOKEN);
    clerk.isSignedIn = true;
    const { result } = await (async () => {
      let valor: string | null = null;
      function Pide() {
        const { getToken } = useSesion();
        void getToken().then((t) => { valor = t; });
        return null;
      }
      render(<MemoryRouter><Pide /></MemoryRouter>);
      await waitFor(() => expect(valor).not.toBeNull());
      return { result: valor };
    })();
    expect(result).toBe(TOKEN);
  });
});

describe("ProtectedRoute", () => {
  it("deja pasar al visitante de prueba y le pone su token en el cliente HTTP", async () => {
    guardarToken(TOKEN);

    montar(<p>el portal</p>);

    expect(await screen.findByText("el portal")).toBeInTheDocument();
    // Si esto no se llama, las queries salen sin Authorization y todo da 401.
    await waitFor(() => expect(setAccessTokenProvider).toHaveBeenCalled());
  });

  it("sin sesión de ninguna clase manda a ingresar", async () => {
    montar(<p>el portal</p>);

    expect(await screen.findByText("pantalla de ingreso")).toBeInTheDocument();
    expect(screen.queryByText("el portal")).not.toBeInTheDocument();
  });

  it("un cliente real sigue entrando por Clerk, sin tocar el modo prueba", async () => {
    clerk.isSignedIn = true;

    montar(<p>el portal</p>);

    expect(await screen.findByText("el portal")).toBeInTheDocument();
    expect(leerToken()).toBeNull();
  });
});
