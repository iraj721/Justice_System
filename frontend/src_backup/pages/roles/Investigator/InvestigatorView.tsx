// frontend/src/pages/roles/Investigator/InvestigatorView.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../shared/env";
import { uploadFileToIPFS } from "../../../shared/services/ipfs";
import { TaskManager } from "./components/TaskManager";
import { StatsDashboard } from "./components/StatsDashboard";
import { CommunicationPanel } from "./components/CommunicationPanel";
import { AdvancedSearchPanel } from "./components/AdvancedSearchPanel";
import { CourtPackage } from "./components/CourtPackage";

type Props = {
  token: string;
  allFirs: any[];
  cases: any[];
  evidence: any[];
  onRefresh: () => void;
};

type PendingFIR = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  incident_description: string;
  incident_location: string;
  complainant_name: string;
  complainant_contact: string;
  complainant_address?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  case_id?: string;
  case_number?: string;
  assigned_investigator?: string;
};

type FIRStatusResponse = {
  message: string;
  fir_id: string;
  status: string;
  case?: {
    case_id: string;
    case_number: string;
  };
};

type VerificationResult = {
  verified: boolean;
  message: string;
  stored_hash?: string;
  provided_hash?: string;
  verification_time?: string;
  evidence_title?: string;
  uploaded_file_name?: string;
  stored_cid?: string;
};

type EvidenceResponse = {
  evidence_id: string;
  hash: string;
  ipfs_cid: string;
  title: string;
  case_id: string;
  status: string;
  created_at: string;
  message: string;
};

type CaseEvidence = {
  evidence_id: string;
  title: string;
  hash: string;
  ipfs_cid: string;
  status: string;
  created_at: string;
};

type FIRDetail = {
  fir_id: string;
  fir_number: string;
  complainant_name: string;
  complainant_contact: string;
  complainant_address: string;
  complainant_email: string;
  incident_title: string;
  incident_description: string;
  incident_location: string;
  incident_datetime: string;
  accused_person: string;
  accused_description: string;
  witness_names: string;
  witness_contact: string;
  status: string;
  status_history: any[];
  created_at: string;
  case_id?: string;
  case_number?: string;
};

type InvestigationReport = {
  report_id: string;
  generated_at: string;
  generated_by: string;
  case_details: any;
  fir_details: any;
  suspects: any[];
  witnesses: any[];
  evidence: any[];
  timeline: any[];
  evidence_verification_status: any;
  status_summary: any;
};

type User = {
  email: string;
  full_name: string;
  user_id: string;
};

