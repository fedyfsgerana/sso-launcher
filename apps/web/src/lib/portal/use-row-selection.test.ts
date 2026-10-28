import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRowSelection } from "@/lib/portal/use-row-selection";

function setup(initialIds: readonly string[]) {
  return renderHook(({ ids }) => useRowSelection(ids), {
    initialProps: { ids: initialIds },
  });
}

describe("useRowSelection", () => {
  it("dimulai tanpa pilihan", () => {
    const { result } = setup(["1", "2", "3"]);

    expect(result.current.selected).toEqual([]);
    expect(result.current.allChecked).toBe(false);
    expect(result.current.someChecked).toBe(false);
  });

  it("memilih dan membatalkan satu baris", () => {
    const { result } = setup(["1", "2", "3"]);

    act(() => result.current.toggleOne("2", true));

    expect(result.current.isSelected("2")).toBe(true);
    expect(result.current.someChecked).toBe(true);
    expect(result.current.allChecked).toBe(false);

    act(() => result.current.toggleOne("2", false));

    expect(result.current.selected).toEqual([]);
    expect(result.current.someChecked).toBe(false);
  });

  it("memilih semua lalu mengosongkan semua baris di halaman ini", () => {
    const { result } = setup(["1", "2", "3"]);

    act(() => result.current.toggleAll(true));

    expect(result.current.selected).toEqual(["1", "2", "3"]);
    expect(result.current.allChecked).toBe(true);
    expect(result.current.someChecked).toBe(false);

    act(() => result.current.toggleAll(false));

    expect(result.current.selected).toEqual([]);
  });

  it("tidak menggandakan baris yang sudah dipilih saat memilih semua", () => {
    const { result } = setup(["1", "2"]);

    act(() => result.current.toggleOne("1", true));
    act(() => result.current.toggleAll(true));

    expect(result.current.selected).toEqual(["1", "2"]);
  });

  it("mempertahankan pilihan dari halaman lain", () => {
    const { result, rerender } = setup(["1", "2"]);

    act(() => result.current.toggleOne("1", true));
    rerender({ ids: ["3", "4"] });

    expect(result.current.allChecked).toBe(false);
    expect(result.current.someChecked).toBe(false);

    act(() => result.current.toggleAll(true));

    expect(result.current.selected).toEqual(["1", "3", "4"]);
    expect(result.current.allChecked).toBe(true);

    act(() => result.current.toggleAll(false));

    expect(result.current.selected).toEqual(["1"]);
  });

  it("menganggap halaman kosong tidak tercentang", () => {
    const { result } = setup([]);

    expect(result.current.allChecked).toBe(false);
    expect(result.current.someChecked).toBe(false);
  });

  it("mengosongkan seluruh pilihan", () => {
    const { result } = setup(["1", "2"]);

    act(() => result.current.toggleAll(true));
    act(() => result.current.clear());

    expect(result.current.selected).toEqual([]);
  });
});
