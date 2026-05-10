export type UserRole = "PUBLIC_USER" | "INVESTIGATOR" | "FORENSIC_ANALYST" | "COURT";

export const RESTRICTED_ROLES: UserRole[] = ["INVESTIGATOR", "FORENSIC_ANALYST", "COURT"];

export const ONBOARDING_CODES: Record<UserRole, string> = {
  PUBLIC_USER: "",
  INVESTIGATOR: "POLICE-2026",
  FORENSIC_ANALYST: "LAB-2026",
  COURT: "JUDGE-2026"
};

export const ROLE_INFO: Record<UserRole, { name: string; description: string; color: string }> = {
  PUBLIC_USER: { name: "Public User", description: "File FIRs and track cases", color: "#3b82f6" },
  INVESTIGATOR: { name: "Investigator", description: "Handle cases and collect evidence", color: "#8b5cf6" },
  FORENSIC_ANALYST: { name: "Forensic Analyst", description: "Analyze evidence", color: "#f59e0b" },
  COURT: { name: "Court", description: "Review cases and deliver judgments", color: "#ef4444" }
};