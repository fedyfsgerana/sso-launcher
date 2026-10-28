"use client";

import { useState, type SyntheticEvent } from "react";
import {
  AtSign,
  Briefcase,
  Building2,
  KeyRound,
  UserRound,
} from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { PasswordChecklist } from "@/components/ui/password-checklist";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHero } from "@/components/portal/page-hero";
import { FieldsSkeleton, HeroSkeleton } from "@/components/portal/skeleton";
import { useToast } from "@/components/portal/toast";
import { Field } from "@/components/ui/field";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/status-badge";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { changePassword } from "@/features/auth/change-password";
import { ActivateIcon } from "@/lib/portal/action-icons";
import { departmentLabel, initials, userRoleTag } from "@/lib/portal/format";
import { passwordError } from "@/lib/portal/password-rules";
import { requireText } from "@/lib/portal/validation";
import { useFieldErrors } from "@/lib/portal/use-field-errors";
import styles from "./profile.module.css";
import { avatarColorClass } from "@/lib/portal/palette";

export default function ProfilePage() {
  const { user } = useAuthSession();
  const avatarClass = avatarColorClass(user?.name ?? "");
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const { errors, errorSummary, checkField, clearField, checkAll } =
    useFieldErrors({ current, next, repeat }, (value) => ({
      current: requireText(value.current),
      next: passwordError(value.next),
      repeat:
        value.repeat === value.next
          ? requireText(value.repeat)
          : "Konfirmasi password belum sama",
    }));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors = checkAll();

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const approved = await confirm({
      title: "Ubah password?",
      message:
        "Password baru langsung berlaku. Anda tetap masuk di perangkat ini, sedangkan sesi di perangkat lain akan dikeluarkan. Perubahan ini tercatat di riwayat aktivitas.",
      confirmLabel: "Ya, Ubah",
      icon: KeyRound,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
      });

      setCurrent("");
      setNext("");
      setRepeat("");
      showToast(
        "Password berhasil diubah. Sesi di perangkat lain sudah dikeluarkan.",
      );
    } catch {
      showToast("Password lama salah atau belum memenuhi syarat.");
    } finally {
      setSaving(false);
    }
  }

  const details = [
    { label: "Email", value: user?.email, icon: AtSign, tone: "app-hr" },
    {
      label: "Departemen",
      value:
        user && (user.department || user.departemenCode)
          ? departmentLabel(user.department, user.departemenCode)
          : null,
      icon: Building2,
      tone: "app-wh",
    },
    {
      label: "Jabatan",
      value: user?.jobTitle,
      icon: Briefcase,
      tone: "app-br",
    },
  ];

  if (!user) {
    return (
      <div className="page">
        <HeroSkeleton />

        <div className="card">
          <FieldsSkeleton fields={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHero
        title="Profil Saya"
        description="Lihat data akun Anda dan ubah password secara berkala."
      />

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={`card ${styles.card}`}>
            <header className={styles.head}>
              <i className="ch-ic">
                <Icon icon={UserRound} size={18} />
              </i>
              <div>
                <h3>Data Akun</h3>
                <small>Identitas Anda di SSO Launcher</small>
              </div>
            </header>

            <div className={styles.body}>
              <div className={styles.profileHead}>
                <span className={`av ${styles.avatar} ${avatarClass}`}>
                  {user ? initials(user.name) : "--"}
                </span>
                <div>
                  <b>{user?.name ?? "Memuat"}</b>
                  <small>{userRoleTag(user) || user?.email}</small>
                  <div className={styles.badges}>
                    <Badge tone="on" icon={ActivateIcon}>
                      Akun aktif
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={styles.tiles}>
                {details.map((item) => (
                  <div className={styles.tile} key={item.label}>
                    <span className={`rc-ic sm ${item.tone}`}>
                      <Icon icon={item.icon} size={17} />
                    </span>
                    <div>
                      <small>{item.label}</small>
                      <b className={item.value ? undefined : styles.empty}>
                        {item.value || "Belum diisi"}
                      </b>
                    </div>
                  </div>
                ))}
              </div>

              <p className={`note-box ${styles.note}`}>
                <span>
                  Data ini dikelola oleh Administrator Sistem. Hubungi admin
                  kalau ada yang perlu diubah.
                </span>
              </p>
            </div>
          </section>
        </div>

        <section className={`card ${styles.card}`}>
          <header className={styles.head}>
            <i className="ch-ic ic-warn">
              <Icon icon={KeyRound} size={18} />
            </i>
            <div>
              <h3>Ubah Password</h3>
              <small>
                Ganti password secara berkala untuk menjaga keamanan akun
              </small>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className={`${styles.body} ${styles.form}`}>
              <FormErrorSummary count={errorSummary} />

              <Field
                label="Password Lama"
                error={errors.current}
                hint="Password yang Anda pakai untuk masuk saat ini."
              >
                <PasswordInput
                  value={current}
                  autoComplete="current-password"
                  placeholder="Masukkan password saat ini"
                  invalid={Boolean(errors.current)}
                  onChange={(value) => {
                    setCurrent(value);
                    clearField("current");
                  }}
                  onBlur={() => checkField("current")}
                />
              </Field>

              <Field label="Password Baru" error={errors.next}>
                <PasswordInput
                  value={next}
                  autoComplete="new-password"
                  placeholder="Masukkan password baru"
                  invalid={Boolean(errors.next)}
                  onChange={(value) => {
                    setNext(value);
                    clearField("next");
                  }}
                  onBlur={() => checkField("next")}
                />
                <PasswordChecklist value={next} />
              </Field>

              <Field
                label="Ulangi Password Baru"
                error={errors.repeat}
                hint="Ketik ulang persis sama dengan password baru."
              >
                <PasswordInput
                  value={repeat}
                  autoComplete="new-password"
                  placeholder="Masukkan ulang password baru"
                  invalid={Boolean(errors.repeat)}
                  onChange={(value) => {
                    setRepeat(value);
                    clearField("repeat");
                  }}
                  onBlur={() => checkField("repeat")}
                />
              </Field>

              <p className="note-box warn">
                <span>
                  <b>Perangkat lain akan dikeluarkan</b>
                  Setelah password diubah, Anda tetap masuk di perangkat ini,
                  tapi perangkat lain harus login ulang.
                </span>
              </p>

              <div className={styles.actions}>
                <button
                  className={
                    saving ? "btn tone-warn is-loading" : "btn tone-warn"
                  }
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Menyimpan" : "Ubah Password"}
                  {saving ? (
                    <Spinner size={16} />
                  ) : (
                    <Icon icon={KeyRound} size={18} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
