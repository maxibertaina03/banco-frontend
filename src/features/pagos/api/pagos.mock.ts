// Mock en memoria de las rutas de servicios y recargas del banco. Reproduce el
// contrato, incluidos los errores que la pantalla tiene que saber mostrar:
//   - número de celular terminado en 0000 → 502, la operadora rechaza
//   - factura ya pagada → 409
//   - cliente al día → 200 con lista vacía
// No mueve saldo: eso sólo lo puede hacer el backend real.

import { ApiError, nuevaClaveIdempotencia } from "../../../lib/api/client";
import type {
  DeudaDeCliente,
  EmpresaServicio,
  Factura,
  Operadora,
  ResultadoPagoServicio,
  ResultadoRecarga,
  Rubro,
} from "../types/pagos.types";

const EMPRESAS: EmpresaServicio[] = [
  { id: "edenor", nombre: "Edenor", rubro: "luz", formato_numero_cliente: "9 dígitos" },
  { id: "metrogas", nombre: "Metrogas", rubro: "gas", formato_numero_cliente: "11 dígitos" },
  { id: "aysa", nombre: "AySA", rubro: "agua", formato_numero_cliente: "9 dígitos" },
  { id: "fibertel", nombre: "Fibertel", rubro: "internet", formato_numero_cliente: "10 dígitos" },
  { id: "personal", nombre: "Personal Flow", rubro: "telefonia", formato_numero_cliente: "10 dígitos" },
  { id: "directv", nombre: "DirecTV", rubro: "cable", formato_numero_cliente: "9 dígitos" },
];

const facturas: Factura[] = [
  { id: "fac-edenor-202608", empresa_id: "edenor", numero_cliente: "123456789", periodo: "2026-08", monto: 45320.75, vencimiento: "2026-09-20", estado: "impaga" },
  { id: "fac-edenor-202607", empresa_id: "edenor", numero_cliente: "123456789", periodo: "2026-07", monto: 38900.1, vencimiento: "2026-08-20", estado: "vencida" },
  { id: "fac-metrogas-202608", empresa_id: "metrogas", numero_cliente: "11122233344", periodo: "2026-08", monto: 12480, vencimiento: "2026-09-15", estado: "impaga" },
  { id: "fac-aysa-202608", empresa_id: "aysa", numero_cliente: "987654321", periodo: "2026-08", monto: 8750.5, vencimiento: "2026-09-25", estado: "impaga" },
  { id: "fac-fibertel-202608", empresa_id: "fibertel", numero_cliente: "1122334455", periodo: "2026-08", monto: 32000, vencimiento: "2026-09-10", estado: "impaga" },
];

const OPERADORAS: Operadora[] = [
  { id: "movistar", nombre: "Movistar", montos_disponibles: [500, 1000, 2000, 5000, 10000] },
  { id: "personal", nombre: "Personal", montos_disponibles: [500, 1000, 2000, 5000] },
  { id: "claro", nombre: "Claro", montos_disponibles: [300, 500, 1000, 2000, 5000, 10000] },
  { id: "tuenti", nombre: "Tuenti", montos_disponibles: [200, 500, 1000] },
];

const demora = <T,>(valor: T) => new Promise<T>((resolve) => setTimeout(() => resolve(valor), 350));
const fallar = (status: number, error: string) => {
  throw new ApiError(error, { status, payload: { error } });
};

function transaccionFalsa(cuentaId: string, monto: number, canal: "pago_servicio" | "recarga_celular", descripcion: string) {
  const ahora = new Date().toISOString();
  return {
    id: nuevaClaveIdempotencia(),
    tipo_transaccion_id: "mock",
    cuenta_origen_id: cuentaId,
    cuenta_destino_id: null,
    monto,
    descripcion,
    estado: "completada" as const,
    canal,
    created_at: ahora,
  };
}

export function listarEmpresas(rubro?: Rubro) {
  return demora(rubro ? EMPRESAS.filter((e) => e.rubro === rubro) : EMPRESAS);
}

export async function consultarDeuda(empresaId: string, numeroCliente: string): Promise<DeudaDeCliente> {
  const empresa = EMPRESAS.find((e) => e.id === empresaId);
  if (!empresa) fallar(404, "La empresa no existe.");
  const deuda = facturas.filter(
    (f) => f.empresa_id === empresaId && f.numero_cliente === numeroCliente && f.estado !== "pagada"
  );
  const total = Math.round(deuda.reduce((acc, f) => acc + f.monto * 100, 0)) / 100;
  return demora({ empresa: empresa!, numero_cliente: numeroCliente, total_adeudado: total, facturas: deuda.map((f) => ({ ...f })) });
}

export async function pagarFactura(payload: {
  cuenta_id: string;
  empresa_id: string;
  numero_cliente: string;
  factura_id: string;
}): Promise<ResultadoPagoServicio> {
  const factura = facturas.find((f) => f.id === payload.factura_id && f.empresa_id === payload.empresa_id);
  if (!factura) fallar(404, "La factura no existe.");
  if (factura!.estado === "pagada") fallar(409, "La factura ya estaba pagada.");
  factura!.estado = "pagada";
  return demora({
    transaccion: transaccionFalsa(payload.cuenta_id, factura!.monto, "pago_servicio", `Pago ${payload.empresa_id} ${factura!.periodo}`),
    factura: { ...factura! },
    comprobante: `PAG-${Date.now().toString().slice(-9)}`,
    fecha_pago: new Date().toISOString(),
  });
}

export function listarOperadoras() {
  return demora(OPERADORAS);
}

export async function recargarCelular(payload: {
  cuenta_id: string;
  operadora_id: string;
  numero: string;
  monto: number;
}): Promise<ResultadoRecarga> {
  const operadora = OPERADORAS.find((o) => o.id === payload.operadora_id);
  if (!operadora) fallar(404, "La operadora no existe.");
  if (!/^\d{10}$/.test(payload.numero)) fallar(400, "El número tiene que tener 10 dígitos.");
  if (!operadora!.montos_disponibles.includes(payload.monto)) {
    fallar(400, `${operadora!.nombre} no acepta ese monto. Disponibles: ${operadora!.montos_disponibles.join(", ")}.`);
  }
  if (payload.numero.endsWith("0000")) fallar(502, "La operadora rechazó la recarga para ese número.");
  return demora({
    transaccion: transaccionFalsa(payload.cuenta_id, payload.monto, "recarga_celular", `Recarga ${operadora!.nombre} ${payload.numero}`),
    recarga: {
      id: `rec-${Date.now().toString().slice(-9)}`,
      operadora: operadora!.nombre,
      numero: payload.numero,
      monto: payload.monto,
      estado: "acreditada",
      fecha: new Date().toISOString(),
    },
  });
}
