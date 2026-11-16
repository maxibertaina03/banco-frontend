import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarToken, olvidarToken } from "../src/features/demo/sesion-demo";

const pagos = await import("../src/features/pagos/api/pagos.api");

afterEach(() => {
  olvidarToken();
  vi.unstubAllGlobals();
});

describe("pagos en la sesión demo", () => {
  it("usa empresas simuladas sin consultar la API", async () => {
    guardarToken("orbdemo_sesion-de-prueba");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const empresas = await pagos.listarEmpresas();

    expect(empresas.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("simula pagos y recargas aunque el mock global esté desactivado", async () => {
    guardarToken("orbdemo_sesion-de-prueba");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const pago = await pagos.pagarFactura(
      { cuenta_id: "cuenta-demo", empresa_id: "edenor", numero_cliente: "123456789", factura_id: "fac-edenor-202608" },
      "clave-demo"
    );
    const recarga = await pagos.recargarCelular(
      { cuenta_id: "cuenta-demo", operadora_id: "movistar", numero: "3514123456", monto: 500 },
      "clave-demo"
    );

    expect(pago.transaccion.canal).toBe("pago_servicio");
    expect(recarga.transaccion.canal).toBe("recarga_celular");
    expect(fetch).not.toHaveBeenCalled();
  });
});
