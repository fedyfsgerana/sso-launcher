"use client";

import { CircleCheck, CircleX, Shapes, SquareMenu } from "lucide-react";
import { MenuLinkSection } from "@/components/management/menu-form/menu-link-section";
import { MenuPositionSection } from "@/components/management/menu-form/menu-position-section";
import { FormPage } from "@/components/portal/form-page";
import { FormSection } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { IconPicker } from "@/components/ui/icon-picker";
import { Spinner } from "@/components/ui/spinner";
import { useMenuForm } from "@/features/menus/use-menu-form";

type MenuFormProps = Readonly<{
  menuId?: string;
  initialParentId?: string;
  initialLevel?: number;
}>;

export function MenuForm({
  menuId,
  initialParentId = "",
  initialLevel = 0,
}: MenuFormProps) {
  const controller = useMenuForm({ menuId, initialParentId, initialLevel });
  const { editing, saving, noun, level } = controller;

  return (
    <FormPage
      icon={SquareMenu}
      loading={controller.showSkeleton}
      skeletonFields={6}
      parentHref="/menus"
      parentLabel="Manajemen Menu"
      title={editing ? `Ubah ${noun}` : `Tambah ${noun}`}
      description={
        level === 0
          ? "Menu utama tampil langsung di bawah judul bagian di sidebar."
          : `${noun} tampil saat menu induknya dibuka di sidebar.`
      }
      errorCount={controller.errorSummary}
      onSubmit={controller.submit}
      footer={
        <>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={controller.cancel}
          >
            Batal
            <Icon icon={CircleX} size={18} />
          </button>

          <button
            className={saving ? "btn is-loading" : "btn"}
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Menyimpan"
              : editing
                ? "Simpan Perubahan"
                : `Tambah ${noun}`}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={CircleCheck} size={18} />
            )}
          </button>
        </>
      }
    >
      <MenuPositionSection controller={controller} />
      <MenuLinkSection controller={controller} />

      <FormSection
        icon={Shapes}
        title="Ikon"
        description="Ikon yang tampil di samping nama menu pada sidebar."
      >
        <IconPicker
          label="Ikon"
          value={controller.form.icon}
          onChange={(icon) => controller.change({ icon })}
          hint="Ketik untuk mencari, misalnya gudang atau laporan."
        />
      </FormSection>
    </FormPage>
  );
}
