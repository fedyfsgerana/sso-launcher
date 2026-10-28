"use client";

import { PickCheck } from "@/components/management/pick-check";
import { MenuActionChips } from "@/components/management/group-menu/menu-action-chips";
import { Icon } from "@/components/ui/icon";
import type { GroupMenuAccessController } from "@/features/groups/use-group-menu-access";
import { menuIndent, type MenuAccessRow } from "@/features/groups/menu-access";
import { resolveIcon } from "@/lib/icons";
import styles from "./group-menu.module.css";

type MenuAccessRowItemProps = Readonly<{
  row: MenuAccessRow;
  inSection: boolean;
  controller: GroupMenuAccessController;
}>;

export function MenuAccessRowItem({
  row,
  inSection,
  controller,
}: MenuAccessRowItemProps) {
  const { menu } = row;
  const on = controller.isSelected(menu.id);
  const available = controller.actionsOf(menu);
  const granted = available.filter((item) =>
    controller.hasAction(menu.id, item.key),
  ).length;
  const indent = menuIndent(row.depth, inSection);
  const showActions = on && available.length > 0;

  return (
    <li>
      <div
        className={menu.isActive ? styles.row : `${styles.row} ${styles.off}`}
        style={{ paddingLeft: 6 + indent }}
      >
        <PickCheck
          checked={on}
          indeterminate={!on && row.descendants.some(controller.isSelected)}
          label={`Pilih ${menu.label}`}
          onChange={(checked) => controller.toggleMenu(row, checked)}
        />
        {menu.icon ? (
          <span className={styles.icon}>
            <Icon icon={resolveIcon(menu.icon)} size={16} />
          </span>
        ) : null}
        <span className={styles.label}>{menu.label}</span>
        {showActions ? (
          <span className={styles.count}>
            {granted}/{available.length}
          </span>
        ) : null}
      </div>

      {showActions ? (
        <MenuActionChips
          available={available}
          indent={indent}
          isGranted={(key) => controller.hasAction(menu.id, key)}
          onToggle={(keys, checked) =>
            controller.toggleActions(menu, keys, checked)
          }
        />
      ) : null}
    </li>
  );
}
