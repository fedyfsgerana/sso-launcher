import { LayoutGrid, List } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export type ViewMode = "grid" | "list";

type ViewToggleProps = Readonly<{
  value: ViewMode;
  labels?: Readonly<{ grid: string; list: string }>;
  onChange: (value: ViewMode) => void;
}>;

const DEFAULT_LABELS = { grid: "Tampilan grid", list: "Tampilan daftar" };

export function ViewToggle({
  value,
  labels = DEFAULT_LABELS,
  onChange,
}: ViewToggleProps) {
  return (
    <div className="view-tg" role="group" aria-label="Tampilan">
      <button
        className={value === "grid" ? "on" : undefined}
        type="button"
        aria-label={labels.grid}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        <Icon icon={LayoutGrid} size={18} />
      </button>

      <button
        className={value === "list" ? "on" : undefined}
        type="button"
        aria-label={labels.list}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        <Icon icon={List} size={18} />
      </button>
    </div>
  );
}
