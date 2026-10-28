"use client";

import Link from "next/link";
import { ArrowLeft, House, RotateCcw } from "lucide-react";
import { ErrorArt, type ErrorArtKind } from "@/components/portal/error-art";
import { Icon } from "@/components/ui/icon";
import styles from "./error-view.module.css";

type ErrorViewProps = Readonly<{
  code: string;
  label: string;
  title: string;
  description: string;
  kind: ErrorArtKind;
  standalone?: boolean;
  reference?: string;
  onRetry?: () => void;
  showBack?: boolean;
}>;

export function ErrorView({
  code,
  label,
  title,
  description,
  kind,
  standalone = false,
  reference,
  onRetry,
  showBack = false,
}: ErrorViewProps) {
  const panel = (
    <section
      className={`hero ${styles.panel} ${kind === "error" ? styles.danger : ""}`}
      aria-labelledby="error-title"
    >
      <div className={`hero-copy ${styles.copy}`}>
        <div className="eyebrow">
          <i className="rule" />
          {label}
        </div>

        <span className={styles.code} aria-hidden="true">
          {code}
        </span>

        <h1 id="error-title">{title}</h1>
        <p>{description}</p>

        {reference ? (
          <p className={styles.reference}>
            Kode referensi: <code>{reference}</code>
          </p>
        ) : null}

        <div className="hero-actions">
          {onRetry ? (
            <button className="btn" type="button" onClick={onRetry}>
              <Icon icon={RotateCcw} size={17} />
              Coba Lagi
            </button>
          ) : null}

          <Link className={onRetry ? "btn btn-ghost" : "btn"} href="/overview">
            <Icon icon={House} size={17} />
            Kembali ke Beranda
          </Link>

          {showBack ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => window.history.back()}
            >
              <Icon icon={ArrowLeft} size={17} />
              Halaman Sebelumnya
            </button>
          ) : null}
        </div>
      </div>

      <ErrorArt kind={kind} className={styles.art} />
    </section>
  );

  if (!standalone) {
    return <div className={styles.inline}>{panel}</div>;
  }

  return (
    <div className={styles.standalone}>
      <main className={styles.center}>{panel}</main>

      <p className={styles.footer}>
        SSO Launcher · Portal akses aplikasi
      </p>
    </div>
  );
}
