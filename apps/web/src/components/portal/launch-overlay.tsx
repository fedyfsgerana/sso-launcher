"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STEP_MS = 830;

export type LaunchTarget = Readonly<{
  name: string;
  usesSso: boolean;
}>;

type LaunchOverlayProps = Readonly<{
  launch: LaunchTarget | null;
}>;

function directStages(name: string) {
  return [
    {
      eyebrow: "Tahap 1 · Periksa akses",
      title: `Memeriksa akses ke ${name}`,
      sub: "SSO Launcher memastikan akun Anda aktif dan berhak membuka aplikasi ini.",
      code: "GET /api/sso/launch → memeriksa sesi dan akses grup",
    },
    {
      eyebrow: "Tahap 2 · Tanpa SSO",
      title: `${name} tidak memakai SSO`,
      sub: "Tidak ada token yang dikirim. Aplikasi ini memakai login miliknya sendiri.",
      code: "sso: tidak dipakai",
    },
    {
      eyebrow: "Tahap 3 · Buka aplikasi",
      title: `Membuka ${name} di tab baru`,
      sub: "Jika diminta, masuk dengan akun yang terdaftar di aplikasi tersebut.",
      code: "tab baru → halaman aplikasi",
    },
  ];
}

function ssoStages(name: string) {
  return [
    {
      eyebrow: "Tahap 1 · Periksa akses",
      title: `Memeriksa akses ke ${name}`,
      sub: "SSO Launcher memastikan akun Anda aktif dan berhak membuka aplikasi ini.",
      code: "GET /api/sso/launch → memeriksa sesi dan akses grup",
    },
    {
      eyebrow: "Tahap 2 · Terbitkan token",
      title: `Menyiapkan token untuk ${name}`,
      sub: "Token dibuat khusus untuk aplikasi ini, berlaku 60 detik dan hanya sekali pakai.",
      code: "token: { berlaku 60 detik, sekali pakai }",
    },
    {
      eyebrow: "Tahap 3 · Kirim token",
      title: `Mengirim token ke ${name}`,
      sub: "Aplikasi memvalidasi token ke SSO Launcher dari sisi server, tanpa perlu login ulang.",
      code: "POST /api/sso/validate → identitas pengguna",
    },
  ];
}

type StageText = Readonly<{
  eyebrow: string;
  title: string;
  sub: string;
  code: string;
}>;

function returnStages(): StageText[] {
  return [
    {
      eyebrow: "Tahap 1 · Keluar dari aplikasi",
      title: "Mengakhiri sesi aplikasi",
      sub: "Sesi di aplikasi sudah ditutup. SSO Launcher mencatat bahwa Anda keluar.",
      code: "POST /api/sso/sign-out → catat keluar",
    },
    {
      eyebrow: "Tahap 2 · Periksa sesi portal",
      title: "Memeriksa sesi SSO Launcher",
      sub: "Sesi portal Anda tetap aktif, jadi Anda tidak perlu login ulang.",
      code: "sesi portal: aktif",
    },
    {
      eyebrow: "Tahap 3 · Kembali",
      title: "Kembali ke Beranda SSO Launcher",
      sub: "Aplikasi lain tetap bisa dibuka dari portal tanpa login ulang.",
      code: "→ Beranda",
    },
  ];
}

function Stage({ launch }: Readonly<{ launch: LaunchTarget }>) {
  const steps = launch.usesSso
    ? ssoStages(launch.name)
    : directStages(launch.name);

  return <Stages steps={steps} />;
}

function Stages({ steps }: Readonly<{ steps: StageText[] }>) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [1, 2].map((index) =>
      window.setTimeout(() => setStep(index), index * STEP_MS),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const stage = steps[Math.min(step, steps.length - 1)];

  return (
    <>
      <small>{stage.eyebrow}</small>
      <h3>{stage.title}</h3>
      <p>{stage.sub}</p>
      <code>{stage.code}</code>
    </>
  );
}

export function LaunchOverlay({ launch }: LaunchOverlayProps) {
  if (!launch || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="launch show">
      <div className="launch-card">
        <div className="spin" />
        <Stage key={`${launch.name}:${launch.usesSso}`} launch={launch} />
      </div>
    </div>,
    document.body,
  );
}

export function ReturnOverlay() {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="launch show">
      <div className="launch-card">
        <div className="spin" />
        <Stages steps={returnStages()} />
      </div>
    </div>,
    document.body,
  );
}
