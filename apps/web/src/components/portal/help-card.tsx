"use client";

import {
  ChevronRight,
  Headset,
  LayoutGrid,
  Lock,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/portal/toast";

type HelpTopic = Readonly<{
  icon: LucideIcon;
  tone: string;
  title: string;
  hint: string;
  answer: string;
}>;

const TOPICS: readonly HelpTopic[] = [
  {
    icon: Lock,
    tone: "var(--pal-slate)",
    title: "Lupa password",
    hint: "Minta reset ke Administrator",
    answer: "Hubungi Administrator Sistem untuk mengatur ulang password Anda.",
  },
  {
    icon: LayoutGrid,
    tone: "var(--pal-teal)",
    title: "Belum punya akses",
    hint: "Ajukan akses aplikasi",
    answer:
      "Minta Administrator Sistem menambahkan Anda ke grup yang punya akses aplikasi tersebut.",
  },
  {
    icon: TriangleAlert,
    tone: "var(--pal-red)",
    title: "Aplikasi tidak bisa dibuka",
    hint: "Laporkan kendala",
    answer:
      "Catat nama aplikasi dan pesan yang muncul, lalu laporkan ke Administrator Sistem.",
  },
  {
    icon: ShieldAlert,
    tone: "var(--pal-orange)",
    title: "Akun terkunci",
    hint: "Terlalu banyak percobaan login",
    answer:
      "Akun dikunci sementara karena terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi, atau hubungi Administrator Sistem.",
  },
];

export function HelpCard() {
  const { showToast } = useToast();

  return (
    <section className="card help">
      <div className="eyebrow">
        <i className="rule" />
        BANTUAN
      </div>
      <h3>Butuh bantuan?</h3>

      <ul className="help-topics">
        {TOPICS.map((topic) => (
          <li key={topic.title}>
            <button type="button" onClick={() => showToast(topic.answer)}>
              <span className="help-tile" style={{ background: topic.tone }}>
                <Icon icon={topic.icon} size={16} />
              </span>
              <span className="help-text">
                <b>{topic.title}</b>
                <small>{topic.hint}</small>
              </span>
              <Icon icon={ChevronRight} size={16} />
            </button>
          </li>
        ))}
      </ul>

      <button
        className="btn"
        type="button"
        onClick={() =>
          showToast("Hubungi Administrator Sistem untuk bantuan akun.")
        }
      >
        Hubungi Administrator
        <Icon icon={Headset} size={18} />
      </button>
    </section>
  );
}
