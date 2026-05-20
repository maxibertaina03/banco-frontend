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
  onCopyCbu: () => void;
  onIncome: () => void;
  onTransfer: () => void;
}

export const DashboardSection = memo(function DashboardSection({
  activities,
  loading,
  onAccounts,
  onActivity,
  onContacts,
  onCopyCbu,
  onIncome,
  onTransfer,
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
          onCopyCbu={onCopyCbu}
        />
      </div>

      <div className="grid gap-6">
        <RecentActivity activities={activities} loading={loading} />
      </div>
    </>
  );
});
