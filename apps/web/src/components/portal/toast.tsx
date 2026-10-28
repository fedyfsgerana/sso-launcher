"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { takeServerErrorReference } from "@/lib/portal/server-error-reference";
import styles from "./toast.module.css";

const DURATION = 4000;
const REFERENCE_DURATION = 8000;
const RESUME_DURATION = 2000;

export type ToastTone = "success" | "error" | "warning";

const TONE_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
} as const;

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = Readonly<{
  children: ReactNode;
}>;

export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<ToastTone>("success");
  const [reference, setReference] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(id);
  }, []);

  const stopTimer = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration: number) => {
      stopTimer();
      timer.current = window.setTimeout(() => setVisible(false), duration);
    },
    [stopTimer],
  );

  const close = useCallback(() => {
    stopTimer();
    setVisible(false);
  }, [stopTimer]);

  const showToast = useCallback(
    (value: string, nextTone: ToastTone = "success") => {
      const nextReference =
        nextTone === "error" ? takeServerErrorReference() : null;

      setMessage(value);
      setTone(nextTone);
      setReference(nextReference);
      setVisible(true);
      startTimer(nextReference ? REFERENCE_DURATION : DURATION);
    },
    [startTimer],
  );

  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {mounted
        ? createPortal(
            <div
              className={
                visible
                  ? `toast is-${tone} show ${styles.interactive}`
                  : `toast is-${tone}`
              }
              role="status"
              aria-hidden={!visible}
              onMouseEnter={stopTimer}
              onMouseLeave={() => {
                if (visible) {
                  startTimer(RESUME_DURATION);
                }
              }}
              style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 2147483000,
              }}
            >
              <Icon icon={TONE_ICONS[tone]} size={18} />
              <span className={styles.message}>
                {message}
                {reference ? (
                  <small className={styles.reference}>
                    Nomor referensi: <b>{reference}</b>
                  </small>
                ) : null}
              </span>
              <button
                className={styles.close}
                type="button"
                aria-label="Tutup notifikasi"
                tabIndex={visible ? 0 : -1}
                onClick={close}
              >
                <Icon icon={X} size={15} />
              </button>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return { showToast: () => undefined };
  }

  return context;
}
