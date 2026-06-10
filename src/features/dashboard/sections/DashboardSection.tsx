import { memo } from "react";
import { QuickActions } from "../../../components/QuickActions";
import { RecentActivity } from "../../../components/RecentActivity";
import type { UserActivity } from "../../../lib/api";

interface DashboardSectionProps {
  activities: UserActivity[];
  loading: boolean;
  onAccounts: () => void;
  onActivity: () => void;
  onContacts: () => void;
  onIncome: () => void;
  onTransfer: () => void;
  onSelectActivity?: (id: string) => void;
}

export const DashboardSection = memo(function DashboardSection({
  activities,
  loading,
  onAccounts,
  onActivity,
  onContacts,
  onIncome,
  onTransfer,
  onSelectActivity,
}: DashboardSectionProps) {
  return (
    <>
      <div className="mb-8">
        <QuickActions
          onTransfer={onTransfer}
          onAccounts={onAccounts}
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
