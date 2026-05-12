import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaccion } from '@/types/banking';

type OrbitalRecentActivityProps = {
  activities: Transaccion[];
  loading?: boolean;
};

function getActivityVariant(activity: Transaccion) {
  if (activity.canal === 'interbancaria_entrante') {
    return {
      icon: 'In',
      className: 'is-in',
    };
  }

  if (activity.cuenta_destino_id) {
    return {
      icon: 'Tr',
      className: 'is-transfer',
    };
  }

  return {
    icon: 'Out',
    className: 'is-out',
  };
}

export function OrbitalRecentActivity({
  activities,
  loading = false,
}: OrbitalRecentActivityProps) {
  return (
    <div className="orbital-activity-card">
      <div className="orbital-activity-card__header">
        <h3>Actividad reciente</h3>
      </div>

      <div className="orbital-activity-list">
        {loading ? (
          <div className="orbital-empty-inline">Cargando movimientos...</div>
        ) : null}

        {!loading && activities.length === 0 ? (
          <div className="orbital-empty-inline">No hay movimientos disponibles para esta persona.</div>
        ) : null}

        {activities.map((activity) => {
          const variant = getActivityVariant(activity);

          return (
            <article key={activity.id} className="orbital-activity-row">
              <div className={`orbital-activity-row__icon ${variant.className}`}>
                <span>{variant.icon}</span>
              </div>

              <div className="orbital-activity-row__body">
                <p>{activity.tipo_transaccion_nombre || 'Operación'}</p>
                <span>{activity.descripcion || 'Sin descripción adicional'}</span>
              </div>

              <div className="orbital-activity-row__amount">
                <strong>{formatCurrency(activity.monto)}</strong>
                <span>{formatDate(activity.created_at)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
