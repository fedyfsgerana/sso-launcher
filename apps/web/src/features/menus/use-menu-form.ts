"use client";

import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { CircleCheck } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  createPortalMenu,
  getPortalMenus,
  updatePortalMenu,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";
import {
  EMPTY_MENU_FORM,
  defaultTargetValue,
  menuAccessLink,
  menuFormFromMenu,
  menuPayload,
  parentOptions,
  parentSectionLabel,
  placementUnder,
  sectionOptions,
  validateMenuForm,
  type MenuFormValue,
} from "@/features/menus/menu-form-state";
import { levelLabel, menuLevelOf } from "@/lib/portal/menu-levels";
import { titleText } from "@/lib/portal/text-format";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import { useMinLoading } from "@/lib/portal/use-min-loading";

type MenuFormOptions = Readonly<{
  menuId?: string;
  initialParentId: string;
  initialLevel: number;
}>;

export function useMenuForm({
  menuId,
  initialParentId,
  initialLevel,
}: MenuFormOptions) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState<MenuFormValue>(EMPTY_MENU_FORM);
  const [menus, setMenus] = useState<AdminPortalMenu[]>([]);
  const [level, setLevel] = useState(initialLevel);
  const [hasChildren, setHasChildren] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading);
  const editing = Boolean(menuId);
  const noun = levelLabel(level);
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors(form, (value) =>
      validateMenuForm(value, { level, hasChildren }),
    );

  useEffect(() => {
    let active = true;

    void (async () => {
      const list = await getPortalMenus().catch(() => [] as AdminPortalMenu[]);

      if (!active) {
        return;
      }

      setMenus(list);

      if (!menuId) {
        const placement = placementUnder(list, initialParentId);

        if (placement) {
          setLevel(placement.level);
          setForm((value) => ({
            ...value,
            sectionId: placement.sectionId,
            parentId: placement.parentId,
          }));
        }

        setLoading(false);
        return;
      }

      const menu = list.find((item) => item.id === menuId);

      if (!menu) {
        setLoading(false);
        return;
      }

      if (menu.targetType === "section") {
        router.replace(`/menus/sections/${menu.id}`);
        return;
      }

      setLevel(menuLevelOf(list, menu));
      setHasChildren(list.some((item) => item.parentId === menu.id));
      setForm(menuFormFromMenu(list, menu));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [initialParentId, menuId, router]);

  const sections = useMemo(() => sectionOptions(menus), [menus]);
  const parents = useMemo(
    () => parentOptions(menus, level, menuId),
    [level, menuId, menus],
  );

  function change(patch: Partial<MenuFormValue>) {
    setForm((value) => ({ ...value, ...patch }));

    for (const field of Object.keys(patch)) {
      clearField(field);
    }
  }

  function tidyLabel() {
    setForm((value) => ({ ...value, label: titleText(value.label) }));
    checkField("label");
  }

  function changeType(targetType: string) {
    change({ targetType, targetValue: defaultTargetValue(targetType) });
  }

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    if (saving || Object.values(checkAll()).some(Boolean)) {
      return;
    }

    const label = form.label.trim();
    const approved = await confirm({
      title: editing ? "Simpan perubahan?" : `Tambah ${noun.toLowerCase()}?`,
      message: editing
        ? `Perubahan pada ${label} akan disimpan dan tercatat di riwayat aktivitas beserta nilai sebelum dan sesudahnya.`
        : `${noun} ${label} akan ditambahkan dan tercatat di riwayat aktivitas.`,
      confirmLabel: editing ? "Ya, Simpan" : "Ya, Tambahkan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    const payload = menuPayload(form, level);

    try {
      if (menuId) {
        await updatePortalMenu(menuId, payload);
      } else {
        await createPortalMenu(payload);
      }

      showToast(
        editing ? `${noun} ${label} disimpan` : `${noun} ${label} ditambahkan`,
      );
      router.push("/menus");
      router.refresh();
    } catch {
      showToast(
        "Menu gagal disimpan. Periksa struktur dan link akses menu.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    errors,
    errorSummary,
    level,
    noun,
    editing,
    saving,
    showSkeleton,
    hasChildren,
    sections,
    parents,
    parentSection: parentSectionLabel(menus, form.parentId),
    accessLink: menuAccessLink(form),
    change,
    changeType,
    tidyLabel,
    checkField,
    submit,
    cancel: () => router.push("/menus"),
  };
}

export type MenuFormController = ReturnType<typeof useMenuForm>;
