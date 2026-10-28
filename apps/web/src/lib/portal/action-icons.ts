import { Ban, CircleCheck, Wrench, type LucideIcon } from "lucide-react";

export const ActivateIcon: LucideIcon = CircleCheck;
export const DeactivateIcon: LucideIcon = Ban;
export const MaintenanceIcon: LucideIcon = Wrench;

export function activeActionIcon(isActive: boolean): LucideIcon {
  return isActive ? DeactivateIcon : ActivateIcon;
}

export function activeActionLabel(isActive: boolean): string {
  return isActive ? "Nonaktifkan" : "Aktifkan";
}

export function statusActionIcon(status: string): LucideIcon {
  if (status === "active") {
    return ActivateIcon;
  }

  if (status === "maintenance") {
    return MaintenanceIcon;
  }

  return DeactivateIcon;
}

export function statusActionLabel(status: string): string {
  if (status === "active") {
    return "Aktifkan";
  }

  if (status === "maintenance") {
    return "Set Maintenance";
  }

  return "Nonaktifkan";
}

export function statusActionTone(
  status: string,
): "success" | "warn" | "danger" {
  if (status === "active") {
    return "success";
  }

  return status === "maintenance" ? "warn" : "danger";
}
