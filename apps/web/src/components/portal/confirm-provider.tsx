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
import {
  CircleCheck,
  CircleX,
  Copy,
  History,
  Key,
  KeyRound,
  LockOpen,
  LogOut,
  RotateCcw,
  Star,
  StarOff,
  Trash2,
  Undo2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import styles from "./confirm-provider.module.css";
import {
  ActivateIcon,
  DeactivateIcon,
  MaintenanceIcon,
} from "@/lib/portal/action-icons";
import type { ActionTone } from "@/lib/portal/action-tone";

export type ConfirmAction =
  | "delete"
  | "activate"
  | "deactivate"
  | "maintenance";

const ACTION_ICONS: Record<ConfirmAction, LucideIcon> = {
  delete: Trash2,
  activate: ActivateIcon,
  deactivate: DeactivateIcon,
  maintenance: MaintenanceIcon,
};

const ACTION_TONES: Record<ConfirmAction, ActionTone> = {
  delete: "danger",
  activate: "success",
  deactivate: "danger",
  maintenance: "warn",
};

const ICON_TONES = new Map<LucideIcon, ActionTone>([
  [Trash2, "danger"],
  [DeactivateIcon, "danger"],
  [MaintenanceIcon, "warn"],
  [KeyRound, "warn"],
  [Key, "info"],
  [Users, "info"],
  [LogOut, "danger"],
  [LockOpen, "primary"],
  [History, "info"],
  [Undo2, "warn"],
  [RotateCcw, "success"],
  [Copy, "success"],
  [Star, "warn"],
  [StarOff, "warn"],
]);

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: LucideIcon;
  action?: ConfirmAction;
  tone?: ActionTone;
};

export type ReasonOptions = ConfirmOptions & {
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonHint?: string;
  reasonOptional?: boolean;
};

type ConfirmState = ReasonOptions & {
  withReason: boolean;
  resolve: (value: string | null) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmWithReason: (options: ReasonOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const CONFIRM_ICONS = {
  star: Star,
  starOff: StarOff,
  trash: Trash2,
  check: CircleCheck,
};

type ConfirmProviderProps = Readonly<{
  children: ReactNode;
}>;

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [reason, setReason] = useState("");
  const okRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setReason("");
        setState({
          ...options,
          withReason: false,
          resolve: (value) => resolve(value !== null),
        });
      }),
    [],
  );

  const confirmWithReason = useCallback(
    (options: ReasonOptions) =>
      new Promise<string | null>((resolve) => {
        setReason("");
        setState({ ...options, withReason: true, resolve });
      }),
    [],
  );

  const close = useCallback(
    (approved: boolean) => {
      state?.resolve(approved ? reason.trim() : null);
      setState(null);
    },
    [state, reason],
  );

  const reasonMissing =
    Boolean(state?.withReason) &&
    !state?.reasonOptional &&
    reason.trim() === "";

  useEffect(() => {
    if (!state) {
      return;
    }

    document.body.classList.add("has-ask");

    if (state.withReason) {
      reasonRef.current?.focus();
    } else {
      okRef.current?.focus();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(false);
      }
    }

    document.addEventListener("keydown", handleKey, true);

    return () => {
      document.body.classList.remove("has-ask");
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={{ confirm, confirmWithReason }}>
      {children}

      {state ? (
        <div
          className="modal ask show"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="askTitle"
          aria-describedby="askMsg"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close(false);
            }
          }}
        >
          <div
            className={[
              "modal-card ask-card",
              state.danger ? "is-danger" : "",
              `tone-${resolveTone(state)}`,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              className="icon-btn ask-close"
              type="button"
              aria-label="Tutup"
              onClick={() => close(false)}
            >
              <Icon icon={X} size={18} />
            </button>

            <div className="ask-ic">
              <Icon icon={resolveIcon(state, CircleCheck)} size={24} />
            </div>

            <h3 id="askTitle">{state.title}</h3>
            <p id="askMsg">{state.message ?? ""}</p>

            {state.withReason ? (
              <label className={styles.reason}>
                <span>{state.reasonLabel ?? "Alasan"}</span>
                <textarea
                  ref={reasonRef}
                  value={reason}
                  maxLength={500}
                  placeholder={state.reasonPlaceholder ?? "Masukkan alasan"}
                  onChange={(event) => setReason(event.target.value)}
                />
                <em>
                  {state.reasonHint ??
                    "Wajib diisi. Alasan tersimpan di riwayat aktivitas."}
                </em>
              </label>
            ) : null}

            <div className="ask-btns">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => close(false)}
              >
                {state.cancelLabel ?? "Batal"}
                <Icon icon={CircleX} size={18} />
              </button>

              <button
                ref={okRef}
                className={`btn ask-ok tone-${resolveTone(state)}`}
                type="button"
                disabled={reasonMissing}
                onClick={() => close(true)}
              >
                {state.confirmLabel ?? "Ya, Lanjutkan"}
                <Icon icon={resolveIcon(state, CircleCheck)} size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

function resolveIcon(state: ConfirmOptions, fallback: LucideIcon): LucideIcon {
  if (state.icon) {
    return state.icon;
  }

  if (state.action) {
    return ACTION_ICONS[state.action];
  }

  return state.danger ? Trash2 : fallback;
}

function resolveTone(state: ConfirmOptions): ActionTone {
  if (state.tone) {
    return state.tone;
  }

  if (state.icon && ICON_TONES.has(state.icon)) {
    return ICON_TONES.get(state.icon) ?? "primary";
  }

  if (state.action) {
    return ACTION_TONES[state.action];
  }

  return state.danger ? "danger" : "primary";
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    return {
      confirm: async () => true,
      confirmWithReason: async () => null,
    };
  }

  return context;
}
