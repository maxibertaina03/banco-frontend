// Datos y PDF del comprobante de transferencia.
//
// Las filas se arman acá, una sola vez, para que la pantalla y el PDF muestren
// exactamente lo mismo.

import { formatCurrency } from "../../../lib/utils/currency";
import type { RespuestaTransferencia } from "../types/transacciones.types";

export interface FilaComprobante {
  etiqueta: string;
  valor: string;
  /** Números largos (CBU, operación) en monoespaciada, que se leen mejor. */
  mono?: boolean;
}

/** "21/09/2026 06:45 p. m.", como en los comprobantes de los otros bancos. */
export function formatearFechaComprobante(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(",", "");
}

export function montoDelComprobante(c: RespuestaTransferencia) {
  return formatCurrency(Math.abs(Number(c.importe)), c.moneda || "ARS");
}

export function filasDelComprobante(c: RespuestaTransferencia): FilaComprobante[] {
  const filas: FilaComprobante[] = [
    { etiqueta: "N° operación", valor: c.idTransaccion, mono: true },
    { etiqueta: "Fecha", valor: formatearFechaComprobante(c.fecha) },
    { etiqueta: "Para", valor: c.nombreDestino || "—" },
    { etiqueta: "CBU destino", valor: c.cbuDestino, mono: true },
    { etiqueta: "Desde", valor: c.cbuOrigen, mono: true },
  ];
  // Opcionales: sólo si hay algo que mostrar, para no llenar de guiones.
  if (c.descripcion) filas.push({ etiqueta: "Descripción", valor: c.descripcion });
  if (c.bancoDestino) filas.push({ etiqueta: "Entidad", valor: c.bancoDestino });
  return filas;
}

// La descripción la escribe el usuario: sin escapar, un "<script>" en ese
// campo se ejecutaría en el documento que se manda a imprimir.
function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// El isotipo en línea, no como imagen: así no hay que esperar a que cargue
// antes de imprimir, y sale nítido en el PDF.
const ISOTIPO_SVG = `<svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="22" fill="none" stroke="#C4B5FD" stroke-width="10"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="#8B5CF6" stroke-width="10" stroke-linecap="round"
    stroke-dasharray="86.4 138.2" transform="rotate(-90 32 32)"/>
  <circle cx="32" cy="32" r="7" fill="#C4B5FD"/>
</svg>`;

/**
 * El comprobante como documento imprimible. Fondo blanco a propósito: un
 * fondo oscuro gasta tinta y varios navegadores no imprimen fondos por defecto.
 */
export function documentoDelComprobante(c: RespuestaTransferencia) {
  const filas = filasDelComprobante(c)
    .map(
      (f) => `<div class="fila"><span class="etiqueta">${escaparHtml(f.etiqueta)}</span>` +
        `<span class="valor${f.mono ? " mono" : ""}">${escaparHtml(f.valor)}</span></div>`
    )
    .join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Comprobante Orbital ${escaparHtml(c.idTransaccion.slice(0, 8))}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f1235; }
  .hoja { max-width: 430px; margin: 0 auto; border: 1px solid #e9d5ff; border-radius: 24px; padding: 28px 28px 22px; }
  .marca { display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; font-size: 17px; color: #4c1d95; }
  .check { width: 56px; height: 56px; margin: 22px auto 12px; border-radius: 50%;
    background: linear-gradient(135deg, #a855f7, #7c3aed); display: flex; align-items: center; justify-content: center; }
  h1 { margin: 0; text-align: center; font-size: 20px; }
  .sub { margin: 4px 0 0; text-align: center; font-size: 13px; color: #6b5b8a; }
  .monto { margin: 20px 0 18px; text-align: center; font-size: 34px; font-weight: 800; color: #6d28d9; }
  .detalle { border: 1px dashed #d8b4fe; border-radius: 16px; padding: 4px 18px; }
  .fila { display: flex; justify-content: space-between; gap: 18px; padding: 11px 0; border-bottom: 1px solid #f3e8ff; font-size: 13px; }
  .fila:last-child { border-bottom: 0; }
  .etiqueta { color: #6b5b8a; white-space: nowrap; }
  .valor { font-weight: 600; text-align: right; word-break: break-all; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12.5px; }
  .pie { margin-top: 18px; text-align: center; font-size: 11px; color: #8b7aa8; }
</style></head>
<body><div class="hoja">
  <div class="marca">${ISOTIPO_SVG}<span>Banco Orbital</span></div>
  <div class="check"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"
    stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
  <h1>¡Transferencia exitosa!</h1>
  <p class="sub">Comprobante de la operación</p>
  <div class="monto">${escaparHtml(montoDelComprobante(c))}</div>
  <div class="detalle">${filas}</div>
  <p class="pie">Banco Orbital · Este comprobante es válido como constancia de la operación.</p>
</div></body></html>`;
}

/**
 * Abre el diálogo de impresión con el comprobante, donde se elige "Guardar
 * como PDF". Se imprime desde un iframe oculto para que salga sólo el
 * comprobante y no el resto del portal.
 */
export function imprimirComprobante(c: RespuestaTransferencia) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);

  const ventana = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!ventana || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(documentoDelComprobante(c));
  doc.close();

  const limpiar = () => setTimeout(() => iframe.remove(), 0);
  ventana.addEventListener("afterprint", limpiar, { once: true });
  ventana.focus();
  ventana.print();
  // Por si el navegador no dispara afterprint.
  setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
}
