export type ApplicationStatus = "active" | "inactive";

export type PortalApplication = {
  id: string;
  name: string;
  description: string;
  launchUrl: string;
  icon: string;
  status: ApplicationStatus;
  isFavorite: boolean;
  lastOpenedAt: string | null;
};
