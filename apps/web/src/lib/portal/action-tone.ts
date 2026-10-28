export type ActionTone = "primary" | "success" | "info" | "warn" | "danger";

const TONES: Readonly<Record<string, ActionTone>> = {
  create: "primary",
  update: "primary",
  delete: "danger",
  duplicate: "success",
  manage_members: "info",
  manage_access: "info",
  manage_credentials: "info",
  reset_password: "warn",
  revoke_sessions: "danger",
  reorder: "info",
  maintenance: "warn",
  export: "success",
  restore: "success",
  rollback: "warn",
};

export function actionTone(actionKey: string): ActionTone {
  return TONES[actionKey] ?? "info";
}
