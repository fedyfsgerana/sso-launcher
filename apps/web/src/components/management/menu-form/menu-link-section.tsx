"use client";

import { Link2 } from "lucide-react";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import type { MenuFormController } from "@/features/menus/use-menu-form";
import { PAGE_TARGETS, TARGET_OPTIONS } from "@/lib/portal/options";

type MenuLinkSectionProps = Readonly<{
  controller: MenuFormController;
}>;

const STATUS_OPTIONS = [
  { value: "on", label: "Aktif" },
  { value: "off", label: "Nonaktif" },
];

function TargetFields({ controller }: MenuLinkSectionProps) {
  const { form, errors } = controller;
  const isUrl = form.targetType === "url";

  return (
    <>
      <SelectField
        label="Jenis Link"
        placeholder="Pilih jenis link"
        value={form.targetType}
        options={TARGET_OPTIONS.map((item) => ({ ...item }))}
        onChange={controller.changeType}
        disabled={form.isSystem}
      />

      {form.targetType === "page" ? (
        <SelectField
          label="Halaman Sistem"
          placeholder="Pilih halaman sistem"
          value={form.targetValue}
          options={PAGE_TARGETS.map((item) => ({ ...item }))}
          onChange={(targetValue) => controller.change({ targetValue })}
          disabled={form.isSystem}
          searchPlaceholder="Cari halaman sistem"
        />
      ) : (
        <Field
          label={isUrl ? "URL Eksternal" : "Path Internal"}
          error={errors.targetValue}
          hint={
            isUrl ? "Contoh: https://example.com" : "Contoh: /reports/monthly"
          }
        >
          <input
            value={form.targetValue}
            placeholder={
              isUrl ? "Masukkan URL eksternal" : "Masukkan path internal"
            }
            disabled={form.isSystem}
            aria-invalid={errors.targetValue ? true : undefined}
            onChange={(event) =>
              controller.change({ targetValue: event.target.value })
            }
            onBlur={() => controller.checkField("targetValue")}
          />
        </Field>
      )}

      <Field
        label="Link Akses Menu"
        hint="Alamat final yang digunakan oleh sidebar."
      >
        <input value={controller.accessLink} readOnly aria-readonly="true" />
      </Field>
    </>
  );
}

export function MenuLinkSection({ controller }: MenuLinkSectionProps) {
  return (
    <FormSection
      icon={Link2}
      title="Link Akses & Status"
      description="Tentukan alamat yang dibuka saat pengguna memilih menu, lalu aktifkan atau nonaktifkan menunya."
    >
      {controller.hasChildren ? (
        <Field
          label="Link Akses Menu"
          hint="Menu ini punya submenu, jadi hanya membuka daftar submenunya di sidebar. Link aslinya dipakai lagi setelah semua submenunya dikeluarkan."
        >
          <input value="/" readOnly aria-readonly="true" />
        </Field>
      ) : (
        <TargetFields controller={controller} />
      )}

      <SelectField
        label="Status"
        value={controller.form.isActive ? "on" : "off"}
        options={STATUS_OPTIONS}
        onChange={(value) => controller.change({ isActive: value === "on" })}
        hint="Menu nonaktif tidak tampil di sidebar."
      />
    </FormSection>
  );
}
