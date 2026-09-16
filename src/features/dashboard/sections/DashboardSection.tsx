import { memo } from "react";
import { QuickActions } from "../../../components/QuickActions";
import { RecentActivity } from "../../../components/RecentActivity";
import type { ActividadDeUsuario } from "../../../lib/api";
import type { Section } from "../../../pages/portal.config";

interface DashboardSectionProps {
  activities: ActividadDeUsuario[];
  loading: boolean;
  onIr: (section: Section) => void;
  onSelectActivity?: (id: string) => void;
}

export const DashboardSection = memo(function DashboardSection({
  activities,
  loading,
  onIr,
  onSelectActivity,
}: DashboardSectionProps) {
  return (
    <>
      <div className="mb-8">
        <QuickActions onIr={onIr} />
      </div>

      <div className="grid gap-6">
        <RecentActivity activities={activities} loading={loading} onSelect={onSelectActivity} />
      </div>
    </>
  );
});
