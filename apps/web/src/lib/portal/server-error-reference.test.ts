import { afterEach, describe, expect, it, vi } from "vitest";
import {
  referenceFromBody,
  rememberServerError,
  takeServerErrorReference,
} from "@/lib/portal/server-error-reference";

describe("nomor referensi error server", () => {
  afterEach(() => {
    vi.useRealTimers();
    takeServerErrorReference();
  });

  it("mengambil nomor referensi dari isi respons", () => {
    expect(referenceFromBody({ referenceId: "4F2A9C1B7E" })).toBe(
      "4F2A9C1B7E",
    );
    expect(referenceFromBody({ title: "error" })).toBeNull();
    expect(referenceFromBody(null)).toBeNull();
  });

  it("nomor referensi hanya bisa diambil sekali", () => {
    rememberServerError("ABC123DEF0");

    expect(takeServerErrorReference()).toBe("ABC123DEF0");
    expect(takeServerErrorReference()).toBeNull();
  });

  it("nomor referensi yang sudah lama diabaikan", () => {
    vi.useFakeTimers();
    rememberServerError("LAMA000000");
    vi.advanceTimersByTime(6000);

    expect(takeServerErrorReference()).toBeNull();
  });
});
