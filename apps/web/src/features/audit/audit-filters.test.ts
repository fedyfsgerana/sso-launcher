import { describe, expect, it } from "vitest";
import {
  EMPTY_AUDIT_FILTERS,
  auditQueryFilters,
  hasAuditFilters,
} from "@/features/audit/audit-filters";

function localMidnight(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

describe("auditQueryFilters", () => {
  it("mengosongkan tanggal saat filter tanggal tidak diisi", () => {
    expect(auditQueryFilters(EMPTY_AUDIT_FILTERS)).toEqual({
      action: "",
      module: "",
      outcome: "",
      actorId: "",
      from: "",
      to: "",
    });
  });

  it("mengubah rentang tanggal menjadi awal hari pertama sampai awal hari setelah hari terakhir", () => {
    const query = auditQueryFilters({
      ...EMPTY_AUDIT_FILTERS,
      fromDate: "2026-10-01",
      toDate: "2026-10-06",
    });

    expect(query.from).toBe(localMidnight("2026-10-01"));
    expect(query.to).toBe(localMidnight("2026-10-07"));
  });

  it("melewati batas bulan dan tahun dengan benar", () => {
    expect(
      auditQueryFilters({ ...EMPTY_AUDIT_FILTERS, toDate: "2026-10-31" }).to,
    ).toBe(localMidnight("2026-11-01"));
    expect(
      auditQueryFilters({ ...EMPTY_AUDIT_FILTERS, toDate: "2026-12-31" }).to,
    ).toBe(localMidnight("2027-01-01"));
  });

  it("meneruskan filter aksi, modul, hasil, dan pengguna apa adanya", () => {
    const query = auditQueryFilters({
      ...EMPTY_AUDIT_FILTERS,
      action: "delete",
      module: "users",
      outcome: "failed",
      actorId: "7",
    });

    expect(query).toMatchObject({
      action: "delete",
      module: "users",
      outcome: "failed",
      actorId: "7",
    });
  });
});

describe("hasAuditFilters", () => {
  it("bernilai false hanya saat semua filter kosong", () => {
    expect(hasAuditFilters(EMPTY_AUDIT_FILTERS)).toBe(false);
    expect(hasAuditFilters({ ...EMPTY_AUDIT_FILTERS, outcome: "failed" })).toBe(
      true,
    );
    expect(
      hasAuditFilters({ ...EMPTY_AUDIT_FILTERS, fromDate: "2026-10-01" }),
    ).toBe(true);
  });
});
