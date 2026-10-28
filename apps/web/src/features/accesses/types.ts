export type ApplicationAccess = {
  id: string;
  userId: string;
  userFullName: string;
  email: string;
  applicationId: string;
  applicationName: string;
  applicationSlug: string;
  canLaunch: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertAccessResult = {
  id: string;
};
