"use client";

import { SquareMenu } from "lucide-react";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import type { MenuFormController } from "@/features/menus/use-menu-form";
import { levelLabel } from "@/lib/portal/menu-levels";

type MenuPositionSectionProps = Readonly<{
  controller: MenuFormController;
}>;

export function MenuPositionSection({ controller }: MenuPositionSectionProps) {
  const { form, errors, level, noun } = controller;
  const isMain = level === 0;

  return (
    <FormSection
      icon={SquareMenu}
      title="Identitas & Posisi"
      description={
        isMain
          ? "Nama menu dan bagian tempat menu ini tampil."
          : "Nama menu dan menu induk tempat menu ini tampil."
      }
    >
      <Field
        label="Nama Menu"
        error={errors.label}
        hint="Maksimal 28 karakter."
      >
        <input
          value={form.label}
          maxLength={28}
          placeholder="Masukkan nama menu"
          aria-invalid={errors.label ? true : undefined}
          onChange={(event) => controller.change({ label: event.target.value })}
          onBlur={controller.tidyLabel}
        />
      </Field>

      {isMain ? (
        <SelectField
          label="Bagian"
          placeholder="Pilih bagian"
          value={form.sectionId}
          options={controller.sections}
          error={errors.sectionId}
          onChange={(sectionId) =>
            controller.change({ sectionId, parentId: "" })
          }
          hint="Judul kelompok di sidebar tempat menu ini tampil."
          searchPlaceholder="Cari bagian"
        />
      ) : (
        <>
          <SelectField
            label="Menu Induk"
            placeholder="Pilih menu induk"
            value={form.parentId}
            options={controller.parents}
            error={errors.parentId}
            onChange={(parentId) => controller.change({ parentId })}
            hint={`Hanya berisi ${levelLabel(level - 1).toLowerCase()}. ${noun} tampil saat menu induknya dibuka.`}
            searchPlaceholder="Cari menu induk"
          />

          <Field label="Bagian" hint="Mengikuti bagian menu induknya.">
            <input
              value={controller.parentSection || "Pilih menu induk dulu"}
              readOnly
              aria-readonly="true"
            />
          </Field>
        </>
      )}
    </FormSection>
  );
}
