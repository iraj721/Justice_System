import type { UserRole } from "./roleConfig";

export type AppRoute = {
  path: string;
  protected: boolean;
  allowedRoles?: UserRole[];
};

export const appRoutes: AppRoute[] = [
  { path: "/", protected: false },
  { path: "/login", protected: false },
  { path: "/register", protected: false },
  {
    path: "/app",
    protected: true,
    allowedRoles: ["PUBLIC_USER", "INVESTIGATOR", "FORENSIC_ANALYST", "COURT", "PUBLIC_AUDITOR"],
  },
];
