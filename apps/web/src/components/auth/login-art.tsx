"use client";

import Image from "next/image";
import { useId } from "react";
import { Clock, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { RingsArt } from "@/components/portal/rings-art";
import brandLogo from "@/assets/brand/logo.webp";

const POINTS: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: UsersRound, label: "Satu akun untuk semua aplikasi kerja" },
  { icon: ShieldCheck, label: "Akses sesuai grup dan jabatan" },
  { icon: Clock, label: "Sesi aman, keluar otomatis saat tidak aktif" },
];

const SCENE =
  '<svg viewBox="0 50 760 625" preserveAspectRatio="xMidYMid meet"><defs><filter id="lb-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1f4a35" flood-opacity=".22"/></filter></defs><ellipse cx="380" cy="604" rx="260" ry="16" fill="#04604f" opacity=".07"/><path class="lb-link" d="M380 330Q214 243 48 293"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-0.0s" repeatCount="indefinite" path="M380 330Q214 243 48 293"/></circle><path class="lb-link" d="M380 330Q242 150 105 200"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-0.3s" repeatCount="indefinite" path="M380 330Q242 150 105 200"/></circle><path class="lb-link" d="M380 330Q290 80 199 130"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-0.6s" repeatCount="indefinite" path="M380 330Q290 80 199 130"/></circle><path class="lb-link" d="M380 330Q348 42 317 92"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-0.9s" repeatCount="indefinite" path="M380 330Q348 42 317 92"/></circle><path class="lb-link" d="M380 330Q412 42 443 92"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path="M380 330Q412 42 443 92"/></circle><path class="lb-link" d="M380 330Q470 80 561 130"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-1.5s" repeatCount="indefinite" path="M380 330Q470 80 561 130"/></circle><path class="lb-link" d="M380 330Q518 150 655 200"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-1.8s" repeatCount="indefinite" path="M380 330Q518 150 655 200"/></circle><path class="lb-link" d="M380 330Q546 243 712 293"/><circle class="lb-pulse" r="5"><animateMotion dur="2.4s" begin="-2.1s" repeatCount="indefinite" path="M380 330Q546 243 712 293"/></circle><g class="lb-laptop"><rect x="206" y="326" width="348" height="224" rx="18" fill="#04604f" filter="url(#lb-sh)"/><rect x="222" y="342" width="316" height="192" rx="10" fill="#ffffff"/><rect x="296" y="368" width="168" height="140" rx="14" fill="#eef5ee"/><circle cx="380" cy="404" r="18" fill="#a3cb9e"/><circle cx="380" cy="398" r="7" fill="#ffffff"/><path d="M368 416a12 9 0 0 1 24 0" fill="#ffffff"/><rect class="lb-type" x="326" y="438" width="108" height="10" rx="5" fill="#a3cb9e"/><rect class="lb-type lb-type2" x="326" y="458" width="108" height="10" rx="5" fill="#d7e8d6"/><rect x="326" y="478" width="108" height="16" rx="8" fill="#04604f"/><g class="lb-check"><circle cx="458" cy="372" r="17" fill="#2f9e6b" filter="url(#lb-sh)"/><path d="M450 372l6 6 10-11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M164 560h432l-26 30H190z" fill="#3f8a6e" filter="url(#lb-sh)"/><path d="M164 560h432l-4 6H168z" fill="#a3cb9e"/><rect x="350" y="560" width="60" height="6" rx="3" fill="#04604f" opacity=".35"/></g><g class="lb-plant"><path d="M140 628c0-48 18-78 46-94M140 628c-8-38-36-58-64-62" fill="none" stroke="#04604f" stroke-width="4" stroke-linecap="round"/><g class="lb-leafA"><path d="M188 532c-22 10-36 32-30 54 22-6 32-28 30-54z" fill="#3f8a6e"/></g><g class="lb-leafB"><path d="M70 564c4 24 24 38 46 36-2-22-22-36-46-36z" fill="#a3cb9e"/></g><path d="M108 624h64l-6 46h-52z" fill="#04604f" filter="url(#lb-sh)"/><rect x="104" y="620" width="72" height="12" rx="6" fill="#3f8a6e"/></g><g class="lb-key"><g transform="translate(572 642) rotate(-28)" filter="url(#lb-sh)"><circle r="22" fill="#d9a21f"/><circle r="8" fill="#fff"/><rect x="18" y="-6" width="70" height="12" rx="6" fill="#d9a21f"/><rect x="62" y="0" width="10" height="20" rx="3" fill="#d9a21f"/><rect x="78" y="0" width="10" height="14" rx="3" fill="#d9a21f"/></g></g><g class="lb-app" style="animation-delay:-0.00s"><g transform="translate(48 293)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#0f766e" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="-14" y="-12" width="28" height="26" rx="5"/><path d="M-14 -3h28M-7 -17v8M7 -17v8"/></g></g></g><g class="lb-app" style="animation-delay:-0.65s"><g transform="translate(105 200)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#3f5f8a" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="-4" cy="-6" r="7"/><path d="M-17 15c0-8 6-12 13-12s13 4 13 12"/><path d="M9 -11a6 6 0 0 1 0 11M12 3c4 1 6 5 6 10"/></g></g></g><g class="lb-app" style="animation-delay:-1.30s"><g transform="translate(199 130)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#b83f8e" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-15 -12h30v20h-14l-9 8v-8h-7z"/><path d="M-8 -3h16M-8 3h9"/></g></g></g><g class="lb-app" style="animation-delay:-1.95s"><g transform="translate(317 92)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#d27a1f" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -16l14 7v17L0 16l-14-8v-17z"/><path d="M-14 -9L0 -1l14-8M0 -1v17"/></g></g></g><g class="lb-app" style="animation-delay:-2.60s"><g transform="translate(443 92)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#5a55c9" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-15 14h30"/><path d="M-9 10v-9M0 10v-18M9 10v-26"/></g></g></g><g class="lb-app" style="animation-delay:-3.25s"><g transform="translate(561 130)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#1f3a68" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="-12" y="-15" width="24" height="30" rx="4"/><path d="M-5 -15v-3h10v3"/><path d="m-6 2 4 4 8-9"/></g></g></g><g class="lb-app" style="animation-delay:-3.90s"><g transform="translate(655 200)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#0b7fab" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-17 -9h18v16h-18zM1 -3h8l7 7v3H1z"/><circle cx="-9" cy="10" r="4"/><circle cx="9" cy="10" r="4"/></g></g></g><g class="lb-app" style="animation-delay:-4.55s"><g transform="translate(712 293)"><rect x="-38" y="-38" width="76" height="76" rx="20" fill="#c43d2f" filter="url(#lb-sh)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M-10 -17h13l8 8v26h-21z"/><path d="M-5 2h10M-5 9h10"/></g></g></g></svg>';

