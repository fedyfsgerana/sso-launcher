"use client";

import { ActiveBadge } from "@/components/ui/status-badge";
import { PickCheck } from "@/components/management/pick-check";
import { MenuAccessRowItem } from "@/components/management/group-menu/menu-access-row";
import type { GroupMenuAccessController } from "@/features/groups/use-group-menu-access";
import type { MenuAccessColumn as Column } from "@/features/groups/menu-access";
import styles from "./group-menu.module.css";

type MenuAccessColumnProps = Readonly<{
  column: Column;
  controller: GroupMenuAccessController;
}>;

export function MenuAccessColumn({
  column,
  controller,
}: MenuAccessColumnProps) {
  const { section } = column;
  const count = column.rows.filter((row) =>
    controller.isSelected(row.menu.id),
  ).length;

  return (
    <section className={`card ${styles.column}`}>
      <header className={styles.colHead}>
        {section && section.descendants.length > 0 ? (
          <PickCheck
            checked={section.descendants.every(controller.isSelected)}
            indeterminate={section.descendants.some(controller.isSelected)}
            label={`Pilih semua menu di bagian ${section.menu.label}`}
            onChange={(checked) => controller.toggleMenu(section, checked)}
          />
        ) : null}
        <b>{section?.menu.label ?? "Tanpa Bagian"}</b>
        {section && !section.menu.isActive ? (
          <ActiveBadge active={false} />
        ) : null}
        <span
          className={
            column.rows.length > 0 && count === column.rows.length
              ? `${styles.count} ${styles.countFull}`
              : styles.count
          }
        >
          {count}/{column.rows.length}
        </span>
      </header>

      {column.rows.length === 0 ? (
        <p className={styles.empty}>Belum ada menu di bagian ini.</p>
      ) : (
        <ul className={styles.list}>
          {column.rows.map((row) => (
            <MenuAccessRowItem
              key={row.menu.id}
              row={row}
              inSection={Boolean(section)}
              controller={controller}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
