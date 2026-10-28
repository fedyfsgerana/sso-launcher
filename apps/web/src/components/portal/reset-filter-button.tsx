"use client";

import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";

type ResetFilterButtonProps = Readonly<{
  onReset: () => void;
}>;

export function ResetFilterButton({ onReset }: ResetFilterButtonProps) {
  const { showToast } = useToast();

  return (
    <button
      className="icon-sq"
      type="button"
      aria-label="Atur ulang filter"
      title="Atur ulang filter"
      onClick={() => {
        onReset();
        showToast("Filter diatur ulang");
      }}
    >
      <Icon icon={RotateCcw} size={18} />
    </button>
  );
}
