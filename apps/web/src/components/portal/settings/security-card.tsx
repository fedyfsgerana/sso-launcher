import { Clock, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SettingsCard } from "@/components/portal/settings/settings-card";
import { BlockSkeleton } from "@/components/portal/skeleton";
import { Icon } from "@/components/ui/icon";
import type { SecurityPolicy } from "@/features/account/api";
import styles from "./settings.module.css";

type SecurityCardProps = Readonly<{
  policy: SecurityPolicy | null;
}>;

type Fact = Readonly<{
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  value: string;
}>;

function securityFacts(policy: SecurityPolicy): Fact[] {
  return [
    {
      icon: Clock,
      tone: "app-as",
      title: "Sesi tidak aktif",
      description: "Otomatis keluar bila tidak ada aktivitas.",
      value: `${policy.idleMinutes} menit`,
    },
    {
      icon: ShieldCheck,
      tone: "app-nv",
      title: "Batas sesi",
      description: "Harus login ulang setelah batas waktu ini.",
      value: `${policy.sessionHours} jam`,
    },
    {
      icon: LockKeyhole,
      tone: "app-nv",
      title: "Kunci login",
      description: `Dikunci setelah ${policy.maxFailuresPerAddress} kali password salah.`,
      value: `${policy.lockoutMinutes} menit`,
    },
    {
      icon: KeyRound,
      tone: "app-pr",
      title: "Syarat password",
      description: policy.passwordRequiresMixedCharacters
        ? "Memuat huruf besar, huruf kecil, angka, dan simbol."
        : "Panjang minimal password.",
      value: `min. ${policy.passwordMinimumLength} karakter`,
    },
  ];
}

export function SecurityCard({ policy }: SecurityCardProps) {
  return (
    <SettingsCard
      className={styles.full}
      tone="app-nv"
      title="Informasi Keamanan"
      icon={ShieldCheck}
      subtitle="Aturan yang berlaku untuk semua akun SSO Launcher"
    >
      {policy === null ? (
        <BlockSkeleton lines={4} />
      ) : (
        <div className={styles.facts}>
          {securityFacts(policy).map((fact) => (
            <div key={fact.title} className={styles.fact}>
              <span className={`rc-ic sm ${fact.tone}`}>
                <Icon icon={fact.icon} size={17} />
              </span>
              <div className={styles.factText}>
                <b>{fact.title}</b>
                <small>{fact.description}</small>
              </div>
              <span className="tag">{fact.value}</span>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}
