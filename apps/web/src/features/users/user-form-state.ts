import type { PortalUser } from "@/features/users/api";
import { ApiError } from "@/lib/api/client";
import {
  isKnownDepartment,
  type DepartmentLike,
} from "@/lib/portal/departments";
import { passwordError } from "@/lib/portal/password-rules";
import { requireEmail, requireText } from "@/lib/portal/validation";

export type UserFormValue = Readonly<{
  name: string;
  email: string;
  password: string;
  employeeNumber: string;
  department: string;
  jobTitle: string;
  isActive: boolean;
}>;

type Departments = ReadonlyArray<DepartmentLike>;

export const EMPTY_USER_FORM: UserFormValue = {
  name: "",
  email: "",
  password: "",
  employeeNumber: "",
  department: "",
  jobTitle: "",
  isActive: true,
};

export function userFormFromUser(user: PortalUser): UserFormValue {
  return {
    name: user.name,
    email: user.email,
    password: "",
    employeeNumber: user.employeeNumber ?? "",
    department: user.department ?? "",
    jobTitle: user.jobTitle ?? "",
    isActive: user.isActive,
  };
}

export function validateUserForm(
  value: UserFormValue,
  options: Readonly<{
    editing: boolean;
    original: UserFormValue;
    departments: Departments;
  }>,
) {
  const departmentUnchanged =
    options.editing && value.department === options.original.department;

  return {
    name: requireText(value.name),
    email: requireEmail(value.email),
    department:
      departmentUnchanged ||
      isKnownDepartment(options.departments, value.department)
        ? undefined
        : "Pilih departemen dari daftar",
    password: options.editing ? undefined : passwordError(value.password),
  };
}

export function saveErrorMessage(error: unknown, editing: boolean) {
  const action = editing
    ? "Perubahan gagal disimpan"
    : "Pengguna gagal ditambahkan";

  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 409) {
      return `${action}. Email atau NIK sudah dipakai pengguna lain, atau isiannya tidak valid.`;
    }

    if (error.status === 401) {
      return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
    }

    if (error.status === 403) {
      return `${action}. Anda tidak punya akses ke Manajemen Pengguna.`;
    }

    return `${action}. Terjadi kesalahan di server (kode ${error.status}).`;
  }

  return `${action}. Periksa koneksi ke server lalu coba lagi.`;
}
