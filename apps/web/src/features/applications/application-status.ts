import type {
  AdminApplication,
  ApplicationInput,
} from "@/features/applications/admin-api";

export type ApplicationStatus = "active" | "maintenance" | "inactive";

function keepsAddress(application: AdminApplication) {
  return (
    Boolean(application.appUrl) &&
    (!application.usesSso || application.callbackPath !== null)
  );
}

export function applicationWithStatus(
  application: AdminApplication,
  status: ApplicationStatus,
  maintenanceMessage = "",
): ApplicationInput {
  return {
    name: application.name,
    slug: application.slug,
    description: application.description,
    launchUrl: application.launchUrl,
    appUrl: keepsAddress(application) ? application.appUrl : "",
    callbackPath: application.callbackPath,
    category: application.category,
    icon: application.icon,
    color: application.color,
    status,
    maintenanceMessage: status === "maintenance" ? maintenanceMessage : "",
    usesSso: application.usesSso,
  };
}
