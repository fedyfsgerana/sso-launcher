"use client";

import { useState, type SyntheticEvent } from "react";
import { useToast } from "@/components/portal/toast";
import { Spinner } from "@/components/ui/spinner";
import { login, loginRetryMinutes } from "@/features/auth/login";
import { requireEmail, requireText } from "@/lib/portal/validation";
import type { AuthSession } from "@/types/auth";

type LoginFieldsProps = Readonly<{
  onSignedIn: (session: AuthSession) => void;
}>;

export function LoginFields({ onSignedIn }: LoginFieldsProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const emailProblem = requireEmail(email);
    const passwordProblem = requireText(password);

    setEmailError(emailProblem);
    setPasswordError(passwordProblem);

    if (emailProblem || passwordProblem) {
      return;
    }

    setSubmitting(true);

    try {
      onSignedIn(await login({ email: email.trim(), password }));
    } catch (failure) {
      const retryMinutes = loginRetryMinutes(failure);

      showToast(
        retryMinutes === null
          ? "Email atau password salah. Silakan coba lagi."
          : `Terlalu banyak percobaan login. Coba lagi dalam ${retryMinutes} menit.`,
        "error",
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="lp-step" onSubmit={handleSubmit} autoComplete="on">
      <h1 className="lp-title">Selamat Datang</h1>
      <p className="lp-sub">Masuk dengan akun SSO Launcher Anda.</p>

      <label className="lp-label" htmlFor="email">
        Email
      </label>

      <div className={emailError ? "lp-input has-error" : "lp-input"}>
        <svg viewBox="0 0 24 24" fill="none">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Masukkan email"
          value={email}
          autoFocus
          aria-invalid={emailError ? true : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
          }}
        />
      </div>

      {emailError ? <p className="lp-msg">{emailError}</p> : null}

      <label className="lp-label" htmlFor="password">
        Password
      </label>

      <div className={passwordError ? "lp-input has-error" : "lp-input"}>
        <svg viewBox="0 0 24 24" fill="none">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Masukkan password"
          value={password}
          aria-invalid={passwordError ? true : undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(undefined);
          }}
        />
        <button
          type="button"
          className="lp-eye"
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
              <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
              <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
              <path d="m2 2 20 20" />
            </svg>
          )}
        </button>
      </div>

      {passwordError ? <p className="lp-msg">{passwordError}</p> : null}

      <div className="lp-row">
        <label className="lp-check">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span className="lp-box">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          Ingat saya
        </label>

        <a
          className="lp-forgot"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            showToast(
              "Hubungi Administrator Sistem untuk mengatur ulang password.",
            );
          }}
        >
          Lupa password?
        </a>
      </div>

      <button
        type="submit"
        className={submitting ? "lp-submit is-loading" : "lp-submit"}
        disabled={submitting}
      >
        {submitting ? "Memproses" : "Masuk"}
        {submitting ? (
          <Spinner size={16} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}
