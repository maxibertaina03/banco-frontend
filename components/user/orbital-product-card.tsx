export function OrbitalProductCard() {
  return (
    <div className="orbital-product-card">
      <div className="orbital-product-card__glow" />
      <div className="orbital-product-card__content">
        <div className="orbital-product-card__header">
          <div className="orbital-product-card__brand">
            <span className="orbital-product-card__brand-badge">O</span>
            <span>Orbital</span>
          </div>
          <span className="orbital-product-card__lock">Sec</span>
        </div>

        <div className="orbital-product-card__body">
          <div>
            <p className="orbital-product-card__label">Producto conectado</p>
            <p className="orbital-product-card__title">Tarjetas en integración</p>
          </div>

          <div className="orbital-product-card__footer">
            <p className="orbital-product-card__label">Estado</p>
            <p className="orbital-product-card__title">Hoy Orbital expone cuentas y movimientos reales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