function withUniqueIds(markup: string, ids: readonly string[], uid: string) {
  let result = markup;

  for (const id of ids) {
    result = result
      .split(`id="${id}"`)
      .join(`id="${id}${uid}"`)
      .split(`url(#${id})`)
      .join(`url(#${id}${uid})`);
  }

  return result;
}

export function LoginArt() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className="la">
      <div className="la-glow" aria-hidden="true" />
      <RingsArt className="la-rings" />

      <div className="la-stage">
        <div className="la-copy">
          <h2>Satu Akses untuk Semua Aplikasi.</h2>
          <p>
            Masuk sekali, lalu buka aplikasi kerja Anda tanpa login ulang. Aman
            dan terpusat di SSO Launcher.
          </p>
          <ul className="la-points">
            {POINTS.map((point) => (
              <li key={point.label}>
                <span>
                  <Icon icon={point.icon} size={17} strokeWidth={2} />
                </span>
                {point.label}
              </li>
            ))}
          </ul>
          <div className="la-brand">
            <Image
              className="la-logo"
              src={brandLogo}
              alt="Logo SSO Launcher"
              priority
            />
            <span className="la-divider" aria-hidden="true" />
            <div>
              <b>
                SSO <span>LAUNCHER</span>
              </b>
              <small>PORTAL AKSES APLIKASI</small>
            </div>
          </div>
        </div>

        <div
          className="lb-art"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: withUniqueIds(SCENE, ["lb-sh"], uid),
          }}
        />
      </div>
    </div>
  );
}
