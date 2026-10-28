"use client";

import { useState } from "react";

export function useRowSelection(pageIds: readonly string[]) {
  const [selected, setSelected] = useState<string[]>([]);

  const allChecked =
    pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someChecked =
    !allChecked && pageIds.some((id) => selected.includes(id));

  function isSelected(id: string) {
    return selected.includes(id);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((value) =>
      checked ? [...value, id] : value.filter((item) => item !== id),
    );
  }

  function toggleAll(checked: boolean) {
    setSelected((value) =>
      checked
        ? [...new Set([...value, ...pageIds])]
        : value.filter((item) => !pageIds.includes(item)),
    );
  }

  function clear() {
    setSelected([]);
  }

  return {
    selected,
    allChecked,
    someChecked,
    isSelected,
    toggleOne,
    toggleAll,
    clear,
  };
}
