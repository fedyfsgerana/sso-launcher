import { useState, type SyntheticEvent } from "react";
import { ArrowRightLeft, CircleX, X } from "lucide-react";
import { useToast } from "@/components/portal/toast";
import { SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  updatePortalMenu,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";

type MoveOption = Readonly<{ value: string; label: string }>;

type MenuMoveModalProps = Readonly<{
  menu: AdminPortalMenu;
  options: MoveOption[];
  onClose: () => void;
  onMoved: () => void;
}>;

export function MenuMoveModal({
  menu,
  options,
  onClose,
  onMoved,
}: MenuMoveModalProps) {
  const { showToast } = useToast();
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const option = options.find((item) => item.value === target);

    if (!option) {
      setError("Pilih posisi tujuan");
      return;
    }

    setSaving(true);

    try {
      await updatePortalMenu(menu.id, {
        label: menu.label,
        icon: menu.icon,
        parentId: option.value,
        targetType: menu.targetType,
        targetValue: menu.targetValue,
        isActive: menu.isActive,
      });
      showToast(`Menu ${menu.label} dipindahkan: ${option.label}`);
      onMoved();
    } catch {
      setError("Menu gagal dipindahkan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menuMoveTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form className="modal-card dup-card mh-info" onSubmit={submit}>
        <header>
          <span className="mh-ic">
            <Icon icon={ArrowRightLeft} size={20} />
          </span>

          <div>
            <h3 id="menuMoveTitle">Pindah Posisi</h3>
            <p>
              Menu <b>{menu.label}</b> beserta submenunya akan dipindahkan ke
              posisi yang dipilih dan ditaruh di urutan paling bawah.
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
            label="Posisi Tujuan"
            value={target}
            options={[...options]}
            error={error}
            placeholder="Pilih posisi tujuan"
            searchPlaceholder="Cari bagian atau menu"
            hint="Pilih bagian untuk menjadikannya menu utama, atau pilih menu untuk menjadikannya submenu."
            onChange={(value) => {
              setTarget(value);
              setError(undefined);
            }}
          />
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
            className={saving ? "btn tone-info is-loading" : "btn tone-info"}
            type="submit"
            disabled={saving}
          >
            {saving ? "Memindahkan" : "Pindahkan"}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={ArrowRightLeft} size={18} />
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}
