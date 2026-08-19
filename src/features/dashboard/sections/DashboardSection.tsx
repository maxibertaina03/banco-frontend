import { memo } from "react";
import { QuickActions } from "../../../components/QuickActions";
import { RecentActivity } from "../../../components/RecentActivity";
import type { ActividadDeUsuario } from "../../../lib/api";

interface DashboardSectionProps {
  activities: ActividadDeUsuario[];
  loading: boolean;
  onCuentas: () => void;
  onActivity: () => void;
  onContacts: () => void;
  onIncome: () => void;
  onTransferir: () => void;
  onSelectActivity?: (id: string) => void;
}

export const DashboardSection = memo(function DashboardSection({
  activities,
  loading,
  onCuentas,
  onActivity,
  onContacts,
  onIncome,
  onTransferir,
  onSelectActivity,
}: DashboardSectionProps) {
  return (
    <>
      <div className="mb-8">
        <QuickActions
          onTransferir={onTransferir}
          onCuentas={onCuentas}
          onContacts={onContacts}
          onActivity={onActivity}
          onIncome={onIncome}
        />
      </div>

      <div className="grid gap-6">
        <RecentActivity activities={activities} loading={loading} onSelect={onSelectActivity} />
      </div>
    </>
  );
});
