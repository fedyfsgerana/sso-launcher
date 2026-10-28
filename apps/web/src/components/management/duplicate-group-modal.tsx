"use client";

import { useState, type SyntheticEvent } from "react";
import { CircleX, Copy, X } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { duplicateGroup, type UserGroup } from "@/features/groups/api";
import { titleText } from "@/lib/portal/text-format";

type DuplicateGroupModalProps = Readonly<{
  group: UserGroup | null;
  onClose: () => void;
  onDone: () => void;
}>;

export function DuplicateGroupModal({
  group,
  onClose,
  onDone,
}: DuplicateGroupModalProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [name, setName] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  if (group && loadedFor !== group.id) {
    setLoadedFor(group.id);
    setName(`${group.name} (Salinan)`);
    setError(undefined);
  }

  if (!group) {
    return null;
  }

  const source = group;

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const value = name.trim();

    if (!value) {
      setError("Nama grup wajib diisi.");
      return;
    }

    const approved = await confirm({
      title: "Duplikat grup?",
      message: `Grup ${value} akan dibuat dengan akses aplikasi dan akses menu yang sama seperti ${source.name}. Pengguna di dalamnya tidak ikut disalin.`,
      confirmLabel: "Ya, Duplikat",
      icon: Copy,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await duplicateGroup(source.id, value);
      showToast(`Grup ${value} dibuat dari ${source.name}`);
      onDone();
    } catch {
      setError(
        "Nama grup sudah dipakai di departemen ini atau grup asal tidak ditemukan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dupTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form className="modal-card dup-card mh-success" onSubmit={submit}>
        <header>
          <span className="mh-ic">
            <Icon icon={Copy} size={20} />
          </span>

          <div>
            <h3 id="dupTitle">Duplikat Grup</h3>
            <p>
              Buat grup baru dengan akses yang sama seperti <b>{source.name}</b>
              .
            </p>
          </div>

          <button
            className="icon-btn fm-close"
            type="button"
            aria-label="Tutup"
            disabled={saving}
            onClick={onClose}
          >
            <Icon icon={X} size={18} />
          </button>
        </header>

        <div className="dup-body">
          <p className="note-box">
            Akses aplikasi ({source.applicationCount}) dan akses menu (
            {source.menuCount}) ikut disalin. Pengguna di dalamnya tidak ikut
            disalin.
          </p>

          <label className={error ? "fld has-error" : "fld"}>
            <span>Nama Grup Baru</span>
            <input
              value={name}
              placeholder="Masukkan nama grup baru"
              autoFocus
              onChange={(event) => {
                setName(event.target.value);
                setError(undefined);
              }}
              onBlur={() => setName((value) => titleText(value))}
            />
            {error ? <em className="fld-msg">{error}</em> : null}
          </label>
        </div>

        <footer>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            Batal
            <Icon icon={CircleX} size={18} />
          </button>

          <button
            className={
              saving ? "btn tone-success is-loading" : "btn tone-success"
            }
            type="submit"
            disabled={saving}
          >
            {saving ? "Menyalin" : "Duplikat Grup"}
            {saving ? <Spinner size={16} /> : <Icon icon={Copy} size={18} />}
          </button>
        </footer>
      </form>
    </div>
  );
}
