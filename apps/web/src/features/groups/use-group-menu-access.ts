"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck } from "lucide-react";
import type { PickView } from "@/components/management/pick-toolbar";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  setGroupMenuAccess,
  type UserGroupDetail,
} from "@/features/groups/api";
import {
  actionToken,
  actionsForMenu,
  buildMenuAccessRows,
  grantedActions,
  groupMenuAccessColumns,
  sameSet,
  toggleActionTokens,
  toggleMenuSelection,
  type MenuAccessRow,
} from "@/features/groups/menu-access";
import {
  getMenuActionCatalog,
  getPortalMenus,
  type AdminPortalMenu,
  type MenuActionDefinition,
} from "@/features/menus/admin-api";
import { queueToast } from "@/lib/portal/pending-toast";
import { useAppRouter } from "@/lib/portal/use-app-router";

function withMenu(selected: string[], menuId: string) {
  return selected.includes(menuId) ? selected : [...selected, menuId];
}

export function useGroupMenuAccess(
  detail: UserGroupDetail,
  onSaved: () => void,
) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const initial = useMemo(
    () => detail.menus.map((menu) => menu.menuId),
    [detail],
  );
  const initialActions = useMemo(
    () =>
      detail.menuActions.map((item) =>
        actionToken(item.menuId, item.actionKey),
      ),
    [detail],
  );
  const [menus, setMenus] = useState<AdminPortalMenu[] | null>(null);
  const [catalog, setCatalog] = useState<MenuActionDefinition[]>([]);
  const [selected, setSelected] = useState<string[]>(initial);
  const [actions, setActions] = useState<string[]>(initialActions);
  const [loadedFor, setLoadedFor] = useState(detail);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PickView>("");
  const [saving, setSaving] = useState(false);

  if (loadedFor !== detail) {
    setLoadedFor(detail);
    setSelected(initial);
    setActions(initialActions);
  }

  useEffect(() => {
    let active = true;

    void getMenuActionCatalog()
      .then((list) => {
        if (active) {
          setCatalog(list);
        }
      })
      .catch(() => undefined);

    void getPortalMenus()
      .then((list) => {
        if (active) {
          setMenus(list);
        }
      })
      .catch(() => {
        if (active) {
          setMenus([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () => buildMenuAccessRows(menus ?? [], { query, view, selected }),
    [menus, query, view, selected],
  );
  const columns = useMemo(() => groupMenuAccessColumns(rows), [rows]);

  function actionsOf(menu: AdminPortalMenu) {
    return actionsForMenu(menu, catalog);
  }

  function isSelected(menuId: string) {
    return selected.includes(menuId);
  }

  function hasAction(menuId: string, key: string) {
    return actions.includes(actionToken(menuId, key));
  }

  function toggleMenu(row: MenuAccessRow, checked: boolean) {
    setSelected((value) =>
      toggleMenuSelection(value, row, checked, menus ?? []),
    );
  }

  function toggleActions(
    menu: AdminPortalMenu,
    keys: readonly string[],
    checked: boolean,
  ) {
    const tokens = keys.map((key) => actionToken(menu.id, key));

    setActions((value) => toggleActionTokens(value, tokens, checked));

    if (checked) {
      setSelected((value) => withMenu(value, menu.id));
    }
  }

  const added = selected.filter((id) => !initial.includes(id));
  const removed = initial.filter((id) => !selected.includes(id));
  const actionsChanged =
    actions.filter((token) => !initialActions.includes(token)).length +
    initialActions.filter((token) => !actions.includes(token)).length;

  function names(ids: string[]) {
    return ids
      .map((id) => menus?.find((menu) => menu.id === id)?.label ?? "menu lain")
      .join(", ");
  }

  async function save() {
    const granted = grantedActions(actions, selected);
    const changes = [
      added.length > 0 ? `Ditambahkan (${added.length}): ${names(added)}.` : "",
      removed.length > 0
        ? `Dicabut (${removed.length}): ${names(removed)}.`
        : "",
      actionsChanged > 0 ? `${actionsChanged} izin aksi berubah.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const approved = await confirm({
      title: `Simpan akses menu grup ${detail.name}?`,
      message:
        selected.length === 0
          ? `Grup akan mengikuti menu umum tanpa menu khusus. ${changes}`
          : `Grup akan dapat membuka ${selected.length} menu di sidebar dengan ${granted.length} aksi. ${changes}`,
      confirmLabel: "Ya, Simpan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await setGroupMenuAccess(detail.id, selected, granted);
      queueToast(`Akses menu grup ${detail.name} disimpan`);
      router.push("/groups");
      onSaved();
    } catch {
      showToast("Akses menu gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return {
    menus,
    columns,
    query,
    view,
    saving,
    selectedCount: selected.length,
    savedCount: initial.length,
    addedCount: added.length,
    removedCount: removed.length,
    dirty: !sameSet(selected, initial) || !sameSet(actions, initialActions),
    setQuery,
    setView,
    actionsOf,
    isSelected,
    hasAction,
    toggleMenu,
    toggleActions,
    save,
  };
}

export type GroupMenuAccessController = ReturnType<typeof useGroupMenuAccess>;
