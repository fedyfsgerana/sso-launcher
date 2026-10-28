"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import {
  AppWindow,
  Check,
  CircleCheck,
  CircleX,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { FormPage } from "@/components/portal/form-page";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import { IconPicker } from "@/components/ui/icon-picker";
import { Icon } from "@/components/ui/icon";
import { APP_COLOR_LABELS } from "@/lib/portal/palette";
import { Spinner } from "@/components/ui/spinner";
import {
  createApplication,
  getAdminApplications,
  updateApplication,
  type AdminApplication,
} from "@/features/applications/admin-api";
import { useDepartments } from "@/features/departments/use-departments";
import {
  APP_COLORS,
  STATUS_FORM_OPTIONS,
  applicationCategories,
  categoryOptions,
  descriptionOptions,
  isKnownDescription,
} from "@/lib/portal/options";
import {
  DEFAULT_CALLBACK_PATH,
  callbackUrl,
  requireAppUrl,
  requireCallbackPath,
  requireText,
} from "@/lib/portal/validation";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { toSlug } from "@/lib/portal/slug";
import { sentenceText, titleText } from "@/lib/portal/text-format";
import styles from "./application-form.module.css";

type ApplicationFormProps = Readonly<{
  applicationId?: string;
}>;

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  appUrl: "",
  customCallback: "no",
  callbackPath: DEFAULT_CALLBACK_PATH,
  category: "",
  icon: "",
  color: "app-hr",
  status: "active",
  usesSso: "yes",
};

const SSO_OPTIONS = [
  { value: "yes", label: "Ya, login lewat SSO Portal" },
  { value: "no", label: "Tidak, tautan biasa" },
];

const CALLBACK_OPTIONS = [
  { value: "no", label: `Standar (${DEFAULT_CALLBACK_PATH})` },
  { value: "yes", label: "Path khusus" },
];

