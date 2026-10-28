"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { CircleCheck } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { useDepartments } from "@/features/departments/use-departments";
import { createUser, getUser, updateUser } from "@/features/users/api";
import {
  EMPTY_USER_FORM,
  saveErrorMessage,
  userFormFromUser,
  validateUserForm,
  type UserFormValue,
} from "@/features/users/user-form-state";
import { generatePassword } from "@/lib/portal/password";
import { titleText } from "@/lib/portal/text-format";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import { useMinLoading } from "@/lib/portal/use-min-loading";

export function useUserForm(userId?: string) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { departments } = useDepartments();
  const [form, setForm] = useState<UserFormValue>(EMPTY_USER_FORM);
  const [original, setOriginal] = useState<UserFormValue>(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));
  const editing = Boolean(userId);
  const showSkeleton = useMinLoading(loading);
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors(form, (value) =>
      validateUserForm(value, { editing, original, departments }),
    );

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    void getUser(userId)
      .catch(() => null)
      .then((user) => {
        if (!active) {
          return;
        }

        setLoading(false);

        if (user) {
          const loaded = userFormFromUser(user);

          setForm(loaded);
          setOriginal(loaded);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  function change(patch: Partial<UserFormValue>) {
    setForm((value) => ({ ...value, ...patch }));

    for (const field of Object.keys(patch)) {
      clearField(field);
    }
  }

  function tidy(field: "name" | "jobTitle") {
    setForm((value) => ({ ...value, [field]: titleText(value[field]) }));
  }

  function tidyEmail() {
    setForm((value) => ({ ...value, email: value.email.trim().toLowerCase() }));
  }

  function randomPassword() {
    const next = generatePassword();

    change({ password: next });
    void navigator.clipboard?.writeText(next).catch(() => undefined);
    showToast("Password acak dibuat dan disalin ke papan klip");
  }

  async function save() {
    if (userId) {
      await updateUser(userId, {
        name: form.name,
        email: form.email,
        employeeNumber: form.employeeNumber || null,
        department: form.department || null,
        jobTitle: form.jobTitle || null,
        isActive: form.isActive,
      });
      return;
    }

    await createUser({
      name: form.name,
      email: form.email,
      password: form.password,
      employeeNumber: form.employeeNumber || null,
      department: form.department,
      jobTitle: form.jobTitle || null,
    });
  }

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    if (saving || Object.values(checkAll()).some(Boolean)) {
      return;
    }

    const name = form.name.trim();
    const approved = await confirm({
      title: editing ? "Simpan perubahan?" : "Tambah pengguna?",
      message: editing
        ? `Perubahan pada ${name} akan disimpan dan tercatat di riwayat aktivitas beserta nilai sebelum dan sesudahnya.`
        : `Pengguna ${name} akan ditambahkan dan tercatat di riwayat aktivitas.`,
      confirmLabel: editing ? "Ya, Simpan" : "Ya, Tambahkan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await save();
      showToast(
        editing ? `Data ${name} disimpan` : `Pengguna ${name} ditambahkan`,
      );
      router.push("/users");
      router.refresh();
    } catch (error) {
      showToast(saveErrorMessage(error, editing), "error");
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    errors,
    errorSummary,
    editing,
    saving,
    showSkeleton,
    departments,
    change,
    tidy,
    tidyEmail,
    checkField,
    randomPassword,
    submit,
    cancel: () => router.push("/users"),
  };
}

export type UserFormController = ReturnType<typeof useUserForm>;
