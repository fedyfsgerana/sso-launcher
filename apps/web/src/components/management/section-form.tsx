"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { CircleCheck, CircleX, FolderTree } from "lucide-react";
import { FormPage } from "@/components/portal/form-page";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  createPortalMenu,
  getPortalMenus,
  updatePortalMenu,
} from "@/features/menus/admin-api";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { titleText } from "@/lib/portal/text-format";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { requireText } from "@/lib/portal/validation";

type SectionFormProps = Readonly<{
  sectionId?: string;
}>;

export function SectionForm({ sectionId }: SectionFormProps) {
  const router = useAppRouter();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    label: "",
    targetValue: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(sectionId));
  const showSkeleton = useMinLoading(loading);
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors(form, (value) => ({ label: requireText(value.label) }));

  useEffect(() => {
    if (!sectionId) {
      return;
    }

    let active = true;

    void getPortalMenus()
      .then((menus) => {
        const section = menus.find((menu) => menu.id === sectionId);

        if (!active) {
          return;
        }

        if (section && section.targetType !== "section") {
          router.replace(`/menus/${section.id}`);
          return;
        }

        if (section) {
          setForm({
            label: section.label,
            targetValue: section.targetValue,
            isActive: section.isActive,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, sectionId]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors = checkAll();

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const label = form.label.trim();
    const approved = await confirm({
      title: sectionId ? "Simpan perubahan?" : "Tambah bagian?",
      message: sectionId
        ? `Perubahan pada bagian ${label} akan disimpan dan tercatat di riwayat aktivitas.`
        : `Bagian ${label} akan ditambahkan sebagai judul kelompok baru di sidebar.`,
      confirmLabel: sectionId ? "Ya, Simpan" : "Ya, Tambahkan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    const payload = {
      label,
      icon: "",
      parentId: null,
      targetType: "section" as const,
      targetValue: form.targetValue,
      isActive: form.isActive,
    };

    try {
      if (sectionId) {
        await updatePortalMenu(sectionId, payload);
      } else {
        await createPortalMenu(payload);
      }

      showToast(
        sectionId ? `Bagian ${label} disimpan` : `Bagian ${label} ditambahkan`,
      );
      router.push("/menus");
      router.refresh();
    } catch {
      showToast("Bagian gagal disimpan. Coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPage
      icon={FolderTree}
      loading={showSkeleton}
      skeletonFields={2}
      parentHref="/menus"
      parentLabel="Manajemen Menu"
      title={sectionId ? "Ubah Bagian" : "Tambah Bagian"}
      description={
        sectionId
          ? "Perbarui nama dan status bagian menu SSO Launcher."
          : "Buat judul kelompok baru untuk menu di sidebar SSO Launcher."
      }
      errorCount={errorSummary}
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.push("/menus")}
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
              : sectionId
                ? "Simpan Perubahan"
                : "Tambah Bagian"}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={CircleCheck} size={18} />
            )}
          </button>
        </>
      }
    >
      <FormSection
        icon={FolderTree}
        title="Identitas Bagian"
        description="Bagian menjadi judul kelompok menu di sidebar dan tidak bisa diklik."
      >
        <Field
          label="Nama Bagian"
          error={errors.label}
          hint="Maksimal 28 karakter."
        >
          <input
            value={form.label}
            maxLength={28}
            placeholder="Masukkan nama bagian"
            aria-invalid={errors.label ? true : undefined}
            onChange={(event) => {
              setForm((value) => ({ ...value, label: event.target.value }));
              clearField("label");
            }}
            onBlur={() => {
              setForm((value) => ({ ...value, label: titleText(value.label) }));
              checkField("label");
            }}
          />
        </Field>

        <SelectField
          label="Status"
          value={form.isActive ? "on" : "off"}
          options={[
            { value: "on", label: "Aktif" },
            { value: "off", label: "Nonaktif" },
          ]}
          onChange={(value) =>
            setForm((current) => ({ ...current, isActive: value === "on" }))
          }
          hint="Bagian nonaktif beserta seluruh menunya tidak tampil di sidebar."
        />
      </FormSection>
    </FormPage>
  );
}