export function InvestigatorView({
  token,
  allFirs,
  cases,
  evidence,
  onRefresh,
}: Props) {
  const [pendingFirs, setPendingFirs] = useState<PendingFIR[]>([]);
  const [acceptedFirs, setAcceptedFirs] = useState<PendingFIR[]>([]);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const [newFirNotification, setNewFirNotification] = useState<string | null>(
    null,
  );
  const [caseFirId, setCaseFirId] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [suspectName, setSuspectName] = useState("");
  const [suspectDetails, setSuspectDetails] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessDetails, setWitnessDetails] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCaseForVerify, setSelectedCaseForVerify] = useState<any>(null);
  const [caseEvidenceList, setCaseEvidenceList] = useState<CaseEvidence[]>([]);
  const [selectedEvidenceForVerify, setSelectedEvidenceForVerify] =
    useState<CaseEvidence | null>(null);
  const [verifyHashInput, setVerifyHashInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(
    null,
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [selectedFileForVerify, setSelectedFileForVerify] =
    useState<File | null>(null);
  const [isUploadingForVerify, setIsUploadingForVerify] = useState(false);

  // NEW: State for FIR Details, Reports, and Transfer
  const [selectedFirDetails, setSelectedFirDetails] =
    useState<FIRDetail | null>(null);
  const [investigationReport, setInvestigationReport] =
    useState<InvestigationReport | null>(null);
  const [courtUsers, setCourtUsers] = useState<User[]>([]);
  const [forensicUsers, setForensicUsers] = useState<User[]>([]);
  const [selectedCourtEmail, setSelectedCourtEmail] = useState("");
  const [selectedForensicEmail, setSelectedForensicEmail] = useState("");
  const [selectedEvidenceForTransfer, setSelectedEvidenceForTransfer] =
    useState<any>(null);

  useEffect(() => {
    loadPendingFirs();
    loadAcceptedFirs();
  }, []);

  useEffect(() => {
    if (pendingFirs.length > previousPendingCount && previousPendingCount > 0) {
      const newCount = pendingFirs.length - previousPendingCount;
      setNewFirNotification(`🔔 ${newCount} new FIR(s) received!`);
      setMessage(
        `🔔 ${newCount} new FIR(s) received! Please check Pending FIRs tab.`,
      );
      setTimeout(() => {
        setNewFirNotification(null);
        setTimeout(() => setMessage(""), 8000);
      }, 8000);
    }
    setPreviousPendingCount(pendingFirs.length);
  }, [pendingFirs.length]);

  useEffect(() => {
    loadPendingFirs();
    loadAcceptedFirs();
  }, [onRefresh]);

  // Load users for transfer when tab changes
  useEffect(() => {
    if (activeTab === "transfer") {
      loadUsers();
    }
  }, [activeTab]);

  async function loadUsers() {
    try {
      const [court, forensic] = await Promise.all([
        apiRequest<User[]>("/admin/users/by-role/COURT", { token }),
        apiRequest<User[]>("/admin/users/by-role/FORENSIC_ANALYST", { token }),
      ]);
      setCourtUsers(court);
      setForensicUsers(forensic);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }

  async function loadPendingFirs() {
    try {
      const firs = await apiRequest<PendingFIR[]>("/fir/pending", { token });
      setPendingFirs(firs);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAcceptedFirs() {
    try {
      const allFirsData = await apiRequest<PendingFIR[]>("/fir/all", { token });
      const accepted = allFirsData.filter((f) => f.status === "ACCEPTED");
      setAcceptedFirs(accepted);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadEvidenceForCase(caseId: string) {
    if (!caseId) {
      setCaseEvidenceList([]);
      return;
    }
    setIsLoadingEvidence(true);
    try {
      const evidenceList = await apiRequest<CaseEvidence[]>(
        `/cases/evidence/case/${caseId}`,
        { token },
      );
      setCaseEvidenceList(evidenceList);
    } catch (err) {
      console.error("Error loading case evidence:", err);
      setCaseEvidenceList([]);
    } finally {
      setIsLoadingEvidence(false);
    }
  }

  // NEW: View complete FIR details
  async function viewFirDetails(firId: string) {
    setLoading(true);
    try {
      const response = await apiRequest<{ fir: FIRDetail }>(
        `/admin/fir-details/${firId}`,
        { token },
      );
      setSelectedFirDetails(response.fir);
      setActiveTab("firDetails");
    } catch (err) {
      setMessage("❌ Failed to load FIR details");
    } finally {
      setLoading(false);
    }
  }

  // NEW: Generate investigation report
  async function generateReport(caseId: string) {
    setLoading(true);
    try {
      const report = await apiRequest<InvestigationReport>(
        `/cases/generate-report/${caseId}`,
        { token },
      );
      setInvestigationReport(report);
      setActiveTab("report");
    } catch (err) {
      setMessage("❌ Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  // NEW: Submit case to court
  async function submitToCourt(caseId: string) {
    if (!selectedCourtEmail) {
      setMessage("❌ Please select a court officer");
      return;
    }
    setLoading(true);
    try {
      await apiRequest(`/cases/submit-to-court/${caseId}`, {
        method: "POST",
        token,
        body: { court_email: selectedCourtEmail },
      });
      setMessage(`✅ Case submitted to ${selectedCourtEmail}`);
      onRefresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Submission failed");
    } finally {
      setLoading(false);
    }
  }

  // frontend/src/pages/roles/Investigator/InvestigatorView.tsx

  async function submitToForensic(evidenceId: string) {
    if (!selectedForensicEmail) {
      setMessage("❌ Please select a forensic analyst");
      return;
    }
    setLoading(true);
    try {
      // FIX: Send forensic_email in body, not as query param
      const response = await fetch(
        `${API_BASE_URL}/cases/submit-to-forensic/${evidenceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ forensic_email: selectedForensicEmail }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Submission failed");
      }

      setMessage(`✅ Evidence submitted to ${selectedForensicEmail}`);
      onRefresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        "❌ Submission failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCaseSelectForVerify(caseId: string) {
    const foundCase = cases.find((c: any) => c.case_id === caseId);
    setSelectedCaseForVerify(foundCase);
    setSelectedEvidenceForVerify(null);
    setSelectedFileForVerify(null);
    setVerifyHashInput("");
    setVerifyResult(null);
    if (caseId) {
      loadEvidenceForCase(caseId);
    } else {
      setCaseEvidenceList([]);
    }
  }

  function handleEvidenceSelect(evidenceId: string) {
    const evidence = caseEvidenceList.find((e) => e.evidence_id === evidenceId);
    setSelectedEvidenceForVerify(evidence || null);
    setSelectedFileForVerify(null);
    setVerifyHashInput("");
    setVerifyResult(null);
    if (verifyFileInputRef.current) {
      verifyFileInputRef.current.value = "";
    }
  }

  async function verifyEvidenceByFile() {
    if (!selectedEvidenceForVerify) {
      setVerifyResult({
        verified: false,
        message: "❌ Please select an evidence first",
      });
      return;
    }
    if (!selectedFileForVerify) {
      setVerifyResult({
        verified: false,
        message: "❌ Please select a file to verify",
      });
      return;
    }
    setIsUploadingForVerify(true);
    setVerifyResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFileForVerify);
      const response = await fetch(
        `${API_BASE_URL}/cases/evidence/verify-by-file?evidence_id=${selectedEvidenceForVerify.evidence_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Verification failed");
      }
      const result = await response.json();
      setVerifyResult({
        verified: result.verified,
        message: result.message,
        stored_hash: result.stored_hash,
        provided_hash: result.uploaded_hash,
        verification_time: result.verification_time,
        evidence_title: result.evidence_title,
        uploaded_file_name: result.uploaded_file_name,
        stored_cid: result.stored_cid,
      });
    } catch (err) {
      setVerifyResult({
        verified: false,
        message:
          "❌ Verification failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setIsUploadingForVerify(false);
      setSelectedFileForVerify(null);
      if (verifyFileInputRef.current) verifyFileInputRef.current.value = "";
    }
  }

  function handleVerifyFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setVerifyResult({
        verified: false,
        message: "❌ File too large! Max 50MB",
      });
      return;
    }
    setSelectedFileForVerify(file);
    setVerifyResult(null);
  }

  async function verifySelectedHash() {
    if (!selectedEvidenceForVerify) {
      setVerifyResult({
        verified: false,
        message: "❌ Please select an evidence first",
      });
      return;
    }
    if (!verifyHashInput.trim()) {
      setVerifyResult({
        verified: false,
        message: "❌ Please enter the hash to verify",
      });
      return;
    }
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await apiRequest<{
        verified: boolean;
        message: string;
        stored_hash: string;
        provided_hash: string;
        verification_time: string;
      }>("/cases/evidence/verify", {
        method: "POST",
        token,
        body: {
          evidence_id: selectedEvidenceForVerify.evidence_id,
          provided_hash: verifyHashInput.trim(),
        },
      });
      setVerifyResult({
        verified: result.verified,
        message: result.message,
        stored_hash: result.stored_hash,
        provided_hash: result.provided_hash,
        verification_time: result.verification_time,
        evidence_title: selectedEvidenceForVerify.title,
      });
    } catch (err) {
      setVerifyResult({
        verified: false,
        message:
          "❌ Verification failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function updateFIRStatus(
    firId: string,
    status: string,
    remarks?: string,
  ) {
    setLoading(true);
    try {
      const response = await apiRequest<FIRStatusResponse>(
        `/fir/${firId}/status`,
        { method: "PUT", token, body: { status, remarks } },
      );
      await loadPendingFirs();
      await loadAcceptedFirs();
      await onRefresh();
      setMessage(
        response.case
          ? `✅ FIR ${status}! Case ${response.case.case_number} has been auto-created.`
          : `✅ FIR ${status} successfully!`,
      );
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function createCase() {
    if (!caseFirId || !caseTitle) {
      setMessage("❌ Please fill FIR ID and Case Title");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/cases/", {
        method: "POST",
        token,
        body: {
          fir_id: caseFirId,
          title: caseTitle,
          description: caseDescription,
          priority: "MEDIUM",
        },
      });
      setMessage("✅ Case created successfully!");
      setCaseFirId("");
      setCaseTitle("");
      setCaseDescription("");
      onRefresh();
      loadAcceptedFirs();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setMessage("❌ File too large! Max 50MB");
      return;
    }
    setSelectedFile(file);
    setMessage(
      `✅ Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    );
  }

  async function uploadAndAddEvidence() {
    if (!selectedCase) {
      setMessage("❌ Please select a case first");
      return;
    }
    if (!evidenceTitle) {
      setMessage("❌ Please enter evidence title");
      return;
    }
    if (!selectedFile) {
      setMessage("❌ Please select a file to upload");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90));
      }, 200);
      setMessage("📤 Calculating hash & uploading to IPFS...");
      const { cid, hash } = await uploadFileToIPFS(selectedFile, token);
      clearInterval(progressInterval);
      setUploadProgress(100);
      const response = await apiRequest<EvidenceResponse>("/cases/evidence", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          title: evidenceTitle,
          description: evidenceDescription,
          ipfs_cid: cid,
          file_hash: hash,
        },
      });
      setEvidenceTitle("");
      setEvidenceDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await onRefresh();
      setMessage(
        `✅ Evidence "${evidenceTitle}" added successfully!\n\n📋 Evidence ID: ${response.evidence_id}\n🔗 IPFS CID: ${cid}\n🔑 Hash: ${hash}\n💾 SAVE THESE VALUES!`,
      );
      setTimeout(() => setMessage(""), 10000);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(
        "❌ Upload failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function selectEvidenceForVerification(
    evidenceId: string,
    hash: string,
    ipfsCid: string,
  ) {
    const ev = evidence.find((e: any) => e.evidence_id === evidenceId);
    if (ev) {
      const parentCase = cases.find((c: any) => c.case_id === ev.case_id);
      if (parentCase) {
        setSelectedCaseForVerify(parentCase);
        loadEvidenceForCase(parentCase.case_id).then(() => {
          setSelectedEvidenceForVerify({
            evidence_id: evidenceId,
            title: ev.title,
            hash: hash,
            ipfs_cid: ipfsCid,
            status: ev.status,
            created_at: ev.created_at,
          });
          setSelectedFileForVerify(null);
          setVerifyHashInput("");
          setVerifyResult(null);
          if (verifyFileInputRef.current) verifyFileInputRef.current.value = "";
        });
      }
    }
    setActiveTab("verify");
  }

  async function addSuspect() {
    if (!selectedCase || !suspectName) {
      setMessage("❌ Please select case and enter suspect name");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/cases/suspects", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          name: suspectName,
          father_name: "",
          address: "",
          description: suspectDetails,
        },
      });
      setMessage("✅ Suspect added successfully!");
      setSuspectName("");
      setSuspectDetails("");
      onRefresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add suspect");
    } finally {
      setLoading(false);
    }
  }

  async function addWitness() {
    if (!selectedCase || !witnessName) {
      setMessage("❌ Please select case and enter witness name");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/cases/witnesses", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          name: witnessName,
          contact: "",
          address: "",
          statement: witnessDetails,
        },
      });
      setMessage("✅ Witness added successfully!");
      setWitnessName("");
      setWitnessDetails("");
      onRefresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add witness");
    } finally {
      setLoading(false);
    }
  }

  async function transferEvidence(evidenceId: string, target: string) {
    setLoading(true);
    try {
      const path =
        target === "forensic"
          ? `/cases/evidence/transfer/forensic/${evidenceId}`
          : `/cases/evidence/transfer/court/${evidenceId}`;
      await apiRequest(path, { method: "POST", token });
      setMessage(`✅ Evidence transferred to ${target}`);
      onRefresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  function viewEvidenceOnIPFS(ipfsCid: string) {
    window.open(`https://dweb.link/ipfs/${ipfsCid}`, "_blank");
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      SUBMITTED: "#f59e0b",
      UNDER_REVIEW: "#3b82f6",
      ACCEPTED: "#10b981",
      REJECTED: "#ef4444",
      UNDER_INVESTIGATION: "#8b5cf6",
      COLLECTED: "#10b981",
      TRANSFERRED_TO_FORENSIC: "#f59e0b",
      SUBMITTED_TO_COURT: "#ef4444",
      DECIDED: "#6b7280",
    };
    return (
      <span
        style={{
          background: colors[status] || "#6b7280",
          color: "white",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "500",
        }}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  // Download report function - Add this before return
  async function downloadReport(caseId: string, format: string) {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/cases/download-report/${caseId}?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `investigation_report_${caseId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage(`✅ Report downloaded as ${format.toUpperCase()}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        "❌ Download failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  }

  const pendingCount = pendingFirs.length;
  const acceptedCount = acceptedFirs.length;
  const totalCases = cases.length;
  const totalEvidence = evidence.length;
  const pendingEvidence = evidence.filter(
    (e: any) => e.status === "COLLECTED",
  ).length;
  const inProgressEvidence = evidence.filter(
    (e: any) => e.status === "TRANSFERRED_TO_FORENSIC",
  ).length;
  const completedEvidence = evidence.filter(
    (e: any) => e.status === "SUBMITTED_TO_COURT",
  ).length;

  const filteredCases = cases.filter(
    (c: any) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (searchTerm === "" ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_number.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const statsCards = [
    { title: "CASES", value: totalCases, icon: "⚖️" },
    { title: "EVIDENCE", value: totalEvidence, icon: "📦" },
    { title: "PENDING", value: pendingEvidence, icon: "⏳" },
    { title: "IN PROGRESS", value: inProgressEvidence, icon: "🔬" },
    { title: "COMPLETE", value: completedEvidence, icon: "✅" },
  ];

  return (
    <div>
      {newFirNotification && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🔔</span>
          <div>
            <strong style={{ color: "#92400e" }}>{newFirNotification}</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "#78350f" }}>
              Go to Pending FIRs tab to review and accept.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              background: "#f59e0b",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            View Now →
          </button>
        </div>
      )}

      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          color: "white",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px" }}>
          🔍 Investigation Dashboard
        </h2>
        <p style={{ opacity: 0.8, marginTop: "8px" }}>
          Evidence is stored on IPFS - Decentralized & Tamper-Proof
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: "12px",
                background: "#f59e0b",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              {pendingCount} Pending FIRs
            </span>
          )}
          {acceptedCount > 0 && (
            <span
              style={{
                marginLeft: "12px",
                background: "#10b981",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              {acceptedCount} Accepted FIRs
            </span>
          )}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {statsCards.map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px" }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>{stat.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Buttons - EXISTING TABS + NEW TABS ADDED AT THE END */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* EXISTING TABS - NO CHANGES */}
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            background: activeTab === "overview" ? "#3b82f6" : "transparent",
            color: activeTab === "overview" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("cases")}
          style={{
            background: activeTab === "cases" ? "#3b82f6" : "transparent",
            color: activeTab === "cases" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ⚖️ Cases
        </button>
        <button
          onClick={() => setActiveTab("evidence")}
          style={{
            background: activeTab === "evidence" ? "#3b82f6" : "transparent",
            color: activeTab === "evidence" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📦 Evidence
        </button>
        <button
          onClick={() => setActiveTab("verify")}
          style={{
            background: activeTab === "verify" ? "#3b82f6" : "transparent",
            color: activeTab === "verify" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🔐 Verify Evidence
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          style={{
            background: activeTab === "upload" ? "#3b82f6" : "transparent",
            color: activeTab === "upload" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📤 Upload Evidence
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            background: activeTab === "pending" ? "#3b82f6" : "transparent",
            color: activeTab === "pending" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            position: "relative",
          }}
        >
          📋 Pending FIRs{" "}
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: "5px",
                background: "red",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "10px",
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          style={{
            background: activeTab === "accepted" ? "#3b82f6" : "transparent",
            color: activeTab === "accepted" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ✅ Accepted FIRs
        </button>
        <button
          onClick={() => setActiveTab("create")}
          style={{
            background: activeTab === "create" ? "#3b82f6" : "transparent",
            color: activeTab === "create" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ➕ Create Case
        </button>
        <button
          onClick={() => setActiveTab("suspects")}
          style={{
            background: activeTab === "suspects" ? "#3b82f6" : "transparent",
            color: activeTab === "suspects" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          👤 Suspects
        </button>
        <button
          onClick={() => setActiveTab("witnesses")}
          style={{
            background: activeTab === "witnesses" ? "#3b82f6" : "transparent",
            color: activeTab === "witnesses" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          👥 Witnesses
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            background: activeTab === "reports" ? "#3b82f6" : "transparent",
            color: activeTab === "reports" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📋 Reports
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          style={{
            background: activeTab === "transfer" ? "#3b82f6" : "transparent",
            color: activeTab === "transfer" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📤 Submit to Court/Forensic
        </button>

        {/* ============ NEW TABS - ADDED AT THE END ============ */}
        <button
          onClick={() => setActiveTab("tasks")}
          style={{
            background: activeTab === "tasks" ? "#3b82f6" : "transparent",
            color: activeTab === "tasks" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ✅ Task Manager
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          style={{
            background: activeTab === "stats" ? "#3b82f6" : "transparent",
            color: activeTab === "stats" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab("comm")}
          style={{
            background: activeTab === "comm" ? "#3b82f6" : "transparent",
            color: activeTab === "comm" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          💬 Communication
        </button>
        <button
          onClick={() => setActiveTab("search")}
          style={{
            background: activeTab === "search" ? "#3b82f6" : "transparent",
            color: activeTab === "search" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🔍 Advanced Search
        </button>
        <button
          onClick={() => setActiveTab("court-package")}
          style={{
            background:
              activeTab === "court-package" ? "#3b82f6" : "transparent",
            color: activeTab === "court-package" ? "white" : "#64748b",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📦 Court Package
        </button>
      </div>

      {/* ============ EXISTING TAB CONTENTS (NO CHANGES) ============ */}

      {/* FIR DETAILS TAB */}
      {activeTab === "firDetails" && selectedFirDetails && (
        <div className="card">
          <button
            onClick={() => setActiveTab("cases")}
            style={{
              background: "#6b7280",
              marginBottom: "16px",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Back to Cases
          </button>
          <h2>📋 Complete FIR Details</h2>

          <div
            style={{
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h3>FIR Information</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <strong>FIR Number:</strong> {selectedFirDetails.fir_number}
              </div>
              <div>
                <strong>FIR ID:</strong> {selectedFirDetails.fir_id}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {getStatusBadge(selectedFirDetails.status)}
              </div>
              <div>
                <strong>Filed On:</strong>{" "}
                {new Date(selectedFirDetails.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#eff6ff",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h3>👤 Complainant Details</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <strong>Name:</strong> {selectedFirDetails.complainant_name}
              </div>
              <div>
                <strong>Contact:</strong>{" "}
                {selectedFirDetails.complainant_contact}
              </div>
              <div>
                <strong>Email:</strong> {selectedFirDetails.complainant_email}
              </div>
              <div>
                <strong>Address:</strong>{" "}
                {selectedFirDetails.complainant_address}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#fef3c7",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h3>📌 Incident Details</h3>
            <div>
              <strong>Title:</strong> {selectedFirDetails.incident_title}
            </div>
            <div>
              <strong>Description:</strong>{" "}
              {selectedFirDetails.incident_description}
            </div>
            <div>
              <strong>Location:</strong> {selectedFirDetails.incident_location}
            </div>
            <div>
              <strong>Date & Time:</strong>{" "}
              {new Date(selectedFirDetails.incident_datetime).toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: "#fce7f3",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h3>👮 Suspect Information</h3>
            <div>
              <strong>Accused Person:</strong>{" "}
              {selectedFirDetails.accused_person || "Not specified"}
            </div>
            <div>
              <strong>Description:</strong>{" "}
              {selectedFirDetails.accused_description || "Not specified"}
            </div>
          </div>

          <div
            style={{
              background: "#dcfce7",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>👥 Witness Information</h3>
            <div>
              <strong>Witness Names:</strong>{" "}
              {selectedFirDetails.witness_names || "Not specified"}
            </div>
            <div>
              <strong>Witness Contact:</strong>{" "}
              {selectedFirDetails.witness_contact || "Not specified"}
            </div>
          </div>

          {selectedFirDetails.status_history &&
            selectedFirDetails.status_history.length > 0 && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  background: "#e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <h3>📜 Status History</h3>
                {selectedFirDetails.status_history.map((history, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderLeft: "3px solid #3b82f6",
                      paddingLeft: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <strong>{history.status}</strong> -{" "}
                      {new Date(history.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {history.remarks}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      By: {history.changed_by}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* INVESTIGATION REPORT TAB */}
      {activeTab === "report" && investigationReport && (
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              onClick={() => setActiveTab("reports")}
              style={{
                background: "#6b7280",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to Reports
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() =>
                  downloadReport(
                    investigationReport.case_details.case_id,
                    "pdf",
                  )
                }
                style={{
                  background: "#ef4444",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                📄 Download PDF
              </button>
              <button
                onClick={() =>
                  downloadReport(
                    investigationReport.case_details.case_id,
                    "docx",
                  )
                }
                style={{
                  background: "#3b82f6",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                📝 Download DOCX
              </button>
              <button
                onClick={() =>
                  downloadReport(
                    investigationReport.case_details.case_id,
                    "txt",
                  )
                }
                style={{
                  background: "#10b981",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                📃 Download TXT
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1>🔍 INVESTIGATION REPORT</h1>
            <p>Report ID: {investigationReport.report_id}</p>
            <p>
              Generated:{" "}
              {new Date(investigationReport.generated_at).toLocaleString()}
            </p>
            <p>Generated By: {investigationReport.generated_by}</p>
          </div>

          <div
            style={{
              background: "#1e293b",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: "white" }}>📋 CASE DETAILS</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <strong>Case Number:</strong>{" "}
                {investigationReport.case_details.case_number}
              </div>
              <div>
                <strong>Case ID:</strong>{" "}
                {investigationReport.case_details.case_id}
              </div>
              <div>
                <strong>Title:</strong> {investigationReport.case_details.title}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {getStatusBadge(investigationReport.case_details.status)}
              </div>
              <div>
                <strong>Priority:</strong>{" "}
                {investigationReport.case_details.priority}
              </div>
              <div>
                <strong>Investigator:</strong>{" "}
                {investigationReport.case_details.investigator_name ||
                  investigationReport.case_details.investigator}
              </div>
            </div>
          </div>

          {investigationReport.fir_details && (
            <div
              style={{
                background: "#eff6ff",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <h2>📝 FIR DETAILS</h2>
              <div>
                <strong>FIR Number:</strong>{" "}
                {investigationReport.fir_details.fir_number}
              </div>
              <div>
                <strong>Complainant:</strong>{" "}
                {investigationReport.fir_details.complainant_name} (
                {investigationReport.fir_details.complainant_contact})
              </div>
              <div>
                <strong>Incident:</strong>{" "}
                {investigationReport.fir_details.incident_title}
              </div>
              <div>
                <strong>Location:</strong>{" "}
                {investigationReport.fir_details.incident_location}
              </div>
            </div>
          )}

          <div
            style={{
              background: "#fef3c7",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>👤 SUSPECTS ({investigationReport.suspects.length})</h2>
            {investigationReport.suspects.length === 0 ? (
              <p>No suspects identified</p>
            ) : (
              investigationReport.suspects.map((suspect, idx) => (
                <div
                  key={idx}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px",
                  }}
                >
                  <strong>{suspect.name}</strong> - Added:{" "}
                  {new Date(suspect.added_at).toLocaleString()}
                  <div>{suspect.description}</div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              background: "#dcfce7",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>👥 WITNESSES ({investigationReport.witnesses.length})</h2>
            {investigationReport.witnesses.length === 0 ? (
              <p>No witnesses recorded</p>
            ) : (
              investigationReport.witnesses.map((witness, idx) => (
                <div
                  key={idx}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px",
                  }}
                >
                  <strong>{witness.name}</strong> - Contact: {witness.contact}
                  <div>Statement: {witness.statement}</div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              background: "#e0f2fe",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>📦 EVIDENCE ({investigationReport.evidence.length})</h2>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "8px",
                }}
              >
                ✅ Verified:{" "}
                {investigationReport.evidence_verification_status.verified}
              </span>
              <span
                style={{
                  background: "#f59e0b",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "8px",
                }}
              >
                ⏳ Pending:{" "}
                {investigationReport.evidence_verification_status.pending}
              </span>
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "8px",
                }}
              >
                ❌ Tampered:{" "}
                {investigationReport.evidence_verification_status.tampered}
              </span>
            </div>
            {investigationReport.evidence.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{item.title}</strong>
                  {item.verifications && item.verifications.length > 0 ? (
                    item.verifications[item.verifications.length - 1].result ? (
                      <span style={{ color: "#10b981" }}>✅ Verified</span>
                    ) : (
                      <span style={{ color: "#ef4444" }}>❌ Tampered</span>
                    )
                  ) : (
                    <span style={{ color: "#f59e0b" }}>⏳ Not Verified</span>
                  )}
                </div>
                <div>
                  <small>CID: {item.ipfs_cid}</small>
                </div>
                <div>
                  <small>Hash: {item.hash?.substring(0, 40)}...</small>
                </div>
                <div>
                  <small>
                    Collected: {new Date(item.collected_at).toLocaleString()} by{" "}
                    {item.collected_by}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#f3e8ff",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h2>⏱️ INVESTIGATION TIMELINE</h2>
            {investigationReport.timeline.map((event, idx) => (
              <div
                key={idx}
                style={{
                  borderLeft: "3px solid #8b5cf6",
                  paddingLeft: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <strong>{event.action}</strong> -{" "}
                  {new Date(event.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  By: {event.by}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSFER TAB */}
      {activeTab === "transfer" && (
        <div className="card">
          <h2>📤 Submit to Court or Forensic</h2>

          <div
            style={{
              background: "#eff6ff",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "24px",
            }}
          >
            <h3>⚖️ Submit Complete Case to Court</h3>
            <div className="form-grid">
              <label>Select Case *</label>
              <select
                onChange={(e) =>
                  setSelectedCase(
                    cases.find((c: any) => c.case_id === e.target.value),
                  )
                }
              >
                <option value="">-- Select Case --</option>
                {cases
                  .filter(
                    (c: any) =>
                      c.status !== "SUBMITTED_TO_COURT" &&
                      c.status !== "DECIDED",
                  )
                  .map((c: any) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
              </select>

              <label>Select Court Officer *</label>
              <select
                value={selectedCourtEmail}
                onChange={(e) => setSelectedCourtEmail(e.target.value)}
              >
                <option value="">-- Select Court Officer --</option>
                {courtUsers.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  selectedCase && submitToCourt(selectedCase.case_id)
                }
                disabled={!selectedCase || !selectedCourtEmail || loading}
                style={{
                  background: "#8b5cf6",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                📤 Submit Case to Court
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#fef3c7",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>🔬 Submit Evidence to Forensic Analyst</h3>
            <div className="form-grid">
              <label>Select Evidence *</label>
              <select
                onChange={(e) =>
                  setSelectedEvidenceForTransfer(
                    evidence.find(
                      (ev: any) => ev.evidence_id === e.target.value,
                    ),
                  )
                }
              >
                <option value="">-- Select Evidence --</option>
                {evidence
                  .filter(
                    (e: any) =>
                      e.status !== "TRANSFERRED_TO_FORENSIC" &&
                      e.status !== "SUBMITTED_TO_FORENSIC",
                  )
                  .map((e: any) => (
                    <option key={e.evidence_id} value={e.evidence_id}>
                      {e.title} - Case: {e.case_id}
                    </option>
                  ))}
              </select>

              <label>Select Forensic Analyst *</label>
              <select
                value={selectedForensicEmail}
                onChange={(e) => setSelectedForensicEmail(e.target.value)}
              >
                <option value="">-- Select Forensic Analyst --</option>
                {forensicUsers.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  selectedEvidenceForTransfer &&
                  submitToForensic(selectedEvidenceForTransfer.evidence_id)
                }
                disabled={
                  !selectedEvidenceForTransfer ||
                  !selectedForensicEmail ||
                  loading
                }
                style={{
                  background: "#f59e0b",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                🔬 Submit Evidence to Forensic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB WITH DOWNLOAD */}
      {activeTab === "reports" && (
        <div className="card">
          <h2>📋 Investigation Reports</h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {cases.length === 0 ? (
              <p>No cases available.</p>
            ) : (
              cases.map((c: any) => (
                <div
                  key={c.case_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "16px" }}>
                        {c.case_number}
                      </strong>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        Status: {c.status} | Evidence: {c.evidence?.length || 0}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <button
                        onClick={() => generateReport(c.case_id)}
                        style={{
                          background: "#3b82f6",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        📄 View Report
                      </button>
                      <button
                        onClick={() => downloadReport(c.case_id, "pdf")}
                        style={{
                          background: "#ef4444",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => downloadReport(c.case_id, "docx")}
                        style={{
                          background: "#3b82f6",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        📝 DOCX
                      </button>
                      <button
                        onClick={() => downloadReport(c.case_id, "txt")}
                        style={{
                          background: "#10b981",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        📃 TXT
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="card">
            <h3>📋 Recent Cases</h3>
            {cases.length === 0 ? (
              <p>No cases yet.</p>
            ) : (
              cases.slice(0, 5).map((c: any) => (
                <div
                  key={c.case_id}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{c.case_number}</strong>
                    <br />
                    <small>{c.title}</small>
                    {c.ipfs_cid && (
                      <>
                        <br />
                        <small style={{ fontSize: "10px" }}>
                          CID: {c.ipfs_cid?.substring(0, 20)}...
                        </small>
                      </>
                    )}
                  </div>
                  {getStatusBadge(c.status)}
                </div>
              ))
            )}
          </div>
          <div className="card">
            <h3>📦 Recent Evidence</h3>
            {evidence.length === 0 ? (
              <p>No evidence yet.</p>
            ) : (
              evidence.slice(0, 5).map((e: any) => (
                <div
                  key={e.evidence_id}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{e.title}</strong>
                    <br />
                    <small>CID: {e.ipfs_cid?.substring(0, 25)}...</small>
                    <br />
                    <small>Hash: {e.hash?.substring(0, 15)}...</small>
                  </div>
                  {getStatusBadge(e.status)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Cases Tab */}
      {activeTab === "cases" && (
        <div className="card">
          <h3>⚖️ All Cases</h3>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="🔍 Search by case number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                flex: 1,
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <option value="all">All Status</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="SUBMITTED_TO_COURT">Submitted to Court</option>
              <option value="DECIDED">Decided</option>
            </select>
          </div>
          {filteredCases.map((c: any) => (
            <div
              key={c.case_id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <strong>{c.case_number}</strong>
                {getStatusBadge(c.status)}
              </div>
              <h4>{c.title}</h4>
              <p>{c.description?.substring(0, 100)}...</p>
              {c.ipfs_cid && (
                <small style={{ color: "#666" }}>CID: {c.ipfs_cid}</small>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => viewFirDetails(c.fir_id)}
                  style={{
                    background: "#10b981",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  View FIR Details
                </button>
                <button
                  onClick={() => generateReport(c.case_id)}
                  style={{
                    background: "#8b5cf6",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Generate Report
                </button>
                <button
                  onClick={() => {
                    setSelectedCase(c);
                    setActiveTab("upload");
                  }}
                  style={{
                    background: "#3b82f6",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Add Evidence
                </button>
                {c.status !== "SUBMITTED_TO_COURT" &&
                  c.status !== "DECIDED" && (
                    <button
                      onClick={() => {
                        setSelectedCase(c);
                        setActiveTab("transfer");
                      }}
                      style={{
                        background: "#f59e0b",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Submit to Court
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === "evidence" && (
        <div className="card">
          <h3>📦 Evidence Management</h3>
          {evidence.length === 0 ? (
            <p>No evidence uploaded yet. Go to "Upload Evidence" tab.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "12px" }}>EVIDENCE</th>
                    <th>CASE</th>
                    <th>IPFS CID</th>
                    <th>HASH</th>
                    <th>STATUS</th>
                    <th>VERIFIED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((e: any) => (
                    <tr
                      key={e.evidence_id}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={{ padding: "12px" }}>
                        <strong>{e.title}</strong>
                        <br />
                        <small>{e.description?.substring(0, 50)}</small>
                      </td>
                      <td style={{ padding: "12px" }}>{e.case_id}</td>
                      <td style={{ padding: "12px" }}>
                        <code style={{ fontSize: "11px" }}>
                          {e.ipfs_cid?.substring(0, 20)}...
                        </code>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <code style={{ fontSize: "11px" }}>
                          {e.hash?.substring(0, 30)}...
                        </code>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {getStatusBadge(e.status)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {e.verifications?.length > 0 ? (
                          e.verifications[e.verifications.length - 1].result ? (
                            <span style={{ color: "#10b981" }}>
                              ✅ Verified
                            </span>
                          ) : (
                            <span style={{ color: "#ef4444" }}>
                              ❌ Tampered
                            </span>
                          )
                        ) : (
                          <span style={{ color: "#f59e0b" }}>⏳ Pending</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => viewEvidenceOnIPFS(e.ipfs_cid)}
                            style={{
                              background: "#3b82f6",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              selectEvidenceForVerification(
                                e.evidence_id,
                                e.hash,
                                e.ipfs_cid,
                              )
                            }
                            style={{
                              background: "#8b5cf6",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            Verify
                          </button>
                          {e.status !== "TRANSFERRED_TO_FORENSIC" &&
                            e.status !== "SUBMITTED_TO_FORENSIC" && (
                              <button
                                onClick={() => {
                                  setSelectedEvidenceForTransfer(e);
                                  setActiveTab("transfer");
                                }}
                                style={{
                                  background: "#f59e0b",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                              >
                                Send to Forensic
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Verify Tab */}
      {activeTab === "verify" && (
        <div className="card">
          <h2>🔐 Verify Evidence Authenticity</h2>
          <div className="form-grid" style={{ maxWidth: "700px" }}>
            <label>📁 Step 1: Select Case *</label>
            <select
              value={selectedCaseForVerify?.case_id || ""}
              onChange={(e) => handleCaseSelectForVerify(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="">-- Select a case --</option>
              {cases.map((c: any) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>

            {selectedCaseForVerify && (
              <>
                <label>📋 Step 2: Select Evidence *</label>
                {isLoadingEvidence ? (
                  <p>Loading evidence...</p>
                ) : caseEvidenceList.length === 0 ? (
                  <p style={{ color: "#f59e0b" }}>
                    ⚠️ No evidence found for this case.
                  </p>
                ) : (
                  <select
                    value={selectedEvidenceForVerify?.evidence_id || ""}
                    onChange={(e) => handleEvidenceSelect(e.target.value)}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option value="">-- Select evidence --</option>
                    {caseEvidenceList.map((e: CaseEvidence) => (
                      <option key={e.evidence_id} value={e.evidence_id}>
                        {e.title} - {e.status}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {selectedEvidenceForVerify && (
              <>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                    borderRadius: "12px",
                    padding: "20px",
                    marginTop: "10px",
                    border: "2px solid #0284c7",
                  }}
                >
                  <h3 style={{ color: "#0369a1" }}>
                    📂 Step 3: Upload Original File
                  </h3>
                  <div
                    style={{
                      border: "2px dashed #0284c7",
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                    onClick={() => verifyFileInputRef.current?.click()}
                  >
                    <input
                      ref={verifyFileInputRef}
                      type="file"
                      onChange={handleVerifyFileSelect}
                      style={{ display: "none" }}
                    />
                    <div style={{ fontSize: "48px" }}>📄</div>
                    <p>
                      {selectedFileForVerify
                        ? `Selected: ${selectedFileForVerify.name}`
                        : "Click to select file"}
                    </p>
                  </div>
                  <button
                    onClick={verifyEvidenceByFile}
                    disabled={isUploadingForVerify || !selectedFileForVerify}
                    style={{
                      background: "#0284c7",
                      padding: "14px",
                      marginTop: "16px",
                      width: "100%",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {isUploadingForVerify ? "Verifying..." : "Verify File"}
                  </button>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    marginTop: "16px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <strong>📋 Evidence Details:</strong>
                  <div style={{ marginTop: "8px", fontSize: "14px" }}>
                    <p>
                      <strong>ID:</strong>{" "}
                      <code>{selectedEvidenceForVerify.evidence_id}</code>
                    </p>
                    <p>
                      <strong>Title:</strong> {selectedEvidenceForVerify.title}
                    </p>
                    <p>
                      <strong>IPFS CID:</strong>{" "}
                      <code
                        style={{ fontSize: "11px", wordBreak: "break-all" }}
                      >
                        {selectedEvidenceForVerify.ipfs_cid}
                      </code>
                    </p>
                    <p>
                      <strong>Stored Hash:</strong>{" "}
                      <code
                        style={{ fontSize: "11px", wordBreak: "break-all" }}
                      >
                        {selectedEvidenceForVerify.hash}
                      </code>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {verifyResult && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                borderRadius: "12px",
                background: verifyResult.verified ? "#f0fdf4" : "#fef2f2",
                border: `2px solid ${verifyResult.verified ? "#10b981" : "#ef4444"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "56px" }}>
                  {verifyResult.verified ? "✅" : "❌"}
                </span>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: verifyResult.verified ? "#166534" : "#991b1b",
                    }}
                  >
                    {verifyResult.verified
                      ? "VERIFICATION PASSED!"
                      : "VERIFICATION FAILED!"}
                  </h2>
                  <p
                    style={{
                      color: verifyResult.verified ? "#065f46" : "#7f1d1d",
                    }}
                  >
                    {verifyResult.message}
                  </p>
                  {verifyResult.uploaded_file_name && (
                    <p style={{ fontSize: "12px" }}>
                      Verified File: {verifyResult.uploaded_file_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="card">
          <h3>📤 Upload Evidence to IPFS</h3>
          <div className="form-grid">
            <label>Select Case *</label>
            <select
              value={selectedCase?.case_id || ""}
              onChange={(e) =>
                setSelectedCase(
                  cases.find((c: any) => c.case_id === e.target.value),
                )
              }
            >
              <option value="">-- Select Case --</option>
              {cases.map((c: any) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
            <label>Evidence Title *</label>
            <input
              value={evidenceTitle}
              onChange={(e) => setEvidenceTitle(e.target.value)}
              placeholder="e.g., CCTV Footage"
            />
            <label>Description</label>
            <textarea
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              rows={3}
            />
            <label>Select File *</label>
            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "48px" }}>📁</div>
              <p>{selectedFile ? selectedFile.name : "Click to upload"}</p>
            </div>
            {isUploading && (
              <div
                style={{
                  height: "8px",
                  background: "#e2e8f0",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    background: "#3b82f6",
                  }}
                />
              </div>
            )}
            <button
              onClick={uploadAndAddEvidence}
              disabled={
                isUploading || !selectedCase || !evidenceTitle || !selectedFile
              }
              style={{
                background: "#10b981",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {isUploading ? "Uploading..." : "Upload to IPFS"}
            </button>
          </div>
        </div>
      )}

      {/* Pending FIRs Tab */}
      {activeTab === "pending" && (
        <div className="card">
          <h3>📋 Pending FIRs {pendingCount > 0 && `(${pendingCount})`}</h3>
          {pendingFirs.length === 0 ? (
            <p>✅ No pending FIRs to review.</p>
          ) : (
            pendingFirs.map((fir) => (
              <div
                key={fir.fir_id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{fir.fir_number}</strong>
                  {getStatusBadge(fir.status)}
                </div>
                <h4>{fir.incident_title}</h4>
                <p>
                  <strong>👤 Complainant:</strong> {fir.complainant_name} (
                  {fir.complainant_contact})
                </p>
                <p>
                  <strong>📍 Location:</strong> {fir.incident_location}
                </p>
                <p>
                  <strong>📝 Description:</strong>{" "}
                  {fir.incident_description?.substring(0, 150)}...
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => updateFIRStatus(fir.fir_id, "ACCEPTED")}
                    style={{
                      background: "#10b981",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Accept FIR
                  </button>
                  <button
                    onClick={() => updateFIRStatus(fir.fir_id, "UNDER_REVIEW")}
                    style={{
                      background: "#3b82f6",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🔍 Under Review
                  </button>
                  <button
                    onClick={() => {
                      const r = prompt("Enter reason:");
                      if (r) updateFIRStatus(fir.fir_id, "REJECTED", r);
                    }}
                    style={{
                      background: "#ef4444",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ❌ Reject FIR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Accepted FIRs Tab */}
      {activeTab === "accepted" && (
        <div className="card">
          <h3>✅ Accepted FIRs ({acceptedCount})</h3>
          {acceptedFirs.length === 0 ? (
            <p>No accepted FIRs yet.</p>
          ) : (
            acceptedFirs.map((fir) => (
              <div
                key={fir.fir_id}
                style={{
                  border: "1px solid #10b981",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "#f0fdf4",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{fir.fir_number}</strong> {getStatusBadge(fir.status)}
                </div>
                <h4>{fir.incident_title}</h4>
                <p>
                  <strong>Complainant:</strong> {fir.complainant_name}
                </p>
                <p>
                  <strong>Location:</strong> {fir.incident_location}
                </p>
                {fir.case_id && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>📋 Case Created:</strong> {fir.case_number}
                  </div>
                )}
                <button
                  onClick={() => viewFirDetails(fir.fir_id)}
                  style={{
                    background: "#10b981",
                    marginTop: "12px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  View Full Details
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Case Tab */}
      {activeTab === "create" && (
        <div className="card">
          <h3>➕ Create Case</h3>
          <div className="form-grid">
            <label>FIR ID *</label>
            <input
              value={caseFirId}
              onChange={(e) => setCaseFirId(e.target.value)}
              placeholder="FIR-XXXXX"
            />
            <small style={{ color: "#666" }}>
              Enter the FIR ID from accepted FIRs
            </small>
            <label>Case Title *</label>
            <input
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
            />
            <label>Description</label>
            <textarea
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={3}
            />
            <button
              onClick={createCase}
              disabled={loading}
              style={{
                background: "#3b82f6",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Create Case
            </button>
          </div>
        </div>
      )}

      {/* Suspects Tab */}
      {activeTab === "suspects" && (
        <div className="card">
          <h3>👤 Add Suspect</h3>
          <div className="form-grid">
            <label>Select Case</label>
            <select
              onChange={(e) =>
                setSelectedCase(
                  cases.find((c: any) => c.case_id === e.target.value),
                )
              }
            >
              <option value="">-- Select --</option>
              {cases.map((c: any) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_number}
                </option>
              ))}
            </select>
            <label>Name</label>
            <input
              value={suspectName}
              onChange={(e) => setSuspectName(e.target.value)}
              placeholder="Suspect full name"
            />
            <label>Details / Description</label>
            <textarea
              value={suspectDetails}
              onChange={(e) => setSuspectDetails(e.target.value)}
              rows={3}
              placeholder="Any known information about the suspect"
            />
            <button
              onClick={addSuspect}
              disabled={loading}
              style={{
                background: "#f59e0b",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Add Suspect
            </button>
          </div>
          <hr />
          <h4>Existing Suspects</h4>
          {selectedCase?.suspects?.length > 0 ? (
            selectedCase.suspects.map((s: any, idx: number) => (
              <div
                key={idx}
                style={{ borderBottom: "1px solid #e2e8f0", padding: "8px" }}
              >
                <strong>{s.name}</strong> - {s.description}
              </div>
            ))
          ) : (
            <p>No suspects added yet.</p>
          )}
        </div>
      )}

      {/* Witnesses Tab */}
      {activeTab === "witnesses" && (
        <div className="card">
          <h3>👥 Add Witness</h3>
          <div className="form-grid">
            <label>Select Case</label>
            <select
              onChange={(e) =>
                setSelectedCase(
                  cases.find((c: any) => c.case_id === e.target.value),
                )
              }
            >
              <option value="">-- Select --</option>
              {cases.map((c: any) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_number}
                </option>
              ))}
            </select>
            <label>Name</label>
            <input
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
              placeholder="Witness full name"
            />
            <label>Statement</label>
            <textarea
              value={witnessDetails}
              onChange={(e) => setWitnessDetails(e.target.value)}
              rows={3}
              placeholder="Witness statement"
            />
            <button
              onClick={addWitness}
              disabled={loading}
              style={{
                background: "#10b981",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Add Witness
            </button>
          </div>
          <hr />
          <h4>Existing Witnesses</h4>
          {selectedCase?.witnesses?.length > 0 ? (
            selectedCase.witnesses.map((w: any, idx: number) => (
              <div
                key={idx}
                style={{ borderBottom: "1px solid #e2e8f0", padding: "8px" }}
              >
                <strong>{w.name}</strong> - {w.statement}
              </div>
            ))
          ) : (
            <p>No witnesses added yet.</p>
          )}
        </div>
      )}

      {/* ============ NEW TAB CONTENTS ============ */}
      {activeTab === "tasks" && <TaskManager token={token} cases={cases} />}
      {activeTab === "stats" && <StatsDashboard token={token} />}
      {activeTab === "comm" && (
        <CommunicationPanel token={token} cases={cases} />
      )}
      {activeTab === "search" && (
        <AdvancedSearchPanel
          token={token}
          onCaseSelect={(caseId: string) => {
            const foundCase = cases.find((c: any) => c.case_id === caseId);
            if (foundCase) {
              setSelectedCase(foundCase);
              setActiveTab("cases");
            }
          }}
        />
      )}
      {activeTab === "court-package" && (
        <CourtPackage token={token} cases={cases} />
      )}

      {message && (
        <div className="card">
          <p
            style={{
              color: message.includes("✅") ? "#10b981" : "#ef4444",
              whiteSpace: "pre-line",
            }}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