export function ApplicationForm({ applicationId }: ApplicationFormProps) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState(EMPTY);
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors(form, (value) => ({
      name: requireText(value.name),
      slug: requireText(value.slug),
      appUrl: requireAppUrl(value.appUrl),
      callbackPath:
        value.usesSso === "yes" && value.customCallback === "yes"
          ? requireCallbackPath(value.callbackPath)
          : undefined,
      category: requireText(value.category),
    }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(applicationId));
  const showSkeleton = useMinLoading(loading);
  const { departments } = useDepartments();
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const ssoAddress =
    form.usesSso === "yes" && !requireAppUrl(form.appUrl)
      ? callbackUrl(
          form.appUrl,
          form.customCallback === "yes"
            ? form.callbackPath
            : DEFAULT_CALLBACK_PATH,
        )
      : "";

  const statusOptions =
    form.status === "maintenance"
      ? [
          ...STATUS_FORM_OPTIONS.map((item) => ({ ...item })),
          { value: "maintenance", label: "Maintenance (sedang berlaku)" },
        ]
      : STATUS_FORM_OPTIONS.map((item) => ({ ...item }));

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    let active = true;

    void (async () => {
      const list = await getAdminApplications().catch(
        () => [] as AdminApplication[],
      );
      const application = list.find((item) => item.id === applicationId);

      if (!active || !application) {
        return;
      }

      setSlugEdited(true);
      setForm({
        name: application.name,
        slug: application.slug,
        description: application.description,
        appUrl: application.appUrl || application.launchUrl,
        customCallback:
          application.callbackPath &&
          application.callbackPath !== DEFAULT_CALLBACK_PATH
            ? "yes"
            : "no",
        callbackPath: application.callbackPath ?? DEFAULT_CALLBACK_PATH,
        category: application.category,
        icon: application.icon,
        color: application.color,
        status: application.status,
        usesSso: application.usesSso ? "yes" : "no",
      });
      setMaintenanceMessage(application.maintenanceMessage);

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [applicationId]);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors = checkAll();

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const approved = await confirm({
      title: applicationId ? "Simpan perubahan?" : "Tambah aplikasi?",
      message: applicationId
        ? `Perubahan pada ${form.name.trim()} akan disimpan dan tercatat di riwayat aktivitas beserta nilai sebelum dan sesudahnya.`
        : `Aplikasi ${form.name.trim()} akan ditambahkan dan tercatat di riwayat aktivitas.`,
      confirmLabel: applicationId ? "Ya, Simpan" : "Ya, Tambahkan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      appUrl: form.appUrl,
      callbackPath:
        form.usesSso === "yes"
          ? form.customCallback === "yes"
            ? form.callbackPath
            : DEFAULT_CALLBACK_PATH
          : null,
      category: form.category,
      icon: form.icon,
      color: form.color,
      status: form.status as "active" | "maintenance" | "inactive",
      maintenanceMessage:
        form.status === "maintenance" ? maintenanceMessage : "",
      usesSso: form.usesSso === "yes",
    };

    try {
      if (applicationId) {
        await updateApplication(applicationId, payload);
      } else {
        await createApplication(payload);
      }

      showToast(
        applicationId
          ? `Aplikasi ${form.name.trim()} disimpan`
          : `Aplikasi ${form.name.trim()} ditambahkan`,
      );
      router.push("/applications");
      router.refresh();
    } catch {
      showToast(
        "Aplikasi gagal disimpan. Pastikan slug unik dan URL diawali http atau https.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPage
      icon={AppWindow}
      loading={showSkeleton}
      skeletonFields={8}
      parentHref="/applications"
      parentLabel="Manajemen Aplikasi"
      title={applicationId ? "Ubah Aplikasi" : "Tambah Aplikasi"}
      description={
        applicationId
          ? "Perbarui data aplikasi yang terhubung ke SSO Launcher."
          : "Daftarkan aplikasi baru agar bisa dibuka lewat SSO."
      }
      errorCount={errorSummary}
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.push("/applications")}
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
              : applicationId
                ? "Simpan Perubahan"
                : "Tambah Aplikasi"}
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
        icon={AppWindow}
        title="Identitas Aplikasi"
        description="Nama, keterangan, dan kategori yang tampil di portal."
      >
        <Field label="Nama Aplikasi" error={errors.name}>
          <input
            value={form.name}
            placeholder="Masukkan nama aplikasi"
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => {
              const name = event.target.value;

              setForm((value) => ({
                ...value,
                name,
                slug: slugEdited ? value.slug : toSlug(name),
              }));
              clearField("name");
              clearField("slug");
            }}
            onBlur={() => {
              setForm((value) => ({ ...value, name: titleText(value.name) }));
              checkField("name");
            }}
          />
        </Field>

        <SelectField
          label="Kategori"
          value={form.category}
          options={categoryOptions(
            applicationCategories(departments),
            form.category,
          )}
          error={errors.category}
          hint="Jenis aplikasi sesuai bidang kerjanya."
          placeholder="Pilih kategori"
          searchPlaceholder="Cari kategori"
          onChange={(category) => {
            setForm({
              ...form,
              category,
              description: isKnownDescription(
                { name: form.name, category },
                form.description,
              )
                ? form.description
                : "",
            });
            clearField("category");
          }}
        />

        <SelectField
          label="Keterangan"
          value={form.description}
          options={descriptionOptions(
            { name: form.name, category: form.category },
            form.description,
          )}
          hint="Keterangan singkat yang tampil di kartu aplikasi."
          placeholder="Pilih keterangan"
          searchPlaceholder="Cari keterangan"
          onChange={(description) => setForm({ ...form, description })}
        />
      </FormSection>

      <FormSection
        icon={ShieldCheck}
        title="Koneksi SSO"
        description="Cara masuk, alamat aplikasi, dan penanda uniknya di portal."
      >
        <SelectField
          label="Login Lewat SSO Portal"
          value={form.usesSso}
          options={SSO_OPTIONS}
          onChange={(usesSso) => setForm({ ...form, usesSso })}
          hint={
            form.usesSso === "yes"
              ? "Wajib punya kredensial SSO aktif. Tanpa kredensial, aplikasi tidak bisa dibuka dari portal."
              : "Hanya untuk situs yang tidak memakai login portal. Dibuka langsung tanpa token SSO."
          }
          span
        />

        <Field
          label="Alamat Aplikasi"
          error={errors.appUrl}
          hint="Alamat utama aplikasi, misalnya https://erp.example.com. Alamat http:// hanya untuk localhost saat pengembangan."
        >
          <input
            value={form.appUrl}
            placeholder="Masukkan alamat aplikasi"
            aria-invalid={errors.appUrl ? true : undefined}
            onChange={(event) => {
              setForm({ ...form, appUrl: event.target.value });
              clearField("appUrl");
            }}
            onBlur={() => checkField("appUrl")}
          />
        </Field>

        {form.usesSso === "yes" ? (
          <>
            <SelectField
              label="Path Callback SSO"
              value={form.customCallback}
              options={CALLBACK_OPTIONS}
              hint="Pakai standar kecuali aplikasi lama yang sudah punya alamat callback sendiri."
              onChange={(customCallback) => {
                setForm({ ...form, customCallback });
                clearField("callbackPath");
              }}
            />

            {form.customCallback === "yes" ? (
              <Field
                label="Path Khusus"
                error={errors.callbackPath}
                hint="Diawali /, misalnya /backend/api/v1/auth/sso/portal."
              >
                <input
                  value={form.callbackPath}
                  placeholder="Masukkan path callback"
                  aria-invalid={errors.callbackPath ? true : undefined}
                  onChange={(event) => {
                    setForm({ ...form, callbackPath: event.target.value });
                    clearField("callbackPath");
                  }}
                  onBlur={() => checkField("callbackPath")}
                />
              </Field>
            ) : null}

            <Field
              label="Alamat SSO (Callback)"
              hint="Disusun otomatis dari Alamat Aplikasi dan Path Callback, dan ikut tercantum di Panduan Integrasi untuk tim aplikasi."
            >
              <input
                className={styles.callback}
                value={ssoAddress}
                readOnly
                placeholder="Isi alamat aplikasi dulu"
              />
            </Field>
          </>
        ) : null}

        <Field
          label="Slug"
          error={errors.slug}
          hint="Dibuat otomatis dari nama aplikasi. Huruf kecil, angka, dan tanda hubung."
        >
          <input
            value={form.slug}
            placeholder="Masukkan slug aplikasi"
            aria-invalid={errors.slug ? true : undefined}
            onChange={(event) => {
              const slug = event.target.value;

              setSlugEdited(true);
              setForm((value) => ({ ...value, slug }));
              clearField("slug");
            }}
            onBlur={(event) => {
              const slug = toSlug(event.target.value);

              setSlugEdited(slug.length > 0);
              setForm((value) => ({ ...value, slug }));
              checkField("slug");
            }}
          />
        </Field>

        <SelectField
          label="Status"
          placeholder="Pilih status"
          value={form.status}
          options={statusOptions}
          onChange={(status) => setForm({ ...form, status })}
          hint={
            form.status === "maintenance"
              ? "Aplikasi sedang maintenance. Pilih Aktif untuk membukanya kembali."
              : "Gunakan tombol Set Maintenance di daftar aplikasi untuk menutup sementara."
          }
        />

        {form.status === "maintenance" ? (
          <Field
            label="Pesan Maintenance"
            hint="Tampil sebagai tooltip di kartu aplikasi dan ikut dikirim lewat notifikasi."
            span
          >
            <input
              value={maintenanceMessage}
              placeholder="Misalnya: perbaikan server sampai pukul 15.00"
              maxLength={300}
              onChange={(event) => setMaintenanceMessage(event.target.value)}
              onBlur={() =>
                setMaintenanceMessage((value) => sentenceText(value))
              }
            />
          </Field>
        ) : null}
      </FormSection>

      <FormSection
        icon={Palette}
        title="Tampilan"
        description="Warna dan ikon logo aplikasi di portal."
      >
        <div className="span2 fld">
          <span>Warna</span>
          <div className="tone-pick" role="group" aria-label="Pilih warna">
            {APP_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={color === form.color ? `${color} on` : color}
                aria-pressed={color === form.color}
                aria-label={`Warna ${APP_COLOR_LABELS[color] ?? color}`}
                title={APP_COLOR_LABELS[color] ?? color}
                onClick={() => setForm({ ...form, color })}
              >
                <Icon icon={Check} size={16} />
              </button>
            ))}
          </div>
        </div>

        <IconPicker
          label="Ikon"
          value={form.icon}
          onChange={(icon) => setForm({ ...form, icon })}
          hint="Ketik untuk mencari, misalnya gudang atau keuangan."
        />
      </FormSection>
    </FormPage>
  );
}
