"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { CircleCheck, CircleX, UsersRound } from "lucide-react";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { FormPage } from "@/components/portal/form-page";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { GroupNameField } from "@/components/management/group-name-field";
import { FormSection, SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  createGroup,
  getGroupDetail,
  getGroupNameOptions,
  updateGroup,
  type GroupNameOption,
} from "@/features/groups/api";
import { useDepartments } from "@/features/departments/use-departments";
import { departmentOptions } from "@/lib/portal/departments";
import { groupDescriptionOptions } from "@/lib/portal/options";
import { titleText } from "@/lib/portal/text-format";
import { requireText } from "@/lib/portal/validation";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import { useMinLoading } from "@/lib/portal/use-min-loading";

type GroupFormProps = Readonly<{
  groupId?: string;
}>;

export function GroupForm({ groupId }: GroupFormProps) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "",
    isActive: true,
  });
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors(form, (value) => ({
      name: requireText(value.name),
      department: requireText(value.department, "Pilih departemen"),
    }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(groupId));
  const { departments } = useDepartments();
  const showSkeleton = useMinLoading(loading);
  const [manualName, setManualName] = useState(false);
  const [loadedNames, setLoadedNames] = useState<{
    code: string;
    items: GroupNameOption[];
  } | null>(null);
  const departmentCode =
    departments.find((item) => item.name === form.department)?.code ?? "";
  const nameItems =
    departmentCode && loadedNames?.code === departmentCode
      ? loadedNames.items
      : null;
  const nameHint = !form.department
    ? undefined
    : manualName
      ? "Ketik nama grup secara manual."
      : "Pilih dari jabatan pengguna di departemen ini, atau klik Isi Manual untuk mengetik sendiri.";

  useEffect(() => {
    if (!departmentCode) {
      return;
    }

    let active = true;

    void getGroupNameOptions(departmentCode)
      .catch(() => [] as GroupNameOption[])
      .then((items) => {
        if (active) {
          setLoadedNames({ code: departmentCode, items });
        }
      });

    return () => {
      active = false;
    };
  }, [departmentCode]);

  useEffect(() => {
    if (!groupId) {
      return;
    }

    let active = true;

    void (async () => {
      const detail = await getGroupDetail(groupId).catch(() => null);

      if (!active || !detail) {
        return;
      }

      setForm({
        name: detail.name,
        description: detail.description,
        department: detail.department ?? "",
        isActive: detail.isActive,
      });

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [groupId]);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors = checkAll();

    if (nextErrors.name || nextErrors.department) {
      return;
    }

    const approved = await confirm({
      title: groupId ? "Simpan perubahan?" : "Tambah grup?",
      message: groupId
        ? `Perubahan pada ${form.name.trim()} akan disimpan dan tercatat di riwayat aktivitas beserta nilai sebelum dan sesudahnya.`
        : `Grup ${form.name.trim()} akan ditambahkan dan tercatat di riwayat aktivitas.`,
      confirmLabel: groupId ? "Ya, Simpan" : "Ya, Tambahkan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    const payload = { ...form, department: form.department || null };

    try {
      if (groupId) {
        await updateGroup(groupId, payload);
      } else {
        await createGroup(payload);
      }

      showToast(
        groupId
          ? `Grup ${form.name.trim()} disimpan`
          : `Grup ${form.name.trim()} ditambahkan`,
      );
      router.push("/groups");
      router.refresh();
    } catch {
      showToast(
        "Grup gagal disimpan. Nama grup mungkin sudah dipakai di departemen ini.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPage
      icon={UsersRound}
      loading={showSkeleton}
      skeletonFields={4}
      parentHref="/groups"
      parentLabel="Manajemen Grup & Akses"
      title={groupId ? "Ubah Grup" : "Tambah Grup"}
      description={
        groupId
          ? "Perbarui data grup pengguna."
          : "Grup memudahkan pemberian akses ke banyak pengguna sekaligus."
      }
      errorCount={errorSummary}
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.push("/groups")}
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
              : groupId
                ? "Simpan Perubahan"
                : "Tambah Grup"}
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
        icon={UsersRound}
        title="Identitas Grup"
        description="Nama grup bisa diambil dari jabatan pengguna di departemen yang dipilih, atau diketik manual."
      >
        <SelectField
          label="Departemen"
          value={form.department}
          options={departmentOptions(departments, form.department)}
          error={errors.department}
          placeholder="Pilih departemen"
          searchPlaceholder="Cari departemen"
          onChange={(department) => {
            if (department === form.department) {
              return;
            }

            setForm({ ...form, department, name: manualName ? form.name : "" });
            clearField("department");
          }}
        />

        <GroupNameField
          label="Nama Grup"
          value={form.name}
          error={errors.name}
          hint={nameHint}
          options={departmentCode ? nameItems : []}
          currentGroupId={groupId}
          disabled={!form.department}
          manual={manualName}
          onManualChange={(manual) => {
            setManualName(manual);
            clearField("name");
          }}
          onChange={(name) => {
            setForm((value) => ({ ...value, name }));
            clearField("name");
          }}
          onBlur={() => {
            setForm((value) => ({ ...value, name: titleText(value.name) }));
            checkField("name");
          }}
        />

        <SelectField
          label="Keterangan"
          value={form.description}
          options={groupDescriptionOptions(
            { name: form.name, department: form.department },
            form.description,
          )}
          placeholder="Pilih keterangan"
          searchPlaceholder="Cari keterangan"
          hint="Keterangan singkat tentang grup ini. Aksesnya diatur di Akses Menu dan Akses Aplikasi."
          onChange={(description) => setForm({ ...form, description })}
        />

        <SelectField
          label="Status"
          value={form.isActive ? "on" : "off"}
          options={[
            { value: "on", label: "Aktif" },
            { value: "off", label: "Nonaktif" },
          ]}
          onChange={(value) => setForm({ ...form, isActive: value === "on" })}
          hint="Grup nonaktif tidak memberi akses ke penggunanya."
        />
      </FormSection>
    </FormPage>
  );
}
