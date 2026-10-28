"use client";

import { Check, CircleCheck, Plus, Star, X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { useFavoriteToggle } from "@/features/portal/use-favorite-toggle";
import { resolveIcon } from "@/lib/icons";

type FavoriteModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function FavoriteModal({ open, onClose }: FavoriteModalProps) {
  const { applications } = usePortalData();
  const toggleFavorite = useFavoriteToggle();

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fmTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-card mh-warn">
        <header>
          <span className="mh-ic">
            <Icon icon={Star} size={20} />
          </span>

          <div>
            <h3 id="fmTitle">Tambah Favorit</h3>
            <p>Pilih aplikasi untuk ditampilkan di halaman Favorit.</p>
          </div>

          <button
            className="icon-btn fm-close"
            type="button"
            aria-label="Tutup"
            onClick={onClose}
          >
            <Icon icon={X} size={18} />
          </button>
        </header>

        <div className="fm-list">
          {applications.map((application) => (
            <div className="fm-row" key={application.id}>
              <span className={`rc-ic ${application.color}`}>
                <Icon icon={resolveIcon(application.icon)} />
              </span>

              <div className="fm-txt">
                <b>{application.name}</b>
                <small>{application.description}</small>
              </div>

              <button
                className={application.isFavorite ? "sm-btn on" : "sm-btn"}
                type="button"
                aria-pressed={application.isFavorite}
                onClick={() => void toggleFavorite(application.id)}
              >
                <Icon icon={application.isFavorite ? Check : Plus} size={15} />
                {application.isFavorite ? "Favorit" : "Tambah"}
              </button>
            </div>
          ))}
        </div>

        <footer>
          <button className="btn" type="button" onClick={onClose}>
            Selesai
            <Icon icon={CircleCheck} size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
}
