"use client";

import { History, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export type AuditTab = "activity" | "trash";

type AuditTabsProps = Readonly<{
  tab: AuditTab;
  onChange: (tab: AuditTab) => void;
}>;

const TABS = [
  { key: "activity", label: "Aktivitas", icon: History },
  { key: "trash", label: "Tempat Sampah", icon: Trash2 },
] as const;

export function AuditTabs({ tab, onChange }: AuditTabsProps) {
  return (
    <div className="tab-bar">
      <div className="segs" role="tablist" aria-label="Bagian riwayat">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "seg on" : "seg"}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => onChange(item.key)}
          >
            <Icon icon={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
