// El botón de compra y venta máxima, de punta a punta.
//
// Es la pantalla donde un error cuesta plata: si el botón escribiera un monto
// mal formateado, el campo lo leería como otra cifra. Ya pasó con el separador
// de miles.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// La cotización y la mutación de cambio salen por la red: se reemplazan para
// que el test no dependa de un servidor.
vi.mock("../src/lib/queries", () => ({
  useCotizacion: () => ({
    data: { compra: 1490, venta: 1540, fecha_actualizacion: "2026-10-02T12:00:00Z", desde_respaldo: false },
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useCambioDeDivisa: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, reset: vi.fn() }),
}));

const { SeccionCambio } = await import("../src/features/cambio/sections/SeccionCambio");

const perfil = {
  persona: { id: "p1", nombre: "Maximo", apellido: "Bertaina" },
  cuentas: [
    { id: "ars", moneda: "ARS", saldo: "254500.00", activa: true },
    { id: "usd", moneda: "USD", saldo: "1205.50", activa: true },
  ],
  usuario: null,
  destinatarios: [],
  roles: [],
} as never;

function envolver(children: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function montar() {
  return render(envolver(<SeccionCambio perfil={perfil} onIrACuentas={() => {}} />));
}

describe("compra y venta máxima", () => {
  beforeEach(() => vi.clearAllMocks());

  it("llena el campo con todo el saldo en pesos al comprar", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole("button", { name: /compra máxima/i }));

    expect(screen.getByPlaceholderText("0,00")).toHaveValue("254.500");
  });

  it("al vender usa el saldo en dólares, no el de pesos", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole("button", { name: /vender usd/i }));
    await usuario.click(screen.getByRole("button", { name: /venta máxima/i }));

    // 1205.50 dólares, no 254500 pesos.
    expect(screen.getByPlaceholderText("0,00")).toHaveValue("1.205,50");
  });

  it("el monto que escribe se interpreta bien: muestra la conversión correcta", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole("button", { name: /compra máxima/i }));

    // 254500 pesos ÷ 1540 (precio de venta del banco) = 165,25 dólares.
    // Si el campo leyera "254.500" como 254,5 esto daría centavos.
    await waitFor(() => expect(screen.getByText(/US\$\s?165,25/)).toBeInTheDocument());
  });

  it("se apaga cuando ya estás al máximo, para no repetir el clic", async () => {
    const usuario = userEvent.setup();
    montar();

    const boton = screen.getByRole("button", { name: /compra máxima/i });
    expect(boton).toBeEnabled();

    await usuario.click(boton);

    await waitFor(() => expect(boton).toBeDisabled());
  });

  it("deja confirmar cuando el monto es válido", async () => {
    const usuario = userEvent.setup();
    montar();

    expect(screen.getByRole("button", { name: /confirmar compra/i })).toBeDisabled();

    await usuario.click(screen.getByRole("button", { name: /compra máxima/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /confirmar compra/i })).toBeEnabled());
  });

  it("avisa si el monto escrito supera el saldo", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.type(screen.getByPlaceholderText("0,00"), "999.999");

    await waitFor(() => expect(screen.getByText(/no te alcanza el saldo/i)).toBeInTheDocument());
  });
});
