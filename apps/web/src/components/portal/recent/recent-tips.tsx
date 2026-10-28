"use client";

import { Lightbulb, Star } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type RecentTipsProps = Readonly<{
  total: number;
  onShowFavorites: () => void;
}>;

export function RecentTips({ total, onShowFavorites }: RecentTipsProps) {
  return (
    <aside className="rc-aside">
      <section className="card tip-card">
        <header className="tip-head">
          <h3>
            <i className="ch-ic">
              <Icon icon={Lightbulb} size={18} />
            </i>
            Akses Lebih Cepat
          </h3>
        </header>

        <div className="tip-body">
          <p>
            Semua aktivitas terbaru Anda disimpan di sini untuk memudahkan akses
            kembali. Saat ini ada <b>{total} aktivitas</b> tercatat.
          </p>
        </div>

        <footer className="tip-foot">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onShowFavorites}
          >
            Lihat Favorit
            <Icon icon={Star} size={18} />
          </button>
        </footer>
      </section>
    </aside>
  );
}
