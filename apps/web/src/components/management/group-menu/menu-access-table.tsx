"use client";

import { PickCheck } from "@/components/management/pick-check";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import type { MenuAccessColumn } from "@/features/groups/menu-access";
import type { GroupMenuAccessController } from "@/features/groups/use-group-menu-access";
import { resolveIcon } from "@/lib/icons";
import { MenuActionChips } from "./menu-action-chips";
import treeStyles from "@/components/management/menu-tree/menu-tree.module.css";
import styles from "./group-menu.module.css";

type MenuAccessTableProps = Readonly<{
  columns: readonly MenuAccessColumn[];
  controller: GroupMenuAccessController;
}>;

function menuStatus(menu: AdminPortalMenu) {
  if (menu.maintenanceActive) {
    return "maintenance";
  }

  return menu.isActive ? "active" : "inactive";
}

export function MenuAccessTable({ columns, controller }: MenuAccessTableProps) {
  return (
    <div className="table-wrap">
      <table className={`dt ut ${treeStyles.table}`}>
        <thead>
          <tr>
            <th className={treeStyles.checkCol}>
              <span className="sr-only">Pilih</span>
            </th>
            <th>Menu</th>
            <th>Alamat</th>
            <th>Aksi yang diizinkan</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {columns.map((column) => {
            const { section } = column;
            const label = section?.menu.label ?? "Tanpa Bagian";
            const count = column.rows.filter((row) =>
              controller.isSelected(row.menu.id),
            ).length;
            const full = column.rows.length > 0 && count === column.rows.length;
            const countClass = full
              ? `${styles.count} ${styles.countFull}`
              : styles.count;

            return [
              <tr
                key={`section-${section?.menu.id ?? "loose"}`}
                className={treeStyles.section}
              >
                <td className={treeStyles.checkCol}>
                  {section && section.descendants.length > 0 ? (
                    <PickCheck
                      checked={section.descendants.every(controller.isSelected)}
                      indeterminate={section.descendants.some(
                        controller.isSelected,
                      )}
                      label={`Pilih semua menu di bagian ${label}`}
                      onChange={(checked) =>
                        controller.toggleMenu(section, checked)
                      }
                    />
                  ) : null}
                </td>
                <td colSpan={4}>
                  <span className={treeStyles.cell}>
                    <b>{label}</b>
                    <span className={countClass}>
                      {count}/{column.rows.length}
                    </span>
                  </span>
                </td>
              </tr>,
              ...column.rows.map((row) => {
                const { menu } = row;
                const on = controller.isSelected(menu.id);
                const available = controller.actionsOf(menu);
                const indent = (row.depth - (section ? 1 : 0)) * 22;

                return (
                  <tr key={menu.id}>
                    <td className={treeStyles.checkCol}>
                      <PickCheck
                        checked={on}
                        indeterminate={
                          !on && row.descendants.some(controller.isSelected)
                        }
                        label={`Pilih ${menu.label}`}
                        onChange={(checked) =>
                          controller.toggleMenu(row, checked)
                        }
                      />
                    </td>
                    <td>
                      <span
                        className={treeStyles.cell}
                        style={{ paddingLeft: indent }}
                      >
                        <span className={treeStyles.icon}>
                          <Icon icon={resolveIcon(menu.icon)} size={16} />
                        </span>
                        <span className={treeStyles.label}>{menu.label}</span>
                      </span>
                    </td>
                    <td>
                      <code className={treeStyles.path}>
                        {menu.targetValue}
                      </code>
                    </td>
                    <td>
                      {on && available.length > 0 ? (
                        <MenuActionChips
                          available={available}
                          inline
                          isGranted={(key) =>
                            controller.hasAction(menu.id, key)
                          }
                          onToggle={(keys, checked) =>
                            controller.toggleActions(menu, keys, checked)
                          }
                        />
                      ) : (
                        <span className={treeStyles.time}>—</span>
                      )}
                    </td>
                    <td>
                      <ApplicationStatusBadge status={menuStatus(menu)} />
                    </td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
