"use client";

import type { ReactNode } from "react";
import { CircleCheck, CircleX, Users } from "lucide-react";
import { UserAccountSection } from "@/components/management/user-form/user-account-section";
import { UserPersonalSection } from "@/components/management/user-form/user-personal-section";
import { FormPage } from "@/components/portal/form-page";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useUserForm } from "@/features/users/use-user-form";

type UserFormProps = Readonly<{
  userId?: string;
  after?: ReactNode;
}>;

export function UserForm({ userId, after }: UserFormProps) {
  const controller = useUserForm(userId);
  const { editing, saving } = controller;

  return (
    <FormPage
      icon={Users}
      loading={controller.showSkeleton}
      skeletonFields={6}
      after={after}
      parentHref="/users"
      parentLabel="Manajemen Pengguna"
      title={editing ? "Ubah Pengguna" : "Tambah Pengguna"}
      description={
        editing
          ? "Perbarui data pengguna SSO Launcher."
          : "Isi data pengguna baru untuk SSO Launcher."
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
                : "Tambah Pengguna"}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={CircleCheck} size={18} />
            )}
          </button>
        </>
      }
    >
      <UserPersonalSection controller={controller} />
      <UserAccountSection controller={controller} />
    </FormPage>
  );
}
