import { ExternalLink, ShieldCheck, Wrench } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { PortalApplication } from "@/types/portal";

export type AppState = "sso" | "link" | "maintenance";

export const APP_STATE_LABELS: Readonly<Record<AppState, string>> = {
  sso: "Masuk otomatis lewat SSO",
  link: "Tanpa SSO, login di aplikasinya sendiri",
  maintenance: "Sedang maintenance",
};

const APP_STATE_ICONS = {
  sso: ShieldCheck,
  link: ExternalLink,
  maintenance: Wrench,
} as const;

export function appState(
  application: Pick<PortalApplication, "status" | "usesSso">,
): AppState {
  if (application.status === "maintenance") {
    return "maintenance";
  }

  return application.usesSso ? "sso" : "link";
}

type AppStateDotProps = Readonly<{
  application: Pick<PortalApplication, "status" | "usesSso">;
}>;

export function AppStateDot({ application }: AppStateDotProps) {
  const state = appState(application);

  return (
    <>
      <span className={`app-dot ${state}`} aria-hidden="true">
        <Icon icon={APP_STATE_ICONS[state]} size={10} />
      </span>
      <span className="sr-only">{APP_STATE_LABELS[state]}</span>
    </>
  );
}
