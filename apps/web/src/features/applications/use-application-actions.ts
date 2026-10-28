"use client";

import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  deleteApplication,
  updateApplication,
  type AdminApplication,
} from "@/features/applications/admin-api";
import {
  applicationWithStatus,
  type ApplicationStatus,
} from "@/features/applications/application-status";
import { statusActionLabel } from "@/lib/portal/action-icons";
import { statusLabel } from "@/lib/portal/options";

export type ApplicationBulkAction = ApplicationStatus | "delete";

type ApplicationActionsOptions = Readonly<{
  onChanged: () => void;
  onBulkDone: () => void;
}>;

const MAINTENANCE_PLACEHOLDER = "Misalnya: perbaikan server sampai pukul 15.00";

export function useApplicationActions({
  onChanged,
  onBulkDone,
}: ApplicationActionsOptions) {
  const { confirm, confirmWithReason } = useConfirm();
  const { showToast } = useToast();

  async function askBulk(action: ApplicationBulkAction, count: number) {
    if (action === "delete") {
      const reason = await confirmWithReason({
        title: `Hapus ${count} aplikasi?`,
        message:
          "Aplikasi terpilih akan dihapus dan tidak bisa dibuka lagi oleh siapa pun, termasuk lewat SSO.",
        confirmLabel: "Hapus",
        danger: true,
        action: "delete",
        reasonLabel: "Alasan penghapusan",
        reasonPlaceholder: "Masukkan alasan penghapusan",
      });

      return reason === null ? null : { reason, message: "" };
    }

    if (action === "maintenance") {
      const message = await confirmWithReason({
        title: `Alihkan ${count} aplikasi ke maintenance?`,
        message:
          "Aplikasi terpilih tetap tampil, tetapi tidak bisa dibuka selama maintenance.",
        confirmLabel: statusActionLabel(action),
        action: "maintenance",
        reasonLabel: "Pesan untuk pengguna",
        reasonPlaceholder: MAINTENANCE_PLACEHOLDER,
        reasonHint:
          "Pesan yang sama dipakai untuk semua aplikasi terpilih. Boleh dikosongkan.",
        reasonOptional: true,
      });

      return message === null ? null : { reason: "", message };
    }

    const approved = await confirm({
      title: `${statusActionLabel(action)} ${count} aplikasi?`,
      message:
        action === "active"
          ? "Aplikasi terpilih akan bisa dibuka kembali oleh pengguna."
          : "Aplikasi terpilih akan disembunyikan dari semua pengguna.",
      confirmLabel: statusActionLabel(action),
      danger: action === "inactive",
      action: action === "active" ? "activate" : "deactivate",
    });

    return approved ? { reason: "", message: "" } : null;
  }

  async function bulk(
    targets: readonly AdminApplication[],
    action: ApplicationBulkAction,
  ) {
    if (targets.length === 0) {
      return;
    }

    const count = targets.length;
    const answer = await askBulk(action, count);

    if (answer === null) {
      return;
    }

    let done = 0;

    for (const application of targets) {
      try {
        if (action === "delete") {
          await deleteApplication(application.id, answer.reason);
        } else {
          await updateApplication(
            application.id,
            applicationWithStatus(application, action, answer.message),
          );
        }

        done += 1;
      } catch {
        continue;
      }
    }

    onBulkDone();
    onChanged();

    if (done === count) {
      showToast(
        action === "delete"
          ? `${done} aplikasi dihapus`
          : `${done} aplikasi: ${statusLabel(action)}`,
      );

      return;
    }

    showToast(
      `${done} dari ${count} aplikasi diproses. Sisanya gagal.`,
      "warning",
    );
  }

  async function changeStatus(
    application: AdminApplication,
    next: ApplicationStatus,
  ) {
    let message = application.maintenanceMessage;

    if (next === "maintenance") {
      const answer = await confirmWithReason({
        title: "Alihkan ke maintenance?",
        message: `${application.name} tetap tampil, tetapi tidak bisa dibuka selama maintenance.`,
        confirmLabel: statusActionLabel(next),
        action: "maintenance",
        reasonLabel: "Pesan untuk pengguna",
        reasonPlaceholder: MAINTENANCE_PLACEHOLDER,
        reasonHint:
          "Pesan ini tampil saat pengguna mengarahkan kursor ke aplikasi. Boleh dikosongkan.",
        reasonOptional: true,
      });

      if (answer === null) {
        return;
      }

      message = answer;
    } else {
      const approved = await confirm({
        title: `${statusActionLabel(next)} aplikasi?`,
        message:
          next === "active"
            ? `${application.name} akan bisa dibuka kembali oleh pengguna.`
            : `${application.name} akan disembunyikan dari semua pengguna.`,
        confirmLabel: statusActionLabel(next),
        danger: next === "inactive",
        action: next === "active" ? "activate" : "deactivate",
      });

      if (!approved) {
        return;
      }

      message = "";
    }

    try {
      await updateApplication(
        application.id,
        applicationWithStatus(application, next, message),
      );
      onChanged();
      showToast(`${application.name}: ${statusLabel(next)}`);
    } catch {
      showToast("Status aplikasi gagal diperbarui.", "error");
    }
  }

  async function remove(application: AdminApplication) {
    const reason = await confirmWithReason({
      title: "Hapus aplikasi?",
      message: `${application.name} akan dihapus dan tidak bisa dibuka lagi oleh siapa pun, termasuk lewat SSO.`,
      confirmLabel: "Hapus",
      danger: true,
      action: "delete",
      reasonLabel: "Alasan penghapusan",
      reasonPlaceholder: "Masukkan alasan penghapusan",
    });

    if (reason === null) {
      return;
    }

    try {
      await deleteApplication(application.id, reason);
      onChanged();
      showToast(`${application.name} dihapus`);
    } catch {
      showToast("Aplikasi gagal dihapus.", "error");
    }
  }

  return { bulk, changeStatus, remove };
}
