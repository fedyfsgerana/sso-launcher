"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { logout } from "@/features/auth/logout";
import { queueToast } from "@/lib/portal/pending-toast";
import styles from "./logout.module.css";

export default function SignOutPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    logout()
      .catch(() => undefined)
      .finally(() => {
        queueToast("Anda telah keluar dari SSO Launcher");
        window.location.replace("/login");
      });
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.card} role="status">
        <Spinner size={22} />
        <b>Sedang keluar</b>
        <p>SSO Launcher sedang mengakhiri sesi Anda di perangkat ini.</p>
      </div>
    </main>
  );
}
