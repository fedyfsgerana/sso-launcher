"use client";

import { UserRound } from "lucide-react";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import type { UserFormController } from "@/features/users/use-user-form";
import { departmentOptions } from "@/lib/portal/departments";

type UserPersonalSectionProps = Readonly<{
  controller: UserFormController;
}>;

export function UserPersonalSection({ controller }: UserPersonalSectionProps) {
  const { form, errors, departments } = controller;

  return (
    <FormSection
      icon={UserRound}
      title="Data Pribadi"
      description="Identitas pengguna di SSO Launcher."
    >
      <Field label="Nama Lengkap" error={errors.name}>
        <input
          value={form.name}
          placeholder="Masukkan nama lengkap"
          aria-invalid={errors.name ? true : undefined}
          onChange={(event) => controller.change({ name: event.target.value })}
          onBlur={() => {
            controller.tidy("name");
            controller.checkField("name");
          }}
        />
      </Field>

      <Field label="NIK" hint="Opsional. Nomor induk karyawan, harus unik.">
        <input
          value={form.employeeNumber}
          placeholder="Masukkan NIK"
          onChange={(event) =>
            controller.change({ employeeNumber: event.target.value })
          }
        />
      </Field>

      <SelectField
        label="Departemen"
        value={form.department}
        options={departmentOptions(departments, form.department)}
        error={errors.department}
        placeholder="Pilih departemen"
        searchPlaceholder="Cari departemen"
        onChange={(department) => controller.change({ department })}
      />

      <Field label="Jabatan">
        <input
          value={form.jobTitle}
          placeholder="Masukkan jabatan"
          onChange={(event) =>
            controller.change({ jobTitle: event.target.value })
          }
          onBlur={() => controller.tidy("jobTitle")}
        />
      </Field>
    </FormSection>
  );
}
