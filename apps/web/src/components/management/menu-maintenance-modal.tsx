"use client";

import { useState, type SyntheticEvent } from "react";
import { CircleCheck, CircleX, Wrench, X } from "lucide-react";
import { SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/portal/toast";
import {
  setMenuMaintenance,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";
import { sentenceText, titleText } from "@/lib/portal/text-format";

type MenuMaintenanceModalProps = Readonly<{
  menu: AdminPortalMenu;
  onClose: () => void;
  onSaved: () => void;
}>;

export function MenuMaintenanceModal({
  menu,
  onClose,
  onSaved,
}: MenuMaintenanceModalProps) {
  const { showToast } = useToast();
  const [active, setActive] = useState(menu.maintenanceActive);
  const [title, setTitle] = useState(
    menu.maintenanceTitle ?? "Halaman sedang dalam perbaikan",
  );
  const [message, setMessage] = useState(menu.maintenanceMessage ?? "");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (active && title.trim() === "") {
      setError("Judul wajib diisi saat mode perbaikan aktif.");
      return;
    }

    setSaving(true);

    try {
      await setMenuMaintenance(menu.id, { active, title, message });
      onSaved();
      showToast(
        active
          ? `${menu.label} ditandai sedang dalam perbaikan`
          : `Mode perbaikan ${menu.label} dimatikan`,
      );
      onClose();
    } catch {
      showToast("Mode perbaikan gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenanceTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form className="modal-card dup-card mh-warn" onSubmit={submit}>
        <header>
          <span className="mh-ic">
            <Icon icon={Wrench} size={20} />
          </span>

          <div>
            <h3 id="maintenanceTitle">Mode Perbaikan</h3>
            <p>
              Saat aktif, semua pengguna yang membuka <b>{menu.label}</b>{" "}
              beserta submenunya melihat halaman pemberitahuan, bukan halaman
              aslinya.
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
          <SelectField
            label="Status Halaman"
            value={active ? "maintenance" : "normal"}
            options={[
              { value: "normal", label: "Normal" },
              { value: "maintenance", label: "Sedang diperbaiki" },
            ]}
            onChange={(value) => {
              setActive(value === "maintenance");
              setError(undefined);
            }}
          />

          {active ? (
            <>
              <p className="note-box warn">
                Berlaku untuk semua pengguna, termasuk administrator. Kembalikan
                ke Normal kalau halamannya perlu dibuka.
              </p>

              <label className={error ? "fld has-error" : "fld"}>
                <span>Judul Pemberitahuan</span>
                <input
                  value={title}
                  placeholder="Masukkan judul pemberitahuan"
                  maxLength={120}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError(undefined);
                  }}
                  onBlur={() => setTitle((value) => titleText(value))}
                />
                {error ? <em className="fld-msg">{error}</em> : null}
              </label>

              <label className="fld">
                <span>Keterangan</span>
                <textarea
                  value={message}
                  maxLength={500}
                  rows={4}
                  placeholder="Masukkan keterangan perbaikan"
                  onChange={(event) => setMessage(event.target.value)}
                  onBlur={() => setMessage((value) => sentenceText(value))}
                />
                <em className="fld-hint">
                  Jelaskan bagian apa yang sedang diperbaiki dan perkiraan
                  selesainya.
                </em>
              </label>
            </>
          ) : (
            <p className="note-box">
              Halaman dibuka seperti biasa. Pilih Sedang diperbaiki untuk
              menampilkan pemberitahuan kepada pengguna.
            </p>
          )}
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
            className={[
              "btn",
              active ? "tone-warn" : "",
              saving ? "is-loading" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="submit"
            disabled={saving}
          >
            {saving ? "Menyimpan" : active ? "Simpan Perbaikan" : "Simpan"}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={active ? Wrench : CircleCheck} size={18} />
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}
