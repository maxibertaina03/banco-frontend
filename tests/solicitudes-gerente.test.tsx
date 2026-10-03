// La bandeja del gerente, de punta a punta.
//
// Es la pantalla donde una decisión acredita plata de verdad en la cuenta de
// alguien. Lo que se prueba acá es lo que no se puede ver mirando la pantalla
// un rato: que el motivo viaje sin espacios de más, que aprobar y rechazar
// peguen a endpoints distintos, y que el aviso de "listo" aparezca.
//
// A propósito NO se reemplaza `useResolverSolicitud`: se reemplaza `request`,
// que es la capa de red, y queda React Query de verdad en el medio. Si se
// mockeara el hook, el test seguiría pasando aunque alguien devuelva la
// mutación a la tarjeta —y ese es justamente el bug que tuvimos: al resolver,
// la tarjeta se desmonta, React Query descarta los callbacks de un componente
// que ya no existe y el aviso de éxito nunca se mostraba. La fila desaparecía
// sin decir nada.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.fn();

vi.mock("../src/lib/api/client", () => ({
  request: (...args: unknown[]) => request(...args),
  requestArchivo: vi.fn(),
  requestAbsolute: vi.fn(),
  nuevaClaveIdempotencia: () => "clave-fija-de-test",
  setAccessTokenProvider: vi.fn(),
  ApiError: class extends Error {},
}));

const { SeccionSolicitudes } = await import(
  "../src/features/prestamos/sections/SeccionSolicitudes"
);

function solicitud(extra: Record<string, unknown> = {}) {
  return {
    id: "pre-1",
    persona_id: "per-1",
    cuenta_id: "cta-1",
    moneda: "ARS",
    capital: 500000,
    cuotas: 12,
    tna: 85,
    cuota_mensual: 62500,
    total_a_pagar: 750000,
    estado: "pendiente_revision",
    created_at: "2026-09-28T13:00:00Z",
    situacion_al_solicitar: 3,
    solicitante: { nombre: "Ana", apellido: "Pérez", dni: "30111222", email: "ana@mail.com" },
    ...extra,
  };
}

/** La lista que devuelve la API. Cambia entre llamadas: al resolver se refresca. */
let pendientes: ReturnType<typeof solicitud>[] = [];

beforeEach(() => {
  request.mockReset();
  pendientes = [solicitud()];
  request.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === "/prestamos/pendientes") {
      return Promise.resolve({ count: pendientes.length, data: pendientes });
    }
    if (init?.method === "POST") {
      pendientes = [];
      return Promise.resolve({ ok: true });
    }
    return Promise.resolve({});
  });
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return render(<SeccionSolicitudes habilitado />, { wrapper: envoltorio });
}

/** Lo que mandó el POST de resolver, o null si nunca se llamó. */
function postDeResolver() {
  const llamada = request.mock.calls.find(([, init]) => init?.method === "POST");
  if (!llamada) return null;
  return { ruta: llamada[0] as string, cuerpo: JSON.parse(llamada[1].body as string) };
}

describe("bandeja de solicitudes del gerente", () => {
  it("muestra por qué cayó a revisión", async () => {
    montar();

    expect(await screen.findByText(/Ana Pérez/)).toBeInTheDocument();
    // El dato que define la decisión: la situación en la Central.
    expect(screen.getByText(/Riesgo medio: atrasos de hasta 180 días/)).toBeInTheDocument();
  });

  it("avisa cuando no se pudo consultar la Central, en vez de callárselo", async () => {
    pendientes = [solicitud({ situacion_al_solicitar: null })];
    montar();

    expect(await screen.findByText(/No se pudo consultar el Banco Central/)).toBeInTheDocument();
  });

  it("no deja confirmar sin un motivo de al menos 10 caracteres", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole("button", { name: /Aprobar/ }));

    const confirmar = screen.getByRole("button", { name: /Confirmar aprobación/ });
    expect(confirmar).toBeDisabled();

    await usuario.type(screen.getByRole("textbox"), "corto");
    expect(confirmar).toBeDisabled();
    expect(screen.getByText(/al menos 10 caracteres/)).toBeInTheDocument();

    await usuario.type(screen.getByRole("textbox"), " pero ahora ya no");
    expect(confirmar).toBeEnabled();
  });

  it("al aprobar pega a /aprobacion y manda el motivo sin espacios de sobra", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole("button", { name: /Aprobar/ }));
    await usuario.type(
      screen.getByRole("textbox"),
      "   cliente histórico, la deuda es de un tercero   "
    );
    await usuario.click(screen.getByRole("button", { name: /Confirmar aprobación/ }));

    await waitFor(() => expect(postDeResolver()).not.toBeNull());
    expect(postDeResolver()).toEqual({
      ruta: "/prestamos/pre-1/aprobacion",
      cuerpo: { motivo: "cliente histórico, la deuda es de un tercero" },
    });
  });

  it("rechazar pega a otro endpoint, no al de aprobar", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole("button", { name: /Rechazar/ }));
    await usuario.type(screen.getByRole("textbox"), "la situación en la Central no lo permite");
    await usuario.click(screen.getByRole("button", { name: /Confirmar rechazo/ }));

    await waitFor(() => expect(postDeResolver()).not.toBeNull());
    expect(postDeResolver()?.ruta).toBe("/prestamos/pre-1/rechazo");
  });

  it("después de resolver avisa qué pasó, aunque la fila ya no esté", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole("button", { name: /Aprobar/ }));
    await usuario.type(screen.getByRole("textbox"), "cliente histórico, lo aprobamos");
    await usuario.click(screen.getByRole("button", { name: /Confirmar aprobación/ }));

    // Esto es lo que se rompía: la tarjeta se desmonta y el aviso vive en la
    // sección, que no.
    expect(await screen.findByText(/Solicitud de Ana Pérez aprobada/)).toBeInTheDocument();
    expect(screen.getByText(/ya está acreditado en su cuenta/)).toBeInTheDocument();
  });

  it("sin solicitudes no deja la pantalla muda", async () => {
    pendientes = [];
    montar();

    expect(await screen.findByText(/No hay solicitudes esperando/)).toBeInTheDocument();
  });
});
