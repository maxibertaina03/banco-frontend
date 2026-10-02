// Cómo se leen y se escriben los montos.
//
// Esto existe por un bug real: el campo de transferencia era `type="number"` y
// tomaba lo escrito con `Number()`. Alguien tecleaba "1.500" pensando en mil
// quinientos y el banco transfería **un peso con cincuenta**. En Argentina el
// punto separa miles y la coma decimales, al revés que en inglés.

import { describe, expect, it } from "vitest";
import { formatearMontoEditable, parsearMonto, totalesPorMoneda } from "../src/lib/utils/currency";

describe("parsearMonto: lo que escribe el usuario", () => {
  it("lee el punto como separador de miles, que es la convención argentina", () => {
    expect(parsearMonto("1.500")).toBe(1500);
    expect(parsearMonto("1.000.000")).toBe(1000000);
  });

  it("lee la coma como separador decimal", () => {
    expect(parsearMonto("1500,50")).toBe(1500.5);
    expect(parsearMonto("1.500,50")).toBe(1500.5);
  });

  it("acepta el punto decimal, porque mucha gente escribe así", () => {
    expect(parsearMonto("1500.50")).toBe(1500.5);
    expect(parsearMonto("0.99")).toBe(0.99);
  });

  it("rechaza más de dos decimales en vez de redondear en silencio", () => {
    // Con plata es preferible no aceptar a inventar un centavo.
    expect(parsearMonto("10,999")).toBeNull();
    expect(parsearMonto("10.9999")).toBeNull();
  });

  it("'10.999' son diez mil novecientos noventa y nueve, no diez con algo", () => {
    // Tres dígitos después del punto es separador de miles, no decimales.
    expect(parsearMonto("10.999")).toBe(10999);
  });

  it("rechaza puntos de miles mal puestos", () => {
    expect(parsearMonto("1.50")).toBe(1.5); // punto decimal, no de miles
    expect(parsearMonto("1.5000")).toBeNull();
    expect(parsearMonto("12.34.56")).toBeNull();
  });

  it("rechaza lo que no es un monto", () => {
    expect(parsearMonto("")).toBeNull();
    expect(parsearMonto("   ")).toBeNull();
    expect(parsearMonto("abc")).toBeNull();
    expect(parsearMonto("-100")).toBeNull();
    expect(parsearMonto("0")).toBeNull();
  });

  it("ignora los espacios alrededor", () => {
    expect(parsearMonto("  1.500  ")).toBe(1500);
  });
});

describe("formatearMontoEditable: lo que el botón de máximo escribe en el campo", () => {
  it("usa puntos de miles, sin centavos si son cero", () => {
    expect(formatearMontoEditable(254500)).toBe("254.500");
    expect(formatearMontoEditable(1000000)).toBe("1.000.000");
  });

  it("muestra los dos centavos cuando existen", () => {
    expect(formatearMontoEditable(1500.5)).toBe("1.500,50");
    expect(formatearMontoEditable(1500.55)).toBe("1.500,55");
  });

  it("trunca en vez de redondear: con el saldo completo, un centavo de más no entra", () => {
    // Redondeando para arriba, "usar todo el saldo" pediría más de lo que hay
    // y el backend rechazaría la operación.
    expect(formatearMontoEditable(1500.559)).toBe("1.500,55");
    expect(formatearMontoEditable(99.999)).toBe("99,99");
  });

  it("lo que escribe se puede volver a leer: el viaje de ida y vuelta no pierde plata", () => {
    for (const monto of [254500, 1500.5, 1000000, 0.99, 1234.56]) {
      expect(parsearMonto(formatearMontoEditable(monto))).toBe(monto);
    }
  });
});

describe("totalesPorMoneda", () => {
  it("no mezcla pesos con dólares", () => {
    const totales = totalesPorMoneda([
      { saldo: 1000, moneda: "ARS" },
      { saldo: 50, moneda: "USD" },
      { saldo: 500, moneda: "ARS" },
    ]);
    expect(totales).toEqual({ ARS: 1500, USD: 50 });
  });

  it("trata una cuenta sin moneda como pesos", () => {
    expect(totalesPorMoneda([{ saldo: 100 }])).toEqual({ ARS: 100, USD: 0 });
  });

  it("redondea a centavos en cada paso, para no arrastrar error de coma flotante", () => {
    const totales = totalesPorMoneda([
      { saldo: 0.1, moneda: "ARS" },
      { saldo: 0.2, moneda: "ARS" },
    ]);
    expect(totales.ARS).toBe(0.3); // 0.1 + 0.2 da 0.30000000000000004 sin redondear
  });
});
