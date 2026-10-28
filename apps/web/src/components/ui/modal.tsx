"use client";

import type { ReactNode } from "react";

type ModalProps = Readonly<{
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}>;

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
