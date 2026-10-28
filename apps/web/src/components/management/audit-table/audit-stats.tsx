import { Activity, CalendarDays, CircleAlert, Trash2 } from "lucide-react";
import { StatCard, StatGrid } from "@/components/portal/stat-card";
import type { AuditSummary } from "@/features/audit/api";

type AuditStatsProps = Readonly<{
  summary: AuditSummary;
}>;

export function AuditStats({ summary }: AuditStatsProps) {
  return (
    <div className="page-stats">
      <StatGrid>
        <StatCard
          icon={Activity}
          label="Aktivitas hari ini"
          value={summary.today}
          tone="info"
        />
        <StatCard
          icon={CalendarDays}
          label="Aktivitas 7 hari"
          value={summary.lastSevenDays}
        />
        <StatCard
          icon={Trash2}
          label="Data dihapus 7 hari"
          value={summary.deletionsLastSevenDays}
          tone="warn"
        />
        <StatCard
          icon={CircleAlert}
          label="Aksi gagal 7 hari"
          value={summary.failedLastSevenDays}
          tone="danger"
        />
      </StatGrid>
    </div>
  );
}
