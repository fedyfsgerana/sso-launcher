export type MenuTargetType = "page" | "custom" | "url" | "section";

export type PortalMenuItem = {
  id: string;
  parentId: string | null;
  label: string;
  icon: string;
  targetType: MenuTargetType;
  targetValue: string;
  sortOrder: number;
  maintenanceActive: boolean;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  actions: string[];
};

export type ApplicationStatus = "active" | "maintenance" | "inactive";

export type PortalApplication = {
  id: string;
  name: string;
  slug: string;
  description: string;
  launchUrl: string;
  category: string;
  icon: string;
  color: string;
  status: ApplicationStatus;
  maintenanceMessage: string;
  usesSso: boolean;
  isFavorite: boolean;
  lastOpenedAt: string | null;
};

export type ActivityKind = "application";

export type PortalActivity = {
  id: string;
  kind: ActivityKind;
  applicationId: string | null;
  title: string;
  subtitle: string;
  targetPath: string | null;
  occurredAt: string;
};
