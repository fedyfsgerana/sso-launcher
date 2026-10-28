"use client";

import { MenuDeleteModal } from "@/components/management/menu-delete-modal";
import { MenuMaintenanceModal } from "@/components/management/menu-maintenance-modal";
import { MenuMoveModal } from "@/components/management/menu-move-modal";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import { descendantMenuIds, menuPathLabel } from "@/features/menus/menu-board";

type MenuBoardModalsProps = Readonly<{
  menus: readonly AdminPortalMenu[];
  sections: readonly AdminPortalMenu[];
  deleting: AdminPortalMenu | null;
  moving: AdminPortalMenu | null;
  maintaining: AdminPortalMenu | null;
  onCloseDelete: () => void;
  onCloseMove: () => void;
  onCloseMaintenance: () => void;
  onChanged: () => void;
}>;

function byLabel(left: { label: string }, right: { label: string }) {
  return left.label.localeCompare(right.label);
}

function SectionDeleteModal({
  section,
  menus,
  sections,
  onClose,
  onChanged,
}: Readonly<{
  section: AdminPortalMenu;
  menus: readonly AdminPortalMenu[];
  sections: readonly AdminPortalMenu[];
  onClose: () => void;
  onChanged: () => void;
}>) {
  return (
    <MenuDeleteModal
      item={section}
      noun="bagian"
      childCount={menus.filter((item) => item.parentId === section.id).length}
      childNoun="menu"
      moveHint="Menu masuk ke bagian ini dan ditaruh di urutan paling bawah."
      options={sections
        .filter((item) => item.id !== section.id)
        .map((item) => ({
          value: item.id,
          label: `Bagian ${item.label}`,
        }))}
      onClose={onClose}
      onDeleted={() => {
        onClose();
        onChanged();
      }}
    />
  );
}

function ItemDeleteModal({
  menu,
  menus,
  onClose,
  onChanged,
}: Readonly<{
  menu: AdminPortalMenu;
  menus: readonly AdminPortalMenu[];
  onClose: () => void;
  onChanged: () => void;
}>) {
  const parent = menus.find((item) => item.id === menu.parentId);
  const blocked = descendantMenuIds(menus, menu.id);
  const promoteToRoot = !parent || parent.targetType === "section";

  return (
    <MenuDeleteModal
      item={menu}
      noun="menu"
      childCount={menus.filter((item) => item.parentId === menu.id).length}
      childNoun="submenu"
      keepLabel={
        promoteToRoot
          ? "Jadikan menu utama"
          : `Jadikan submenu dari ${parent.label}`
      }
      keepHint={
        promoteToRoot
          ? `Semua submenu menjadi menu utama${parent ? ` di bagian ${parent.label}` : ""}.`
          : `Semua submenu naik satu tingkat ke bawah ${parent.label}.`
      }
      moveHint="Semua submenu pindah ke bawah menu ini dan ditaruh di urutan paling bawah."
      options={menus
        .filter(
          (item) => item.targetType !== "section" && !blocked.has(item.id),
        )
        .map((item) => ({
          value: item.id,
          label: menuPathLabel(menus, item),
        }))
        .sort(byLabel)}
      onClose={onClose}
      onDeleted={() => {
        onClose();
        onChanged();
      }}
    />
  );
}

function MoveModal({
  menu,
  menus,
  sections,
  onClose,
  onChanged,
}: Readonly<{
  menu: AdminPortalMenu;
  menus: readonly AdminPortalMenu[];
  sections: readonly AdminPortalMenu[];
  onClose: () => void;
  onChanged: () => void;
}>) {
  const blocked = descendantMenuIds(menus, menu.id);
  const targets = sections
    .filter((item) => item.id !== menu.parentId)
    .map((item) => ({
      value: item.id,
      label: `Menu utama di bagian ${item.label}`,
    }));
  const parents = menus
    .filter(
      (item) =>
        item.targetType !== "section" &&
        !blocked.has(item.id) &&
        item.id !== menu.parentId,
    )
    .map((item) => ({
      value: item.id,
      label: `Submenu dari ${menuPathLabel(menus, item)}`,
    }))
    .sort(byLabel);

  return (
    <MenuMoveModal
      menu={menu}
      options={[...targets, ...parents]}
      onClose={onClose}
      onMoved={() => {
        onClose();
        onChanged();
      }}
    />
  );
}

export function MenuBoardModals({
  menus,
  sections,
  deleting,
  moving,
  maintaining,
  onCloseDelete,
  onCloseMove,
  onCloseMaintenance,
  onChanged,
}: MenuBoardModalsProps) {
  return (
    <>
      {deleting && deleting.targetType === "section" ? (
        <SectionDeleteModal
          section={deleting}
          menus={menus}
          sections={sections}
          onClose={onCloseDelete}
          onChanged={onChanged}
        />
      ) : null}

      {deleting && deleting.targetType !== "section" ? (
        <ItemDeleteModal
          menu={deleting}
          menus={menus}
          onClose={onCloseDelete}
          onChanged={onChanged}
        />
      ) : null}

      {moving ? (
        <MoveModal
          menu={moving}
          menus={menus}
          sections={sections}
          onClose={onCloseMove}
          onChanged={onChanged}
        />
      ) : null}

      {maintaining ? (
        <MenuMaintenanceModal
          menu={maintaining}
          onClose={onCloseMaintenance}
          onSaved={onChanged}
        />
      ) : null}
    </>
  );
}
