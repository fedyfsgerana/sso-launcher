"use client";

import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { deleteUser, updateUser, type PortalUser } from "@/features/users/api";
import { ApiError } from "@/lib/api/client";

export type UserBulkAction = "activate" | "deactivate" | "delete";

type UserActionsOptions = Readonly<{
  onChanged: () => void;
  onBulkDone: () => void;
  onRemoved: (userId: string) => void;
}>;

const DELETE_EFFECT =
  "Akunnya langsung dinonaktifkan, seluruh sesinya dicabut, dan aksesnya ke semua aplikasi berakhir.";

function deleteErrorMessage(error: unknown, name: string) {
  if (error instanceof ApiError && error.status === 409) {
    return "Akun yang sedang Anda pakai tidak bisa dihapus.";
  }

  if (error instanceof ApiError && error.status === 404) {
    return `${name} sudah tidak ada.`;
  }

  return `${name} gagal dihapus. Silakan coba lagi.`;
}

function setActive(user: PortalUser, isActive: boolean) {
  return updateUser(user.id, {
    name: user.name,
    email: user.email,
    employeeNumber: user.employeeNumber,
    department: user.department,
    jobTitle: user.jobTitle,
    isActive,
  })
    .then(() => true)
    .catch(() => false);
}

export function useUserActions({
  onChanged,
  onBulkDone,
  onRemoved,
}: UserActionsOptions) {
  const { confirm, confirmWithReason } = useConfirm();
  const { showToast } = useToast();

  async function toggleActive(user: PortalUser) {
    const approved = await confirm({
      title: user.isActive ? "Nonaktifkan pengguna?" : "Aktifkan pengguna?",
      message: user.isActive
        ? `${user.name} tidak akan bisa masuk sampai diaktifkan kembali.`
        : `${user.name} akan bisa masuk kembali ke SSO Launcher.`,
      confirmLabel: user.isActive ? "Nonaktifkan" : "Aktifkan",
      danger: user.isActive,
      action: user.isActive ? "deactivate" : "activate",
    });

    if (!approved) {
      return;
    }

    const saved = await setActive(user, !user.isActive);

    onChanged();

    if (!saved) {
      showToast(`Status ${user.name} gagal diperbarui.`, "error");
      return;
    }

    showToast(`${user.name} ${user.isActive ? "dinonaktifkan" : "diaktifkan"}`);
  }

  async function remove(user: PortalUser) {
    const reason = await confirmWithReason({
      title: "Hapus pengguna?",
      message: `${user.name} (${user.employeeNumber ?? user.email}) akan dihapus. ${DELETE_EFFECT}`,
      confirmLabel: "Hapus",
      danger: true,
      action: "delete",
      reasonLabel: "Alasan penghapusan",
      reasonPlaceholder: "Masukkan alasan penghapusan",
    });

    if (reason === null) {
      return;
    }

    const deleted = await deleteUser(user.id, reason)
      .then(() => true)
      .catch((error: unknown) => {
        showToast(deleteErrorMessage(error, user.name), "error");

        return false;
      });

    onRemoved(user.id);
    onChanged();

    if (deleted) {
      showToast(`${user.name} dihapus`);
    }
  }

  async function askBulk(action: UserBulkAction, count: number) {
    if (action === "delete") {
      return confirmWithReason({
        title: `Hapus ${count} pengguna?`,
        message: `Pengguna terpilih akan dihapus. ${DELETE_EFFECT}`,
        confirmLabel: "Hapus",
        danger: true,
        action: "delete",
        reasonLabel: "Alasan penghapusan",
        reasonPlaceholder: "Masukkan alasan penghapusan",
      });
    }

    const approved = await confirm({
      title: `${action === "activate" ? "Aktifkan" : "Nonaktifkan"} ${count} pengguna?`,
      message:
        action === "activate"
          ? "Pengguna terpilih akan bisa masuk kembali."
          : "Pengguna terpilih tidak akan bisa masuk sampai diaktifkan kembali.",
      confirmLabel: action === "activate" ? "Aktifkan" : "Nonaktifkan",
      danger: action !== "activate",
      action,
    });

    return approved ? "" : null;
  }

  async function bulk(targets: readonly PortalUser[], action: UserBulkAction) {
    if (targets.length === 0) {
      return;
    }

    const count = targets.length;
    const reason = await askBulk(action, count);

    if (reason === null) {
      return;
    }

    let done = 0;

    for (const user of targets) {
      const succeeded =
        action === "delete"
          ? await deleteUser(user.id, reason)
              .then(() => true)
              .catch(() => false)
          : await setActive(user, action === "activate");

      if (succeeded) {
        done += 1;
      }
    }

    onBulkDone();
    onChanged();

    const verb =
      action === "delete"
        ? "dihapus"
        : action === "activate"
          ? "diaktifkan"
          : "dinonaktifkan";

    if (done === count) {
      showToast(`${done} pengguna ${verb}`);
      return;
    }

    showToast(
      action === "delete"
        ? `${done} dari ${count} pengguna dihapus. Sisanya gagal, termasuk akun yang sedang Anda pakai.`
        : `${done} dari ${count} pengguna ${verb}. Sisanya gagal.`,
      "warning",
    );
  }

  return { toggleActive, remove, bulk };
}
