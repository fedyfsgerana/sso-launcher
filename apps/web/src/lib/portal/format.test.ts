import { describe, expect, it } from "vitest";
import { userRoleTag } from "@/lib/portal/format";

const USER = {
  jobTitle:
    "Teknisi Listrik Area Pabrik, Listrik Gudang Ciamis , Listrik WT Bak Air Luar",
  department: "Maintenance",
  departemenCode: "MTC",
};

describe("userRoleTag", () => {
  it("menaruh kode departemen di depan jabatan", () => {
    expect(userRoleTag(USER)).toBe(
      "MTC · Teknisi Listrik Area Pabrik, Listrik Gudang Ciamis , Listrik WT Bak Air Luar",
    );
  });

  it("memakai nama departemen bila kodenya kosong", () => {
    expect(
      userRoleTag({ ...USER, departemenCode: null, jobTitle: "Leader DC" }),
    ).toBe("Maintenance · Leader DC");
  });

  it("tetap rapi tanpa jabatan atau departemen", () => {
    expect(userRoleTag({ ...USER, jobTitle: "  " })).toBe("MTC");
    expect(
      userRoleTag({
        jobTitle: "Operator",
        department: null,
        departemenCode: null,
      }),
    ).toBe("Operator");
    expect(userRoleTag(null)).toBe("");
  });
});
