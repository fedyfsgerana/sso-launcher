import { describe, expect, it } from "vitest";
import {
  EMPTY_USER_FORM,
  saveErrorMessage,
  validateUserForm,
  type UserFormValue,
} from "@/features/users/user-form-state";
import { ApiError } from "@/lib/api/client";

const DEPARTMENTS = [
  { name: "Information Technology", code: "IT" },
  { name: "Human Resources", code: "HR" },
];

const ORIGINAL: UserFormValue = {
  ...EMPTY_USER_FORM,
  name: "Dewi Lestari",
  email: "dewi.lestari@example.com",
  employeeNumber: "10001",
  department: "Information Technology",
  jobTitle: "Staf",
};

describe("validateUserForm", () => {
  const base = {
    editing: false,
    original: EMPTY_USER_FORM,
    departments: DEPARTMENTS,
  };

  it("mewajibkan nama, email, departemen dari daftar, dan password saat menambah", () => {
    const errors = validateUserForm(EMPTY_USER_FORM, base);

    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.department).toBe("Pilih departemen dari daftar");
    expect(errors.password).toBeTruthy();
  });

  it("menolak format email yang salah", () => {
    expect(
      validateUserForm({ ...ORIGINAL, email: "dewi@" }, base).email,
    ).toBe("Format email tidak valid");
    expect(validateUserForm(ORIGINAL, base).email).toBeUndefined();
  });

  it("tidak mewajibkan NIK", () => {
    const form = { ...ORIGINAL, employeeNumber: "" };

    expect(
      Object.keys(validateUserForm(form, base)).includes("employeeNumber"),
    ).toBe(false);
  });

  it("tidak memeriksa password saat mengubah pengguna", () => {
    expect(
      validateUserForm(ORIGINAL, {
        ...base,
        editing: true,
        original: ORIGINAL,
      }).password,
    ).toBeUndefined();
  });

  it("menerima departemen lama selama departemennya tidak diubah", () => {
    const form = { ...ORIGINAL, department: "Departemen Lama" };

    expect(
      validateUserForm(form, {
        ...base,
        editing: true,
        original: form,
      }).department,
    ).toBeUndefined();
  });
});

describe("saveErrorMessage", () => {
  it("menjelaskan bentrok email atau NIK", () => {
    expect(saveErrorMessage(new ApiError(409), false)).toContain(
      "Email atau NIK sudah dipakai",
    );
    expect(saveErrorMessage(new ApiError(400), true)).toContain(
      "Perubahan gagal disimpan",
    );
  });

  it("menjelaskan sesi habis, akses ditolak, galat server, dan galat jaringan", () => {
    expect(saveErrorMessage(new ApiError(401), true)).toBe(
      "Sesi Anda sudah berakhir. Silakan masuk kembali.",
    );
    expect(saveErrorMessage(new ApiError(403), false)).toContain(
      "tidak punya akses",
    );
    expect(saveErrorMessage(new ApiError(500), false)).toContain("kode 500");
    expect(saveErrorMessage(new Error("offline"), false)).toContain(
      "Periksa koneksi",
    );
  });
});
