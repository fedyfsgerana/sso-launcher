"use client";

import { useState } from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { Icon } from "@/components/ui/icon";

export type RowActionItem = Readonly<{
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "info" | "warn" | "danger";
  onSelect: () => void;
}>;

type RowActionMenuProps = Readonly<{
  label: string;
  items: ReadonlyArray<RowActionItem | false | null | undefined>;
  className?: string;
}>;

export function RowActionMenu({
  label,
  items: rawItems,
  className,
}: RowActionMenuProps) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const items = rawItems.filter((item): item is RowActionItem => Boolean(item));

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <button
        className={["row-act", anchor ? "is-open" : "", className ?? ""]
          .filter(Boolean)
          .join(" ")}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        title="Aksi lainnya"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        <Icon icon={Ellipsis} size={17} />
      </button>

      {anchor ? (
        <FloatingMenu
          anchor={anchor}
          width={210}
          onClose={() => setAnchor(null)}
        >
          {items.map((item) => (
            <button
              key={item.key}
              className={["mi row-menu-item", item.tone ?? ""]
                .filter(Boolean)
                .join(" ")}
              type="button"
              role="menuitem"
              onClick={() => {
                setAnchor(null);
                item.onSelect();
              }}
            >
              <Icon icon={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </FloatingMenu>
      ) : null}
    </>
  );
}
