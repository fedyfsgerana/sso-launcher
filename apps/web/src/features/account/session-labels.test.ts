import { describe, expect, it } from "vitest";
import type { AccountSession } from "@/features/account/api";
import {
  describeAddress,
  describeLocation,
  describeSession,
  isMobileSession,
} from "@/features/account/session-labels";

function session(overrides: Partial<AccountSession> = {}): AccountSession {
  return {
    id: "1",
    browser: "Chrome",
    browserVersion: "131.0.6778.204",
    operatingSystem: "Windows 11",
    deviceName: null,
    ipAddress: "10.1.2.3",
    createdAt: "2026-10-06T01:00:00Z",
    lastSeenAt: "2026-10-06T02:00:00Z",
    expiresAt: "2026-10-06T09:00:00Z",
    isCurrent: false,
    ...overrides,
  };
}

describe("describeSession", () => {
  it("menggabungkan peramban, versi utama, dan sistem operasi", () => {
    expect(describeSession(session())).toBe("Chrome 131 · Windows 11");
  });

  it("melewati bagian yang kosong", () => {
    expect(
      describeSession(session({ browserVersion: null, operatingSystem: null })),
    ).toBe("Chrome");
    expect(
      describeSession(session({ browser: null, browserVersion: null })),
    ).toBe("Windows 11");
  });

  it("memakai teks cadangan saat tidak ada informasi perangkat", () => {
    expect(
      describeSession(
        session({ browser: null, browserVersion: null, operatingSystem: null }),
      ),
    ).toBe("Perangkat tidak dikenal");
  });
});

describe("describeAddress dan describeLocation", () => {
  it("menandai alamat lokal sebagai komputer ini", () => {
    expect(describeAddress("127.0.0.1")).toBe("Komputer ini (lokal)");
    expect(describeAddress("::1")).toBe("Komputer ini (lokal)");
    expect(describeAddress("::ffff:127.0.0.1")).toBe("Komputer ini (lokal)");
  });

  it("menampilkan alamat lain apa adanya dan melewati alamat kosong", () => {
    expect(describeAddress("10.1.2.3")).toBe("10.1.2.3");
    expect(describeAddress(null)).toBeNull();
  });

  it("menyusun nama perangkat, alamat, dan waktu aktif", () => {
    const location = describeLocation(
      session({ deviceName: "Laptop Kantor", ipAddress: "::1" }),
    );

    expect(location).toMatch(
      /^Laptop Kantor · Komputer ini \(lokal\) · aktif /,
    );
  });
});

describe("isMobileSession", () => {
  it("mengenali sistem operasi ponsel dan tablet", () => {
    for (const operatingSystem of ["Android 14", "iOS 18", "iPadOS 18"]) {
      expect(isMobileSession(session({ operatingSystem }))).toBe(true);
    }
  });

  it("menganggap sistem lain dan yang kosong sebagai komputer", () => {
    expect(isMobileSession(session())).toBe(false);
    expect(isMobileSession(session({ operatingSystem: null }))).toBe(false);
  });
});
