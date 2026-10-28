import { useState } from "react";
import { CircleX, Trash2, X } from "lucide-react";
import { useToast } from "@/components/portal/toast";
import { SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  deletePortalMenu,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";
import styles from "@/components/portal/confirm-provider.module.css";

const KEEP = "keep";

type MoveOption = Readonly<{ value: string; label: string }>;

type MenuDeleteModalProps = Readonly<{
  item: AdminPortalMenu;
  noun: "bagian" | "menu";
  childCount: number;
  childNoun: string;
  keepLabel?: string;
  keepHint?: string;
  moveHint: string;
  options: MoveOption[];
  onClose: () => void;
  onDeleted: () => void;
}>;

export function MenuDeleteModal({
  item,
  noun,
  childCount,
  childNoun,
  keepLabel,
  keepHint,
  moveHint,
  options,
  onClose,
  onDeleted,
}: MenuDeleteModalProps) {
  const { showToast } = useToast();
  const requireTarget = keepLabel === undefined;
  const [target, setTarget] = useState(requireTarget ? "" : KEEP);
  const needsTarget = childCount > 0 && requireTarget && !target;
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim() || saving) {
      return;
    }

    setSaving(true);

    try {
      await deletePortalMenu(
        item.id,
        reason.trim(),
        target === KEEP || !target ? null : target,
      );

      const moved = options.find((option) => option.value === target);

      showToast(
        childCount > 0 && moved
          ? `${noun === "bagian" ? "Bagian" : "Menu"} ${item.label} dihapus, ${childCount} ${childNoun} dipindah ke ${moved.label}`
          : `${noun === "bagian" ? "Bagian" : "Menu"} ${item.label} dihapus`,
      );
      onDeleted();
    } catch {
      showToast(
        `${noun === "bagian" ? "Bagian" : "Menu"} gagal dihapus`,
        "error",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="modal ask show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menuDeleteTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="modal-card ask-card is-danger tone-danger">
        <button
          className="icon-btn ask-close"
          type="button"
          aria-label="Tutup"
          disabled={saving}
          onClick={onClose}
        >
          <Icon icon={X} size={18} />
        </button>

        <div className="ask-ic">
          <Icon icon={Trash2} size={24} />
        </div>

        <h3 id="menuDeleteTitle">Hapus {noun}?</h3>
        <p>
          {childCount > 0
            ? `${noun === "bagian" ? "Bagian" : "Menu"} "${item.label}" berisi ${childCount} ${childNoun}. Pilih ke mana ${childNoun} itu dipindahkan sebelum ${noun} dihapus.`
            : `${noun === "bagian" ? "Bagian" : "Menu"} "${item.label}" akan dihapus dan tidak tampil lagi di sidebar siapa pun.`}
        </p>

        {childCount > 0 ? (
          <div className={styles.reason}>
            <SelectField
              label={`Pindahkan ${childNoun} ke`}
              value={target}
              options={
                requireTarget
                  ? options
                  : [{ value: KEEP, label: keepLabel }, ...options]
              }
              placeholder={
                options.length > 0 ? "Pilih tujuan" : "Tidak ada tujuan lain"
              }
              hint={
                requireTarget && options.length === 0
                  ? `Buat ${noun} lain dulu untuk menampung ${childNoun} ini.`
                  : target === KEEP
                    ? keepHint
                    : moveHint
              }
              searchPlaceholder="Cari tujuan"
              onChange={setTarget}
            />
          </div>
        ) : null}

        <label className={styles.reason}>
          <span>Alasan penghapusan</span>
          <textarea
            value={reason}
            maxLength={500}
            placeholder="Masukkan alasan penghapusan"
            onChange={(event) => setReason(event.target.value)}
          />
          <em>Wajib diisi. Alasan tersimpan di riwayat aktivitas.</em>
        </label>

        <div className="ask-btns">
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
              saving
                ? "btn ask-ok tone-danger is-loading"
                : "btn ask-ok tone-danger"
            }
            type="button"
            disabled={saving || !reason.trim() || needsTarget}
            onClick={() => void submit()}
          >
            {saving ? "Menghapus" : "Hapus"}
            {saving ? <Spinner size={16} /> : <Icon icon={Trash2} size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
