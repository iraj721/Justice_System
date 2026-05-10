import type { UserRole } from "../../app/roleConfig";

export type DashboardContext = {
  route: string;
  email: string;
  role: UserRole;
  message: string;
};

export type FirRecord = {
  fir_id: string;
  status: string;
  incident_title: string;
  incident_location: string;
};

export type CaseRecord = {
  case_id: string;
  fir_id: string;
  title: string;
  description: string;
  status: string;
  suspects: Array<{ name: string; details: string }>;
  witnesses: Array<{ name: string; details: string }>;
};

export type EvidenceRecord = {
  evidence_id: string;
  case_id: string;
  title: string;
  ipfs_cid: string;
  hash: string;
  status: string;
};

export type ForensicReport = {
  report_id: string;
  case_id: string;
  evidence_id: string;
  report_hash: string;
  status: string;
};

export type JudgmentRecord = {
  judgment_id: string;
  case_id: string;
  judgment_hash: string;
};

export type FirCreateInput = {
  incident_title: string;
  incident_description: string;
  incident_location: string;
  incident_datetime: string;
  complainant_contact: string;
  accused_details?: string;
  witness_details?: string;
};
