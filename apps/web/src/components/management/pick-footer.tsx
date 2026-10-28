"use client";

import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

type PickFooterProps = Readonly<{
  selected: number;
  total: number;
  unit: string;
  dirty: boolean;
  saving: boolean;
  added?: number;
  removed?: number;
  removedLabel?: string;
  cancelHref: string;
  onSave: () => void;
}>;

export function PickFooter({
  selected,
  total,
  unit,
  dirty,
  saving,
  added,
  removed,
  removedLabel = "dikeluarkan",
  cancelHref,
  onSave,
}: PickFooterProps) {
  return (
    <div className="pk-foot">
      <Link className="btn btn-ghost" href={cancelHref}>
        Batal
        <Icon icon={CircleX} size={18} />
      </Link>

      <button
        className={saving ? "btn is-loading" : "btn"}
        type="button"
        disabled={saving || !dirty}
        onClick={onSave}
      >
        {saving ? "Menyimpan" : "Simpan Perubahan"}
        {saving ? <Spinner size={16} /> : <Icon icon={CircleCheck} size={18} />}
      </button>

      <span className="pk-count">
        <b>{selected}</b> dari {total} {unit} dipilih
        {dirty && (added ?? 0) + (removed ?? 0) > 0 ? (
          <>
            {added ? (
              <em className="pk-change add">+{added} ditambahkan</em>
            ) : null}
            {removed ? (
              <em className="pk-change remove">
                −{removed} {removedLabel}
              </em>
            ) : null}
          </>
        ) : dirty ? (
          <em className="pk-dirty">Belum disimpan</em>
        ) : null}
      </span>
    </div>
  );
}
