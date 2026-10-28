"use client";

import { KeyRound, Sparkles } from "lucide-react";
import { Field, FormSection, SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { PasswordChecklist } from "@/components/ui/password-checklist";
import { PasswordInput } from "@/components/ui/password-input";
import type { UserFormController } from "@/features/users/use-user-form";

type UserAccountSectionProps = Readonly<{
  controller: UserFormController;
}>;

const STATUS_OPTIONS = [
  { value: "on", label: "Aktif" },
  { value: "off", label: "Nonaktif" },
];

export function UserAccountSection({ controller }: UserAccountSectionProps) {
  const { form, errors, editing } = controller;

  return (
    <FormSection
      icon={KeyRound}
      title="Akun"
      description="Kredensial masuk ke portal. Hak akses diatur lewat grup."
    >
      <Field
        label="Email"
        error={errors.email}
        hint="Dipakai untuk login dan dikirim ke aplikasi saat SSO."
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          value={form.email}
          placeholder="Masukkan email"
          aria-invalid={errors.email ? true : undefined}
          onChange={(event) => controller.change({ email: event.target.value })}
          onBlur={() => {
            controller.tidyEmail();
            controller.checkField("email");
          }}
        />
      </Field>

      {editing ? (
        <SelectField
          label="Status"
          placeholder="Pilih status"
          value={form.isActive ? "on" : "off"}
          options={STATUS_OPTIONS}
          onChange={(value) => controller.change({ isActive: value === "on" })}
        />
      ) : (
        <>
          <Field label="Password" error={errors.password}>
            <PasswordInput
              value={form.password}
              placeholder="Masukkan password"
              invalid={Boolean(errors.password)}
              onChange={(password) => controller.change({ password })}
              onBlur={() => controller.checkField("password")}
            />
            <PasswordChecklist value={form.password} />
          </Field>

          <div className="fld span2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={controller.randomPassword}
            >
              Buat Password Acak
              <Icon icon={Sparkles} size={18} />
            </button>
          </div>
        </>
      )}
    </FormSection>
  );
}
