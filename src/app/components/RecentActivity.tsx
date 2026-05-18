import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Smartphone } from 'lucide-react';
import type { UserActivity } from '../../features/transacciones/types/transacciones.types';

interface RecentActivityProps {
  activities: UserActivity[];
  loading?: boolean;
}

const iconMap = {
  out: ArrowUpRight,
  in: ArrowDownLeft,
  transfer: ShoppingBag,
  service: Smartphone,
} as const;

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  return (
    <div className="bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3>Actividad reciente</h3>
        <button className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors">
          Ver todo
        </button>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-primary/10 bg-[#2D1548]/30 p-4 text-sm text-muted-foreground">
            Cargando movimientos...
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="rounded-xl border border-primary/10 bg-[#2D1548]/30 p-4 text-sm text-muted-foreground">
            No hay movimientos disponibles para esta persona.
          </div>
        )}

        {activities.map((activity) => {
          const Icon = iconMap[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#2D1548]/70 transition-colors cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activity.type === 'in'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : activity.type === 'out'
                      ? 'bg-[#A855F7]/20 text-[#C084FC]'
                      : 'bg-[#7C3AED]/20 text-[#A78BFA]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.recipient}</p>
              </div>

              <div className="text-right">
                <p className={`text-sm ${activity.type === 'in' ? 'text-emerald-400' : 'text-foreground'}`}>
                  {activity.amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.date} {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
