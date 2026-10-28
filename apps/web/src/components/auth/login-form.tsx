"use client";

import Image from "next/image";
import { useToast } from "@/components/portal/toast";
import brandLogo from "@/assets/brand/logo.webp";
import { queueToast } from "@/lib/portal/pending-toast";
import { safeNextPath } from "@/lib/portal/safe-path";
import { markSessionActive } from "@/lib/portal/session-expiry";
import { useAppRouter } from "@/lib/portal/use-app-router";
import type { AuthSession } from "@/types/auth";
import { LoginFields } from "./login-fields";

export function LoginForm() {
  const router = useAppRouter();
  const { showToast } = useToast();

  function finish(session: AuthSession) {
    markSessionActive();

    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );

    if (!next.startsWith("/launch/")) {
      queueToast(`Selamat datang, ${session.name.split(" ")[0]}`);
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="lp-form">
      <span className="brand lp-logo">
        <Image
          className="lp-logo-img"
          src={brandLogo}
          alt="Logo SSO Launcher"
          priority
        />
        <span className="lp-brand-text">
          <b>
            SSO<span>LAUNCHER</span>
          </b>
          <small>Portal akses aplikasi</small>
        </span>
      </span>

      <LoginFields onSignedIn={finish} />

      <p className="lp-help">
        Butuh bantuan? Hubungi{" "}
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            showToast("Hubungi Administrator Sistem untuk bantuan akun.");
          }}
        >
          Administrator Sistem
        </a>
      </p>
    </div>
  );
}
