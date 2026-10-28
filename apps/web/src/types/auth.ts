export type AuthUser = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  departemenCode: string | null;
  jobTitle: string | null;
};

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  department: string | null;
  departemenCode: string | null;
  jobTitle: string | null;
  expiresAt: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};
