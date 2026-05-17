// frontend/src/pages/roles/Investigator/InvestigatorView.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../shared/env";
import { TaskManager } from "./components/TaskManager";
import { StatsDashboard } from "./components/StatsDashboard";
import { CommunicationPanel } from "./components/CommunicationPanel";
import { AdvancedSearchPanel } from "./components/AdvancedSearchPanel";
import { CourtPackage } from "./components/CourtPackage";
import { SharedReportsView } from "./components/SharedReportsView";
import { CaseTimeline } from "../../../shared/components/CaseTimeline";
import { InvestigatorHearings } from "./components/InvestigatorHearings";
import { FeedbackPanel } from "./components/FeedbackPanel";

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
  cloudinary_url?: string;
};

type EvidenceResponse = {
  evidence_id: string;
  hash: string;
  cloudinary_url: string;
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
  cloudinary_url: string;
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
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [selectedCaseForEvidence, setSelectedCaseForEvidence] =
    useState<any>(null);
  const [selectedTimelineCase, setSelectedTimelineCase] = useState<any>(null);
  // FIR Details Modal State
  const [showFirDetailModal, setShowFirDetailModal] = useState(false);
  const [selectedFirDetail, setSelectedFirDetail] = useState<any>(null);

  // Document Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingDocument, setReviewingDocument] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<"ACCEPT" | "REJECT">(
    "ACCEPT",
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Sidebar navigation items (Logical order - Real world investigation workflow)
  const navItems = [
    { id: "overview", label: "Dashboard", icon: "📊", badge: null },
    {
      id: "pending",
      label: "Pending FIRs",
      icon: "📋",
      badge: pendingFirs.length,
    },
    {
      id: "accepted",
      label: "Active FIRs",
      icon: "✅",
      badge: acceptedFirs.length,
    },
    { id: "cases", label: "My Cases", icon: "⚖️", badge: cases.length },
    { id: "evidence", label: "Evidence", icon: "📦", badge: evidence.length },
    { id: "upload", label: "Upload Evidence", icon: "📤", badge: null },
    { id: "verify", label: "Verify Evidence", icon: "🔐", badge: null },
    { id: "suspects", label: "Suspects", icon: "👤", badge: null },
    { id: "witnesses", label: "Witnesses", icon: "👥", badge: null },
    { id: "tasks", label: "Task Manager", icon: "✅", badge: null },
    { id: "hearings", label: "Hearings", icon: "🎙️", badge: null },
    { id: "stats", label: "Statistics", icon: "📊", badge: null },
    { id: "comm", label: "Communication", icon: "💬", badge: null },
    { id: "search", label: "Advanced Search", icon: "🔍", badge: null },
    { id: "court-package", label: "Court Package", icon: "📦", badge: null },
    { id: "transfer", label: "Submit to Court", icon: "📤", badge: null },
    { id: "forensic", label: "Submit to Forensic", icon: "🔬", badge: null },
    { id: "create", label: "Create Case", icon: "➕", badge: null },
    { id: "shared-reports", label: "Shared Reports", icon: "📄", badge: null },
    { id: "feedback", label: "User Feedback", icon: "📝", badge: null },
    {
      id: "pending-docs",
      label: "Pending Documents",
      icon: "📄",
      badge: pendingDocuments.length,
    },
    { id: "timeline", label: "Case Timeline", icon: "📅", badge: null },
  ];

  // Mobile bottom navigation (Top 5 important tabs)
  const mobileNavItems = [
    { id: "overview", label: "Home", icon: "🏠" },
    { id: "pending", label: "Pending", icon: "📋" },
    { id: "cases", label: "Cases", icon: "⚖️" },
    { id: "evidence", label: "Evidence", icon: "📦" },
    { id: "upload", label: "Upload", icon: "📤" },
    { id: "timeline", label: "Timeline", icon: "📅" },
    { id: "hearings", label: "Hearings", icon: "🎙️" },
  ];

  useEffect(() => {
    loadPendingFirs();
    loadAcceptedFirs();
    loadPendingDocuments();
  }, []);

  useEffect(() => {
    if (pendingFirs.length > previousPendingCount && previousPendingCount > 0) {
      const newCount = pendingFirs.length - previousPendingCount;
      setNewFirNotification(`🔔 ${newCount} new FIR(s) received!`);
      showToast(`🔔 ${newCount} new FIR(s)!`, "info");
      setTimeout(() => {
        setNewFirNotification(null);
      }, 8000);
    }
    setPreviousPendingCount(pendingFirs.length);
  }, [pendingFirs.length]);

  useEffect(() => {
    loadPendingFirs();
    loadAcceptedFirs();
  }, [onRefresh]);

  useEffect(() => {
    if (activeTab === "transfer" || activeTab === "forensic") {
      loadUsers();
    }
  }, [activeTab]);

  async function loadUsers() {
    try {
      const [court, forensic] = await Promise.all([
        apiRequest<User[]>("/admin/users/by-role/COURT", { token }),
        apiRequest<User[]>("/admin/users/by-role/FORENSIC_ANALYST/public", {
          token,
        }),
      ]);
      setCourtUsers(court);
      setForensicUsers(forensic);
      console.log("Forensic users loaded:", forensic);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }

  async function loadPendingDocuments() {
    try {
      // Get all evidence for this investigator
      const allEvidence = await apiRequest<any[]>(
        "/cases/evidence/investigator",
        { token },
      );
      console.log("All evidence:", allEvidence);

      // Filter for PENDING_REVIEW and USER_DOCUMENT source
      const pending = allEvidence.filter((e) => {
        const isPending = e.status === "PENDING_REVIEW";
        const isUserDoc = e.source === "USER_DOCUMENT";
        console.log(
          `Evidence ${e.evidence_id}: status=${e.status}, source=${e.source}, pending=${isPending}, userDoc=${isUserDoc}`,
        );
        return isPending && isUserDoc;
      });

      console.log("Pending documents found:", pending.length);
      setPendingDocuments(pending);
    } catch (err) {
      console.error("Error loading pending documents:", err);
    }
  }

  async function reviewDocument(
    evidenceId: string,
    action: string,
    notes: string,
  ) {
    try {
      // Send as query parameters, not in body
      await apiRequest(
        `/documents/review-document-evidence/${evidenceId}?action=${action}&review_notes=${encodeURIComponent(notes)}`,
        {
          method: "POST",
          token,
          // No body - parameters are in URL
        },
      );
      showToast(`Document ${action.toLowerCase()}ed successfully`, "success");
      loadPendingDocuments();
      onRefresh();
    } catch (err) {
      console.error("Review error:", err);
      showToast(
        "Review failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
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

  async function viewFirDetails(firId: string) {
    setLoading(true);
    try {
      const response = await apiRequest<{ fir: any }>(
        `/admin/fir-details/${firId}`,
        { token },
      );
      setSelectedFirDetail(response.fir);
      setShowFirDetailModal(true);
    } catch (err) {
      showToast("❌ Failed to load FIR details", "error");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport(caseId: string) {
    setLoading(true);
    try {
      const report = await apiRequest<InvestigationReport>(
        `/cases/generate-report/${caseId}`,
        { token },
      );

      // Also fetch suspects, witnesses, evidence details
      const caseData = cases.find((c: any) => c.case_id === caseId);
      if (caseData) {
        const suspects = caseData.suspects || [];
        const witnesses = caseData.witnesses || [];
        const evidenceList = caseData.evidence || [];

        // Enrich report with complete data
        report.suspects = suspects;
        report.witnesses = witnesses;
        report.evidence = evidenceList.map((evId: string) => {
          const found = evidence.find((e: any) => e.evidence_id === evId);
          return (
            found || { evidence_id: evId, title: "Unknown", status: "UNKNOWN" }
          );
        });
      }

      setInvestigationReport(report);
      setActiveTab("report");
      setSidebarOpen(false);
    } catch (err) {
      showToast("Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  }

  async function submitToCourt(caseId: string) {
    if (!selectedCourtEmail) {
      showToast("❌ Please select a court officer");
      return;
    }
    setLoading(true);
    try {
      await apiRequest(`/cases/submit-to-court/${caseId}`, {
        method: "POST",
        token,
        body: { court_email: selectedCourtEmail },
      });
      showToast(`✅ Case submitted to ${selectedCourtEmail}`);
      onRefresh();
    } catch (err) {
      showToast("❌ Submission failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function submitToForensic(evidenceId: string) {
    if (!selectedForensicEmail) {
      showToast("❌ Please select a forensic analyst", "error");
      return;
    }
    setLoading(true);
    try {
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

      showToast(`✅ Evidence submitted to ${selectedForensicEmail}`);
      onRefresh();
    } catch (err) {
      showToast(
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
        cloudinary_url: result.cloudinary_url,
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
        {
          method: "PUT",
          token,
          body: { status, remarks },
        },
      );
      await loadPendingFirs();
      await loadAcceptedFirs();
      await onRefresh();
      showToast(`✅ FIR ${status}!`, "success");
    } catch (err) {
      showToast("❌ Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  }

  async function createCase() {
    if (!caseFirId || !caseTitle) {
      showToast("❌ Please fill FIR ID and Case Title", "error");
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
      showToast("✅ Case created successfully!", "success");
      setCaseFirId("");
      setCaseTitle("");
      setCaseDescription("");
      onRefresh();
      loadAcceptedFirs();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create case",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast("❌ File too large! Max 50MB", "error");
      return;
    }
    setSelectedFile(file);
    showToast(
      `✅ Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    );
  }

  async function uploadAndAddEvidence() {
    if (!selectedCase) {
      showToast("❌ Please select a case first");
      return;
    }
    if (!evidenceTitle) {
      showToast("❌ Please enter evidence title");
      return;
    }
    if (!selectedFile) {
      showToast("❌ Please select a file to upload", "error");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      showToast("📤 Uploading to Cloudinary...");

      // Upload to Cloudinary via backend
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", evidenceTitle);
      formData.append("description", evidenceDescription || "");
      formData.append("case_id", selectedCase.case_id);

      const uploadResponse = await fetch(
        `${API_BASE_URL}/cases/evidence/upload-file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.detail || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Save evidence to database
      const response = await apiRequest<EvidenceResponse>("/cases/evidence", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          title: evidenceTitle,
          description: evidenceDescription,
          cloudinary_url: uploadResult.cloudinary_url,
          file_hash: uploadResult.hash,
        },
      });

      setEvidenceTitle("");
      setEvidenceDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await onRefresh();
      showToast(`✅ Evidence added!`, "success");
      console.log("Evidence details:", {
        evidence_id: response.evidence_id,
        hash: uploadResult.hash,
        url: uploadResult.cloudinary_url,
      });
    } catch (err) {
      console.error("Upload error:", err);
      showToast(
        "❌ Upload failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function selectEvidenceForVerification(
    evidenceId: string,
    hash: string,
    cloudinaryUrl: string,
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
            cloudinary_url: cloudinaryUrl,
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
    setSidebarOpen(false);
  }

  async function addSuspect() {
    if (!selectedCase || !suspectName) {
      showToast("❌ Please select case and enter suspect name", "error");
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
      showToast("✅ Suspect added successfully!");
      setSuspectName("");
      setSuspectDetails("");

      // ============ REFRESH THE SELECTED CASE DATA ============
      const updatedCase = await apiRequest<any>(
        `/cases/${selectedCase.case_id}`,
        { token },
      );
      setSelectedCase(updatedCase);
      // ============ END REFRESH ============

      onRefresh(); // Also refresh parent data
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add suspect",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addWitness() {
    if (!selectedCase || !witnessName) {
      showToast("❌ Please select case and enter witness name", "error");
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
      showToast("✅ Witness added successfully!");
      setWitnessName("");
      setWitnessDetails("");

      // ============ REFRESH THE SELECTED CASE DATA ============
      const updatedCase = await apiRequest<any>(
        `/cases/${selectedCase.case_id}`,
        { token },
      );
      setSelectedCase(updatedCase);
      // ============ END REFRESH ============

      onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add witness",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  function viewEvidenceOnCloudinary(url: string) {
    if (url) {
      window.open(url, "_blank");
    } else {
      showToast("❌ No Cloudinary URL available for this evidence", "error");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      SUBMITTED: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      UNDER_REVIEW: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
      ACCEPTED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
      REJECTED: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
      UNDER_INVESTIGATION: { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" },
      COLLECTED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
      TRANSFERRED_TO_FORENSIC: {
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#f59e0b",
      },
      SUBMITTED_TO_COURT: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
      DECIDED: { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280" },
      PENDING: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      IN_PROGRESS: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
      COMPLETED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    };
    const style = colors[status] || {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
    };
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
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

      showToast(`✅ Report downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      showToast(
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

  return (
    <div className="investigator-dashboard">
      {/* Background Effects */}
      <div className="dashboard-bg" />
      <div className="dashboard-grid" />
      <div className="dashboard-aura dashboard-aura-1" />
      <div className="dashboard-aura dashboard-aura-2" />
      <div className="dashboard-aura dashboard-aura-3" />

      {/* New FIR Notification */}
      {newFirNotification && (
        <div className="dashboard-notification">
          <span className="notification-icon">🔔</span>
          <div className="notification-content">
            <strong>{newFirNotification}</strong>
            <p>Go to Pending FIRs tab to review and accept.</p>
          </div>
          <button
            className="notification-btn"
            onClick={() => setActiveTab("pending")}
          >
            View Now →
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-left">
          <div className="dashboard-logo">
            <div className="dashboard-logo-mark">🔍</div>
            <span className="dashboard-logo-text">Investigator Portal</span>
          </div>
        </div>
        <div className="dashboard-nav-right">
          <button onClick={onRefresh} className="dashboard-refresh-btn">
            ⟳ Refresh
          </button>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div className="dashboard-main-layout">
        {/* Left Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="dashboard-sidebar-header">
            <div className="dashboard-user-info">
              <div className="dashboard-user-avatar">👮</div>
              <div className="dashboard-user-details">
                <span className="dashboard-user-name">Investigator</span>
                <span className="dashboard-user-role">Law Enforcement</span>
              </div>
            </div>
          </div>

          <nav className="dashboard-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`dashboard-sidebar-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="dashboard-sidebar-footer">
            <div className="dashboard-sidebar-tip">
              <span>💡</span>
              <span>
                Evidence is stored on Cloudinary - Secure Cloud Storage with
                Verification Hashes
              </span>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="dashboard-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {/* Mobile Bottom Navigation Bar */}
          <div className="mobile-bottom-nav">
            <div className="mobile-bottom-nav-container">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="mobile-nav-icon">{item.icon}</span>
                  <span className="mobile-nav-label">{item.label}</span>
                </button>
              ))}
              <button
                className="mobile-nav-item more-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="mobile-nav-icon">📋</span>
                <span className="mobile-nav-label">More</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">⚖️</div>
              <div className="stat-value">{totalCases}</div>
              <div className="stat-label">Total Cases</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{totalEvidence}</div>
              <div className="stat-label">Evidence Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{pendingEvidence}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔬</div>
              <div className="stat-value">{inProgressEvidence}</div>
              <div className="stat-label">In Forensic</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{completedEvidence}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          {/* Message Toast - IMPROVED POSITIONING */}
          {toastMessage && (
            <div className={`dashboard-toast toast-${toastMessage.type}`}>
              <div className="toast-inner">
                <span className="toast-icon">
                  {toastMessage.type === "success" && "✅"}
                  {toastMessage.type === "error" && "❌"}
                  {toastMessage.type === "info" && "ℹ️"}
                </span>
                <span className="toast-text">{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <div className="dashboard-welcome">
                <h1>
                  Investigation <span>Dashboard</span>
                </h1>
                <p>Manage cases, evidence, and track investigation progress</p>
              </div>
              <div className="dashboard-header-stats">
                <div className="header-stat">
                  <span className="header-stat-value">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="header-stat-label">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============ TAB CONTENTS ============ */}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📊 Recent Activity</h2>
              </div>
              <div className="cards-grid">
                <div className="info-card">
                  <h3>📋 Recent Cases</h3>
                  {cases.length === 0 ? (
                    <div className="empty-state">No cases yet.</div>
                  ) : (
                    cases.slice(0, 5).map((c: any) => (
                      <div key={c.case_id} className="list-item">
                        <div>
                          <strong>{c.case_number}</strong>
                          <br />
                          <small>{c.title}</small>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>
                    ))
                  )}
                </div>
                <div className="info-card">
                  <h3>📦 Recent Evidence</h3>
                  {evidence.length === 0 ? (
                    <div className="empty-state">No evidence yet.</div>
                  ) : (
                    evidence.slice(0, 5).map((e: any) => (
                      <div key={e.evidence_id} className="list-item">
                        <div>
                          <strong>{e.title}</strong>
                          <br />
                          <small>
                            Cloudinary: {e.cloudinary_url?.substring(0, 30)}...
                          </small>
                        </div>
                        {getStatusBadge(e.status)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "shared-reports" && (
            <SharedReportsView token={token!} />
          )}

          {activeTab === "feedback" && (
            <FeedbackPanel token={token} cases={cases} />
          )}

          {activeTab === "pending" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>
                  📋 Pending FIRs {pendingCount > 0 && `(${pendingCount})`}
                </h2>
                <p>Review and accept new complaints</p>
              </div>
              {pendingFirs.length === 0 ? (
                <div className="empty-state-large">
                  <div className="empty-icon">✅</div>
                  <p>No pending FIRs to review.</p>
                </div>
              ) : (
                <div className="cards-list">
                  {pendingFirs.map((fir) => (
                    <div key={fir.fir_id} className="fir-card">
                      <div className="fir-header">
                        <div className="fir-info">
                          <span className="fir-number">{fir.fir_number}</span>
                          {getStatusBadge(fir.status)}
                        </div>
                        <span className="fir-date">
                          {new Date(fir.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="fir-title">{fir.incident_title}</h4>
                      <div className="fir-details">
                        <p>
                          <strong>👤 Complainant:</strong>{" "}
                          {fir.complainant_name} ({fir.complainant_contact})
                        </p>
                        <p>
                          <strong>📍 Location:</strong> {fir.incident_location}
                        </p>
                        <p>
                          <strong>📝 Description:</strong>{" "}
                          {fir.incident_description?.substring(0, 100)}...
                        </p>
                      </div>

                      {/* ============ NEW: VIEW DETAILS BUTTON ============ */}
                      <div className="fir-actions">
                        <button
                          className="btn btn-info"
                          onClick={() => viewFirDetails(fir.fir_id)}
                          style={{ background: "#3b82f6", color: "white" }}
                        >
                          👁️ View Full Details
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            updateFIRStatus(fir.fir_id, "ACCEPTED")
                          }
                        >
                          ✅ Accept FIR
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            updateFIRStatus(fir.fir_id, "UNDER_REVIEW")
                          }
                        >
                          🔍 Under Review
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            const r = prompt("Enter reason:");
                            if (r) updateFIRStatus(fir.fir_id, "REJECTED", r);
                          }}
                        >
                          ❌ Reject FIR
                        </button>
                      </div>
                      {/* ============ END NEW BUTTON ============ */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accepted FIRs Tab */}
          {activeTab === "accepted" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>✅ Active FIRs ({acceptedCount})</h2>
                <p>Accepted complaints under investigation</p>
              </div>
              {acceptedFirs.length === 0 ? (
                <div className="empty-state-large">
                  <div className="empty-icon">📭</div>
                  <p>No active FIRs yet.</p>
                </div>
              ) : (
                <div className="cards-list">
                  {acceptedFirs.map((fir) => (
                    <div key={fir.fir_id} className="fir-card accepted">
                      <div className="fir-header">
                        <div className="fir-info">
                          <span className="fir-number">{fir.fir_number}</span>
                          {getStatusBadge(fir.status)}
                        </div>
                        <span className="fir-date">
                          {new Date(fir.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="fir-title">{fir.incident_title}</h4>
                      <div className="fir-details">
                        <p>
                          <strong>👤 Complainant:</strong>{" "}
                          {fir.complainant_name}
                        </p>
                        <p>
                          <strong>📍 Location:</strong> {fir.incident_location}
                        </p>
                        {fir.case_id && (
                          <p>
                            <strong>📋 Case Created:</strong> {fir.case_number}
                          </p>
                        )}
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => viewFirDetails(fir.fir_id)}
                      >
                        View Full Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FIR Details View */}
          {activeTab === "firDetails" && selectedFirDetails && (
            <div className="dashboard-content-section fade-up">
              <button
                className="back-btn"
                onClick={() => setActiveTab("accepted")}
              >
                ← Back
              </button>
              <div className="details-card">
                <h2>📋 Complete FIR Details</h2>

                <div className="details-section">
                  <h3>FIR Information</h3>
                  <div className="details-grid">
                    <div>
                      <strong>FIR Number:</strong>{" "}
                      {selectedFirDetails.fir_number}
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

                <div className="details-section">
                  <h3>👤 Complainant Details</h3>
                  <div className="details-grid">
                    <div>
                      <strong>Name:</strong>{" "}
                      {selectedFirDetails.complainant_name}
                    </div>
                    <div>
                      <strong>Contact:</strong>{" "}
                      {selectedFirDetails.complainant_contact}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {selectedFirDetails.complainant_email}
                    </div>
                    <div>
                      <strong>Address:</strong>{" "}
                      {selectedFirDetails.complainant_address}
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>📌 Incident Details</h3>
                  <div>
                    <strong>Title:</strong> {selectedFirDetails.incident_title}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {selectedFirDetails.incident_description}
                  </div>
                  <div>
                    <strong>Location:</strong>{" "}
                    {selectedFirDetails.incident_location}
                  </div>
                  <div>
                    <strong>Date & Time:</strong>{" "}
                    {new Date(
                      selectedFirDetails.incident_datetime,
                    ).toLocaleString()}
                  </div>
                </div>

                {selectedFirDetails.status_history &&
                  selectedFirDetails.status_history.length > 0 && (
                    <div className="details-section">
                      <h3>📜 Status History</h3>
                      {selectedFirDetails.status_history.map((history, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div>
                            <strong>{history.status.replace(/_/g, " ")}</strong>{" "}
                            - {new Date(history.timestamp).toLocaleString()}
                            <div className="timeline-remarks">
                              {history.remarks}
                            </div>
                            <div className="timeline-by">
                              By: {history.changed_by}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Cases Tab */}
          {activeTab === "cases" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>⚖️ My Cases</h2>
              </div>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="🔍 Search by case number or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="UNDER_INVESTIGATION">
                    Under Investigation
                  </option>
                  <option value="SUBMITTED_TO_COURT">Submitted to Court</option>
                  <option value="DECIDED">Decided</option>
                </select>
              </div>
              <div className="cards-list">
                {filteredCases.map((c: any) => (
                  <div key={c.case_id} className="case-card">
                    <div className="case-header">
                      <strong>{c.case_number}</strong>
                      {getStatusBadge(c.status)}
                    </div>
                    <h4>{c.title}</h4>
                    <p>{c.description?.substring(0, 100)}...</p>
                    <div className="case-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => viewFirDetails(c.fir_id)}
                      >
                        View FIR Details
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => generateReport(c.case_id)}
                      >
                        Generate Report
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedCase(c);
                          setActiveTab("upload");
                        }}
                      >
                        Add Evidence
                      </button>
                      {c.status !== "SUBMITTED_TO_COURT" &&
                        c.status !== "DECIDED" && (
                          <button
                            className="btn btn-warning"
                            onClick={() => {
                              setSelectedCase(c);
                              setActiveTab("transfer");
                            }}
                          >
                            Submit to Court
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📅 Case Timeline</h2>
                <p>Complete chronological history of the case</p>
              </div>

              <div className="form-card" style={{ marginBottom: "24px" }}>
                <div className="form-group">
                  <label>Select Case to View Timeline</label>
                  <select
                    value={selectedTimelineCase?.case_id || ""}
                    onChange={(e) => {
                      const foundCase = cases.find(
                        (c: any) => c.case_id === e.target.value,
                      );
                      setSelectedTimelineCase(foundCase);
                    }}
                    className="evidence-case-select"
                  >
                    <option value="">-- Select Case --</option>
                    {cases.map((c: any) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTimelineCase && (
                <CaseTimeline
                  token={token}
                  caseId={selectedTimelineCase.case_id}
                />
              )}

              {!selectedTimelineCase && (
                <div className="empty-state-large">
                  <div className="empty-icon">📅</div>
                  <p>Select a case to view its complete timeline</p>
                </div>
              )}
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === "evidence" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📦 Evidence Management</h2>
                <p>Select a case to view its evidence</p>
              </div>

              {/* Step 1: Select Case */}
              <div className="form-card" style={{ marginBottom: "24px" }}>
                <div className="form-group">
                  <label>📁 Select Case *</label>
                  <select
                    value={selectedCaseForEvidence?.case_id || ""}
                    onChange={(e) => {
                      const foundCase = cases.find(
                        (c: any) => c.case_id === e.target.value,
                      );
                      setSelectedCaseForEvidence(foundCase);
                    }}
                    className="evidence-case-select"
                  >
                    <option value="">
                      -- Select a case to view evidence --
                    </option>
                    {cases.map((c: any) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_number} - {c.title} ({c.evidence?.length || 0}{" "}
                        evidence items)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Show Evidence of Selected Case */}
              {selectedCaseForEvidence && (
                <>
                  <div className="evidence-case-info">
                    <div className="evidence-case-badge">
                      <span className="evidence-case-number">
                        {selectedCaseForEvidence.case_number}
                      </span>
                      <span className="evidence-case-status">
                        {getStatusBadge(selectedCaseForEvidence.status)}
                      </span>
                    </div>
                    <p className="evidence-case-title">
                      {selectedCaseForEvidence.title}
                    </p>
                  </div>

                  {(() => {
                    // Get evidence IDs from selected case
                    const evidenceIds = selectedCaseForEvidence.evidence || [];
                    const caseEvidence = evidence.filter((e: any) =>
                      evidenceIds.includes(e.evidence_id),
                    );

                    if (caseEvidence.length === 0) {
                      return (
                        <div className="empty-state-large">
                          <div className="empty-icon">📭</div>
                          <p>No evidence found for this case.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>EVIDENCE</th>
                              <th>TITLE</th>
                              <th>CLOUDINARY URL</th>
                              <th>STATUS</th>
                              <th>VERIFIED</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {caseEvidence.map((e: any) => (
                              <tr key={e.evidence_id}>
                                <td>
                                  <strong>{e.title}</strong>
                                  <br />
                                  <small>
                                    {e.description?.substring(0, 50)}
                                  </small>
                                </td>
                                <td>{e.evidence_id?.substring(0, 8)}...</td>
                                <td>
                                  <code>
                                    {e.cloudinary_url?.substring(0, 30)}...
                                  </code>
                                </td>
                                <td>{getStatusBadge(e.status)}</td>
                                <td>
                                  {e.verifications?.length > 0 ? (
                                    e.verifications[e.verifications.length - 1]
                                      .result ? (
                                      <span style={{ color: "#10b981" }}>
                                        ✅ Verified
                                      </span>
                                    ) : (
                                      <span style={{ color: "#ef4444" }}>
                                        ❌ Tampered
                                      </span>
                                    )
                                  ) : (
                                    <span style={{ color: "#f59e0b" }}>
                                      ⏳ Pending
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div className="action-btns">
                                    <button
                                      className="icon-btn"
                                      onClick={() =>
                                        viewEvidenceOnCloudinary(
                                          e.cloudinary_url,
                                        )
                                      }
                                      title="View"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      className="icon-btn"
                                      onClick={() =>
                                        selectEvidenceForVerification(
                                          e.evidence_id,
                                          e.hash,
                                          e.cloudinary_url,
                                        )
                                      }
                                      title="Verify"
                                    >
                                      🔐
                                    </button>
                                    {e.status !== "TRANSFERRED_TO_FORENSIC" &&
                                      e.status !== "SUBMITTED_TO_FORENSIC" && (
                                        <button
                                          className="icon-btn"
                                          onClick={() => {
                                            setSelectedEvidenceForTransfer(e);
                                            setActiveTab("forensic");
                                          }}
                                          title="Send to Forensic"
                                        >
                                          🔬
                                        </button>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
          {activeTab === "hearings" && <InvestigatorHearings token={token} />}
          {/* Upload Evidence Tab */}
          {activeTab === "upload" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📤 Upload Evidence to Cloudinary</h2>
                <p>
                  Evidence is stored on Cloudinary - Secure Cloud Storage with
                  Verification Hashes
                </p>
              </div>
              <div className="form-card">
                <div className="form-group">
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
                </div>
                <div className="form-group">
                  <label>Evidence Title *</label>
                  <input
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    placeholder="e.g., CCTV Footage"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Select File *</label>
                  <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <div className="upload-icon">📁</div>
                    <p>
                      {selectedFile ? selectedFile.name : "Click to upload"}
                    </p>
                  </div>
                </div>
                {isUploading && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <button
                  className="btn btn-success"
                  onClick={uploadAndAddEvidence}
                  disabled={
                    isUploading ||
                    !selectedCase ||
                    !evidenceTitle ||
                    !selectedFile
                  }
                >
                  {isUploading ? "Uploading..." : "Upload to Cloudinary"}
                </button>
              </div>
            </div>
          )}

          {/* Verify Evidence Tab */}
          {activeTab === "verify" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>🔐 Verify Evidence Authenticity</h2>
              </div>
              <div className="form-card">
                <div className="form-group">
                  <label>📁 Step 1: Select Case</label>
                  <select
                    value={selectedCaseForVerify?.case_id || ""}
                    onChange={(e) => handleCaseSelectForVerify(e.target.value)}
                  >
                    <option value="">-- Select a case --</option>
                    {cases.map((c: any) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCaseForVerify && (
                  <div className="form-group">
                    <label>📋 Step 2: Select Evidence</label>
                    {isLoadingEvidence ? (
                      <p>Loading evidence...</p>
                    ) : caseEvidenceList.length === 0 ? (
                      <p className="warning-text">
                        ⚠️ No evidence found for this case.
                      </p>
                    ) : (
                      <select
                        value={selectedEvidenceForVerify?.evidence_id || ""}
                        onChange={(e) => handleEvidenceSelect(e.target.value)}
                      >
                        <option value="">-- Select evidence --</option>
                        {caseEvidenceList.map((e: CaseEvidence) => (
                          <option key={e.evidence_id} value={e.evidence_id}>
                            {e.title} - {e.status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedEvidenceForVerify && (
                  <>
                    <div className="verify-box">
                      <h3>📂 Step 3: Upload Original File</h3>
                      <div
                        className="upload-area"
                        onClick={() => verifyFileInputRef.current?.click()}
                      >
                        <input
                          ref={verifyFileInputRef}
                          type="file"
                          onChange={handleVerifyFileSelect}
                          style={{ display: "none" }}
                        />
                        <div className="upload-icon">📄</div>
                        <p>
                          {selectedFileForVerify
                            ? `Selected: ${selectedFileForVerify.name}`
                            : "Click to select file"}
                        </p>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={verifyEvidenceByFile}
                        disabled={
                          isUploadingForVerify || !selectedFileForVerify
                        }
                      >
                        {isUploadingForVerify ? "Verifying..." : "Verify File"}
                      </button>
                    </div>

                    <div className="evidence-details">
                      <strong>📋 Evidence Details:</strong>
                      <p>
                        <strong>ID:</strong>{" "}
                        <code>{selectedEvidenceForVerify.evidence_id}</code>
                      </p>
                      <p>
                        <strong>Title:</strong>{" "}
                        {selectedEvidenceForVerify.title}
                      </p>
                      <p>
                        <strong>Cloudinary URL:</strong>{" "}
                        <code>
                          {selectedEvidenceForVerify.cloudinary_url?.substring(
                            0,
                            50,
                          )}
                          ...
                        </code>
                      </p>
                      <p>
                        <strong>Stored Hash:</strong>{" "}
                        <code>{selectedEvidenceForVerify.hash}</code>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {verifyResult && (
                <div
                  className={`verify-result ${verifyResult.verified ? "success" : "error"}`}
                >
                  <span className="result-icon">
                    {verifyResult.verified ? "✅" : "❌"}
                  </span>
                  <div>
                    <h3>
                      {verifyResult.verified
                        ? "VERIFICATION PASSED!"
                        : "VERIFICATION FAILED!"}
                    </h3>
                    <p>{verifyResult.message}</p>
                    {verifyResult.uploaded_file_name && (
                      <p>Verified File: {verifyResult.uploaded_file_name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suspects Tab */}
          {activeTab === "suspects" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>👤 Suspect Management</h2>
              </div>
              <div className="form-card">
                <h3>Add Suspect</h3>
                <div className="form-group">
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
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={suspectName}
                    onChange={(e) => setSuspectName(e.target.value)}
                    placeholder="Suspect full name"
                  />
                </div>
                <div className="form-group">
                  <label>Details / Description</label>
                  <textarea
                    value={suspectDetails}
                    onChange={(e) => setSuspectDetails(e.target.value)}
                    rows={3}
                    placeholder="Any known information about the suspect"
                  />
                </div>
                <button
                  className="btn btn-warning"
                  onClick={addSuspect}
                  disabled={loading}
                >
                  Add Suspect
                </button>
              </div>
              <div className="info-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>Existing Suspects</h3>
                  <button
                    className="refresh-suspects-btn"
                    onClick={async () => {
                      if (selectedCase) {
                        const updated = await apiRequest<any>(
                          `/cases/${selectedCase.case_id}`,
                          { token },
                        );
                        setSelectedCase(updated);
                        showToast("Suspect list refreshed", "success");
                      }
                    }}
                  >
                    ⟳ Refresh
                  </button>
                </div>
                {selectedCase?.suspects?.length > 0 ? (
                  selectedCase.suspects.map((s: any, idx: number) => (
                    <div key={idx} className="list-item">
                      <strong>{s.name}</strong> - {s.description}
                      <br />
                      <small>
                        Added: {new Date(s.added_at).toLocaleDateString()}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No suspects added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Witnesses Tab */}
          {activeTab === "witnesses" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>👥 Witness Management</h2>
              </div>
              <div className="form-card">
                <h3>Add Witness</h3>
                <div className="form-group">
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
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    placeholder="Witness full name"
                  />
                </div>
                <div className="form-group">
                  <label>Statement</label>
                  <textarea
                    value={witnessDetails}
                    onChange={(e) => setWitnessDetails(e.target.value)}
                    rows={3}
                    placeholder="Witness statement"
                  />
                </div>
                <button
                  className="btn btn-success"
                  onClick={addWitness}
                  disabled={loading}
                >
                  Add Witness
                </button>
              </div>
              <div className="info-card">
                <h3>Existing Witnesses</h3>
                {selectedCase?.witnesses?.length > 0 ? (
                  selectedCase.witnesses.map((w: any, idx: number) => (
                    <div key={idx} className="list-item">
                      <strong>{w.name}</strong> - {w.statement}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No witnesses added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "report" && investigationReport && (
            <div className="dashboard-content-section fade-up">
              <button
                className="back-btn"
                onClick={() => setActiveTab("reports")}
              >
                ← Back to Reports
              </button>
              <div className="report-view">
                <div className="report-header">
                  <h1>🔍 INVESTIGATION REPORT</h1>
                  <p>Report ID: {investigationReport.report_id}</p>
                  <p>
                    Generated:{" "}
                    {new Date(
                      investigationReport.generated_at,
                    ).toLocaleString()}
                  </p>
                  <p>Generated By: {investigationReport.generated_by}</p>
                </div>

                {/* Case Details */}
                <div className="report-section">
                  <h2>📋 CASE DETAILS</h2>
                  <div className="details-grid">
                    <div>
                      <strong>Case Number:</strong>{" "}
                      {investigationReport.case_details.case_number}
                    </div>
                    <div>
                      <strong>Case ID:</strong>{" "}
                      {investigationReport.case_details.case_id}
                    </div>
                    <div>
                      <strong>Title:</strong>{" "}
                      {investigationReport.case_details.title}
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
                      <strong>Created:</strong>{" "}
                      {new Date(
                        investigationReport.case_details.created_at,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* FIR Details */}
                {investigationReport.fir_details && (
                  <div className="report-section">
                    <h2>📝 FIR DETAILS</h2>
                    <div className="details-grid">
                      <div>
                        <strong>FIR Number:</strong>{" "}
                        {investigationReport.fir_details.fir_number}
                      </div>
                      <div>
                        <strong>Complainant Name:</strong>{" "}
                        {investigationReport.fir_details.complainant_name}
                      </div>
                      <div>
                        <strong>Complainant Contact:</strong>{" "}
                        {investigationReport.fir_details.complainant_contact}
                      </div>
                      <div>
                        <strong>Incident Title:</strong>{" "}
                        {investigationReport.fir_details.incident_title}
                      </div>
                      <div>
                        <strong>Incident Location:</strong>{" "}
                        {investigationReport.fir_details.incident_location}
                      </div>
                      <div>
                        <strong>Incident Date:</strong>{" "}
                        {investigationReport.fir_details.incident_datetime
                          ? new Date(
                              investigationReport.fir_details.incident_datetime,
                            ).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <strong>Description:</strong>{" "}
                      {investigationReport.fir_details.incident_description}
                    </div>
                  </div>
                )}

                {/* Suspects Section */}
                <div className="report-section">
                  <h2>👤 SUSPECTS IDENTIFIED</h2>
                  {investigationReport.suspects &&
                  investigationReport.suspects.length > 0 ? (
                    <div className="data-table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Father's Name</th>
                            <th>CNIC</th>
                            <th>Address</th>
                            <th>Description</th>
                            <th>Added On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investigationReport.suspects.map(
                            (s: any, idx: number) => (
                              <tr key={idx}>
                                <td>{s.name || "N/A"}</td>
                                <td>{s.father_name || "N/A"}</td>
                                <td>{s.cnic || "N/A"}</td>
                                <td>{s.address || "N/A"}</td>
                                <td>{s.description || "N/A"}</td>
                                <td>
                                  {s.added_at
                                    ? new Date(s.added_at).toLocaleDateString()
                                    : "N/A"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-state">No suspects identified yet.</p>
                  )}
                </div>

                {/* Witnesses Section */}
                <div className="report-section">
                  <h2>👥 WITNESSES</h2>
                  {investigationReport.witnesses &&
                  investigationReport.witnesses.length > 0 ? (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Address</th>
                            <th>Statement</th>
                            <th>Added On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investigationReport.witnesses.map(
                            (w: any, idx: number) => (
                              <tr key={idx}>
                                <td>{w.name || "N/A"}</td>
                                <td>{w.contact || "N/A"}</td>
                                <td>{w.address || "N/A"}</td>
                                <td>{w.statement || "N/A"}</td>
                                <td>
                                  {w.added_at
                                    ? new Date(w.added_at).toLocaleDateString()
                                    : "N/A"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-state">No witnesses recorded yet.</p>
                  )}
                </div>

                {/* Evidence Section */}
                <div className="report-section">
                  <h2>📦 EVIDENCE COLLECTED</h2>
                  {investigationReport.evidence &&
                  investigationReport.evidence.length > 0 ? (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Cloudinary URL</th>
                            <th>Status</th>
                            <th>Collected By</th>
                            <th>Collected On</th>
                            <th>Verified</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investigationReport.evidence.map(
                            (e: any, idx: number) => (
                              <tr key={idx}>
                                <td>{e.title || "N/A"}</td>
                                <td>
                                  <code>
                                    {e.cloudinary_url?.substring(0, 30)}...
                                  </code>
                                </td>
                                <td>
                                  {getStatusBadge(e.status || "COLLECTED")}
                                </td>
                                <td>{e.created_by || "N/A"}</td>
                                <td>
                                  {e.created_at
                                    ? new Date(
                                        e.created_at,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td>
                                  {e.verifications?.length > 0
                                    ? e.verifications[
                                        e.verifications.length - 1
                                      ]?.result
                                      ? "✅ Verified"
                                      : "❌ Tampered"
                                    : "⏳ Pending"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-state">No evidence collected yet.</p>
                  )}
                </div>

                {/* Timeline */}
                {investigationReport.timeline &&
                  investigationReport.timeline.length > 0 && (
                    <div className="report-section">
                      <h2>📅 INVESTIGATION TIMELINE</h2>
                      <div className="timeline-list">
                        {investigationReport.timeline.map(
                          (item: any, idx: number) => (
                            <div key={idx} className="timeline-item">
                              <div className="timeline-dot"></div>
                              <div>
                                <strong>{item.action}</strong>
                                <div className="timeline-meta">
                                  {new Date(item.timestamp).toLocaleString()} -
                                  By: {item.by_name || item.by}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Summary Stats */}
                {investigationReport.status_summary && (
                  <div className="report-section">
                    <h2>📊 STATUS SUMMARY</h2>
                    <div className="details-grid">
                      <div>
                        <strong>Case Status:</strong>{" "}
                        {investigationReport.status_summary.case_status}
                      </div>
                      <div>
                        <strong>Evidence Collected:</strong>{" "}
                        {investigationReport.status_summary.evidence_collected}
                      </div>
                      <div>
                        <strong>Suspects Identified:</strong>{" "}
                        {investigationReport.status_summary.suspects_identified}
                      </div>
                      <div>
                        <strong>Witnesses Recorded:</strong>{" "}
                        {investigationReport.status_summary.witnesses_recorded}
                      </div>
                    </div>
                  </div>
                )}

                <div className="report-actions-bottom">
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      downloadReport(
                        investigationReport.case_details.case_id,
                        "pdf",
                      )
                    }
                  >
                    📄 Download PDF
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      downloadReport(
                        investigationReport.case_details.case_id,
                        "docx",
                      )
                    }
                  >
                    📝 Download DOCX
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      downloadReport(
                        investigationReport.case_details.case_id,
                        "txt",
                      )
                    }
                  >
                    📃 Download TXT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit to Court Tab */}
          {activeTab === "transfer" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📤 Submit Complete Case to Court</h2>
              </div>
              <div className="form-card">
                <div className="form-group">
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
                </div>
                <div className="form-group">
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
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    selectedCase && submitToCourt(selectedCase.case_id)
                  }
                  disabled={!selectedCase || !selectedCourtEmail || loading}
                >
                  📤 Submit Case to Court
                </button>
              </div>
            </div>
          )}

          {/* Submit to Forensic Tab */}
          {activeTab === "forensic" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>🔬 Submit Evidence to Forensic Analyst</h2>
                <p>Select a case first, then choose evidence to send</p>
              </div>
              <div className="form-card">
                {/* Step 1: Select Case */}
                <div className="form-group">
                  <label>📁 Step 1: Select Case *</label>
                  <select
                    value={selectedCase?.case_id || ""}
                    onChange={(e) => {
                      const foundCase = cases.find(
                        (c: any) => c.case_id === e.target.value,
                      );
                      setSelectedCase(foundCase);
                      setSelectedEvidenceForTransfer(null);
                    }}
                  >
                    <option value="">-- Select a case first --</option>
                    {cases.map((c: any) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_number} - {c.title} ({c.evidence?.length || 0}{" "}
                        evidence items)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Evidence Selection (only show if case selected) */}
                {selectedCase && (
                  <>
                    <div className="form-group">
                      <label>📋 Step 2: Select Evidence</label>
                      <div className="forensic-evidence-options">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            // Select all evidence of this case
                            const allEvidenceIds = selectedCase.evidence || [];
                            const allEvidenceObjects = evidence.filter(
                              (e: any) =>
                                allEvidenceIds.includes(e.evidence_id) &&
                                e.status !== "TRANSFERRED_TO_FORENSIC" &&
                                e.status !== "SUBMITTED_TO_FORENSIC",
                            );
                            if (allEvidenceObjects.length === 0) {
                              showToast(
                                "No eligible evidence to send",
                                "error",
                              );
                              return;
                            }
                            setSelectedEvidenceForTransfer(allEvidenceObjects);
                          }}
                        >
                          📦 Send All Evidence (
                          {selectedCase.evidence?.filter((id: string) => {
                            const ev = evidence.find(
                              (e: any) => e.evidence_id === id,
                            );
                            return (
                              ev &&
                              ev.status !== "TRANSFERRED_TO_FORENSIC" &&
                              ev.status !== "SUBMITTED_TO_FORENSIC"
                            );
                          }).length || 0}
                          )
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            // Show multi-select modal or dropdown
                            const eligibleEvidence = evidence.filter(
                              (e: any) =>
                                selectedCase.evidence?.includes(
                                  e.evidence_id,
                                ) &&
                                e.status !== "TRANSFERRED_TO_FORENSIC" &&
                                e.status !== "SUBMITTED_TO_FORENSIC",
                            );
                            if (eligibleEvidence.length === 0) {
                              showToast(
                                "No eligible evidence to send",
                                "error",
                              );
                              return;
                            }
                            // For now, just set single selection mode
                            setSelectedEvidenceForTransfer(null);
                          }}
                        >
                          ☑️ Select Specific Evidence
                        </button>
                      </div>
                    </div>

                    {/* Multi-select checkboxes for specific evidence */}
                    <div className="forensic-evidence-list">
                      {evidence
                        .filter(
                          (e: any) =>
                            selectedCase.evidence?.includes(e.evidence_id) &&
                            e.status !== "TRANSFERRED_TO_FORENSIC" &&
                            e.status !== "SUBMITTED_TO_FORENSIC",
                        )
                        .map((e: any) => (
                          <label
                            key={e.evidence_id}
                            className="forensic-evidence-checkbox"
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedEvidenceForTransfer?.some?.(
                                  (ev: any) => ev.evidence_id === e.evidence_id,
                                ) || false
                              }
                              onChange={(checkboxEvent) => {
                                if (checkboxEvent.target.checked) {
                                  setSelectedEvidenceForTransfer(
                                    (prev: any[]) => [...(prev || []), e],
                                  );
                                } else {
                                  setSelectedEvidenceForTransfer(
                                    (prev: any[]) =>
                                      (prev || []).filter(
                                        (ev: any) =>
                                          ev.evidence_id !== e.evidence_id,
                                      ),
                                  );
                                }
                              }}
                            />
                            <strong>{e.title}</strong> - Status: {e.status}
                            <br />
                            <small>
                              Cloudinary: {e.cloudinary_url?.substring(0, 30)}
                              ...
                            </small>
                          </label>
                        ))}
                    </div>

                    {/* Step 3: Select Analyst */}
                    <div className="form-group">
                      <label>🔬 Step 3: Select Forensic Analyst *</label>
                      <select
                        value={selectedForensicEmail}
                        onChange={(e) =>
                          setSelectedForensicEmail(e.target.value)
                        }
                      >
                        <option value="">-- Select Forensic Analyst --</option>
                        {forensicUsers.map((user) => (
                          <option key={user.email} value={user.email}>
                            {user.full_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Submit Button */}
                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        if (
                          !selectedEvidenceForTransfer ||
                          selectedEvidenceForTransfer.length === 0
                        ) {
                          showToast(
                            "Please select at least one evidence",
                            "error",
                          );
                          return;
                        }
                        if (!selectedForensicEmail) {
                          showToast(
                            "Please select a forensic analyst",
                            "error",
                          );
                          return;
                        }
                        // Submit each selected evidence
                        const evidenceList = Array.isArray(
                          selectedEvidenceForTransfer,
                        )
                          ? selectedEvidenceForTransfer
                          : [selectedEvidenceForTransfer];
                        Promise.all(
                          evidenceList.map((ev: any) =>
                            submitToForensic(ev.evidence_id),
                          ),
                        )
                          .then(() => {
                            showToast(
                              `${evidenceList.length} evidence(s) submitted to forensic`,
                              "success",
                            );
                            setSelectedEvidenceForTransfer(null);
                            setSelectedCase(null);
                          })
                          .catch(() =>
                            showToast("Some submissions failed", "error"),
                          );
                      }}
                      disabled={
                        !selectedEvidenceForTransfer ||
                        (Array.isArray(selectedEvidenceForTransfer) &&
                          selectedEvidenceForTransfer.length === 0) ||
                        !selectedForensicEmail ||
                        loading
                      }
                    >
                      🔬 Submit{" "}
                      {Array.isArray(selectedEvidenceForTransfer) &&
                      selectedEvidenceForTransfer.length > 0
                        ? `(${selectedEvidenceForTransfer.length})`
                        : ""}{" "}
                      Evidence to Forensic
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pending Documents Tab */}
          {activeTab === "pending-docs" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>📄 Pending Document Reviews</h2>
                <p>User-submitted documents waiting for your review</p>
              </div>
              {pendingDocuments.length === 0 ? (
                <div className="empty-state-large">
                  <div className="empty-icon">✅</div>
                  <p>No pending document reviews</p>
                </div>
              ) : (
                <div className="cards-list">
                  {pendingDocuments.map((doc) => (
                    <div key={doc.evidence_id} className="fir-card">
                      <div className="fir-header">
                        <div className="fir-info">
                          <span className="fir-number">{doc.title}</span>
                          {getStatusBadge(doc.status)}
                        </div>
                        <span className="fir-date">
                          Submitted:{" "}
                          {new Date(doc.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="fir-details">
                        <p>
                          <strong>Submitted by:</strong> {doc.created_by_name}
                        </p>
                        <p>
                          <strong>Description:</strong> {doc.description}
                        </p>
                        <p>
                          <strong>Cloudinary URL:</strong>{" "}
                          <code className="doc-cid-preview">
                            {doc.cloudinary_url?.substring(0, 50)}...
                          </code>
                        </p>
                        <p>
                          <strong>Hash:</strong>{" "}
                          <code className="doc-cid-preview">
                            {doc.hash?.substring(0, 30)}...
                          </code>
                        </p>
                      </div>
                      <div className="fir-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            setReviewingDocument(doc);
                            setReviewAction("ACCEPT");
                            setReviewNotes("");
                            setShowReviewModal(true);
                          }}
                        >
                          ✅ Accept as Evidence
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setReviewingDocument(doc);
                            setReviewAction("REJECT");
                            setReviewNotes("");
                            setShowReviewModal(true);
                          }}
                        >
                          ❌ Reject
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const url = doc.cloudinary_url;
                            if (url) {
                              window.open(url, "_blank");
                            } else {
                              showToast("No Cloudinary URL available", "error");
                            }
                          }}
                        >
                          👁️ View Document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Case Tab */}
          {activeTab === "create" && (
            <div className="dashboard-content-section fade-up">
              <div className="section-header">
                <h2>➕ Create New Case</h2>
              </div>
              <div className="form-card">
                <div className="form-group">
                  <label>FIR ID *</label>
                  <input
                    value={caseFirId}
                    onChange={(e) => setCaseFirId(e.target.value)}
                    placeholder="FIR-XXXXX"
                  />
                  <small>Enter the FIR ID from accepted FIRs</small>
                </div>
                <div className="form-group">
                  <label>Case Title *</label>
                  <input
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={createCase}
                  disabled={loading}
                >
                  Create Case
                </button>
              </div>
            </div>
          )}

          {/* Imported Components */}
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
          {/* Document Review Modal */}
          {showReviewModal && reviewingDocument && (
            <div
              className="modal-overlay"
              onClick={() => setShowReviewModal(false)}
            >
              <div
                className="review-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="review-modal-header">
                  <div className="review-modal-icon">
                    {reviewAction === "ACCEPT" ? "✅" : "❌"}
                  </div>
                  <div>
                    <h3>
                      {reviewAction === "ACCEPT"
                        ? "Accept Document"
                        : "Reject Document"}
                    </h3>
                    <p>Review the document and add your notes</p>
                  </div>
                  <button
                    className="review-modal-close"
                    onClick={() => setShowReviewModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="review-modal-body">
                  {/* Document Info */}
                  <div className="review-doc-info">
                    <div className="review-doc-icon">📄</div>
                    <div className="review-doc-details">
                      <strong>{reviewingDocument.title}</strong>
                      <span>
                        Submitted by: {reviewingDocument.created_by_name}
                      </span>
                      <span>
                        Submitted on:{" "}
                        {new Date(
                          reviewingDocument.submitted_at,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {reviewingDocument.description && (
                    <div className="review-section">
                      <label>Description</label>
                      <p className="review-description">
                        {reviewingDocument.description}
                      </p>
                    </div>
                  )}

                  {/* Cloudinary Details */}
                  <div className="review-section">
                    <label>🔗 Cloudinary Details</label>
                    <div className="review-ipfs-details">
                      <div>
                        <strong>Cloudinary URL:</strong>{" "}
                        <code>{reviewingDocument.cloudinary_url}</code>
                      </div>
                      <div>
                        <strong>Hash:</strong>{" "}
                        <code className="review-hash">
                          {reviewingDocument.hash}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div className="review-section">
                    <label>
                      {reviewAction === "ACCEPT"
                        ? "Acceptance Notes"
                        : "Rejection Reason"}
                      <span className="review-optional"> (Optional)</span>
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      placeholder={
                        reviewAction === "ACCEPT"
                          ? "Add any notes about accepting this document as evidence..."
                          : "Explain why this document is being rejected..."
                      }
                      className="review-textarea"
                    />
                  </div>
                </div>

                <div className="review-modal-footer">
                  <button
                    className="review-btn-cancel"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`review-btn-submit review-btn-${reviewAction === "ACCEPT" ? "accept" : "reject"}`}
                    onClick={async () => {
                      setIsSubmittingReview(true);
                      await reviewDocument(
                        reviewingDocument.evidence_id,
                        reviewAction,
                        reviewNotes,
                      );
                      setIsSubmittingReview(false);
                      setShowReviewModal(false);
                      setReviewNotes("");
                      setReviewingDocument(null);
                    }}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? (
                      <>
                        <span className="review-spinner"></span>
                        Processing...
                      </>
                    ) : reviewAction === "ACCEPT" ? (
                      "✅ Accept Document"
                    ) : (
                      "❌ Reject Document"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* FIR DETAILS MODAL */}
          {showFirDetailModal && selectedFirDetail && (
            <div
              className="modal-overlay"
              onClick={() => setShowFirDetailModal(false)}
            >
              <div
                className="modal modal-large"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-left">
                    <div className="modal-icon">📋</div>
                    <div>
                      <h3>FIR Details: {selectedFirDetail.fir_number}</h3>
                      <p>Complete information about the complaint</p>
                    </div>
                  </div>
                  <button
                    className="modal-close"
                    onClick={() => setShowFirDetailModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  {/* FIR Information */}
                  <div className="details-section">
                    <h4>📌 FIR Information</h4>
                    <div className="details-grid">
                      <div>
                        <strong>FIR Number:</strong>{" "}
                        {selectedFirDetail.fir_number}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {getStatusBadge(selectedFirDetail.status)}
                      </div>
                      <div>
                        <strong>Filed On:</strong>{" "}
                        {new Date(
                          selectedFirDetail.created_at,
                        ).toLocaleString()}
                      </div>
                      <div>
                        <strong>FIR ID:</strong>{" "}
                        <code>{selectedFirDetail.fir_id}</code>
                      </div>
                    </div>
                  </div>

                  {/* Complainant Details */}
                  <div className="details-section">
                    <h4>👤 Complainant Details</h4>
                    <div className="details-grid">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedFirDetail.complainant_name}
                      </div>
                      <div>
                        <strong>Contact:</strong>{" "}
                        {selectedFirDetail.complainant_contact}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {selectedFirDetail.complainant_email}
                      </div>
                      <div>
                        <strong>Address:</strong>{" "}
                        {selectedFirDetail.complainant_address ||
                          "Not provided"}
                      </div>
                    </div>
                  </div>

                  {/* Incident Details */}
                  <div className="details-section">
                    <h4>📍 Incident Details</h4>
                    <div className="details-grid">
                      <div className="full-width">
                        <strong>Title:</strong>{" "}
                        {selectedFirDetail.incident_title}
                      </div>
                      <div className="full-width">
                        <strong>Description:</strong>{" "}
                        {selectedFirDetail.incident_description}
                      </div>
                      <div>
                        <strong>Location:</strong>{" "}
                        {selectedFirDetail.incident_location}
                      </div>
                      <div>
                        <strong>Date & Time:</strong>{" "}
                        {new Date(
                          selectedFirDetail.incident_datetime,
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Suspect Information */}
                  <div className="details-section">
                    <h4>👮 Suspect Information</h4>
                    <div className="details-grid">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedFirDetail.accused_person || "Not provided"}
                      </div>
                      <div>
                        <strong>Description:</strong>{" "}
                        {selectedFirDetail.accused_description ||
                          "Not provided"}
                      </div>
                    </div>
                  </div>

                  {/* Witness Information */}
                  <div className="details-section">
                    <h4>👥 Witness Information</h4>
                    <div className="details-grid">
                      <div>
                        <strong>Names:</strong>{" "}
                        {selectedFirDetail.witness_names || "Not provided"}
                      </div>
                      <div>
                        <strong>Contact:</strong>{" "}
                        {selectedFirDetail.witness_contact || "Not provided"}
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  {selectedFirDetail.status_history &&
                    selectedFirDetail.status_history.length > 0 && (
                      <div className="details-section">
                        <h4>📜 Status History</h4>
                        <div className="timeline-list">
                          {selectedFirDetail.status_history.map(
                            (history: any, idx: number) => (
                              <div key={idx} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                  <div className="timeline-header">
                                    <strong>
                                      {history.status.replace(/_/g, " ")}
                                    </strong>
                                    <span className="timeline-date">
                                      {new Date(
                                        history.timestamp,
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  {history.remarks && (
                                    <div className="timeline-remarks">
                                      {history.remarks}
                                    </div>
                                  )}
                                  <div className="timeline-by">
                                    By: {history.changed_by || "System"}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowFirDetailModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowFirDetailModal(false);
                      // Auto-fill accept or review action
                    }}
                  >
                    Take Action →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Menu Panel (Slide from bottom) */}
      <div className={`mobile-menu-panel ${sidebarOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-user">
            <div className="mobile-menu-avatar">👮</div>
            <div>
              <div className="mobile-menu-name">Investigator</div>
              <div className="mobile-menu-role">Law Enforcement</div>
            </div>
          </div>
          <button
            className="mobile-menu-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="mobile-menu-items">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-menu-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="mobile-menu-icon">{item.icon}</span>
              <span className="mobile-menu-label">{item.label}</span>
              {item.badge !== null && item.badge > 0 && (
                <span className="mobile-menu-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* FIR DETAILS MODAL */}
      {showFirDetailModal && selectedFirDetail && (
        <div
          className="modal-overlay"
          onClick={() => setShowFirDetailModal(false)}
        >
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📋 FIR Details: {selectedFirDetail.fir_number}</h3>
              <button
                className="modal-close"
                onClick={() => setShowFirDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* FIR Information */}
              <div className="details-section">
                <h4>FIR Information</h4>
                <div className="details-grid">
                  <div>
                    <strong>FIR Number:</strong> {selectedFirDetail.fir_number}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedFirDetail.status)}
                  </div>
                  <div>
                    <strong>Filed On:</strong>{" "}
                    {new Date(selectedFirDetail.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Complainant Details */}
              <div className="details-section">
                <h4>👤 Complainant Details</h4>
                <div className="details-grid">
                  <div>
                    <strong>Name:</strong> {selectedFirDetail.complainant_name}
                  </div>
                  <div>
                    <strong>Contact:</strong>{" "}
                    {selectedFirDetail.complainant_contact}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedFirDetail.complainant_email}
                  </div>
                  <div>
                    <strong>Address:</strong>{" "}
                    {selectedFirDetail.complainant_address || "Not provided"}
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="details-section">
                <h4>📌 Incident Details</h4>
                <div className="details-grid">
                  <div>
                    <strong>Title:</strong> {selectedFirDetail.incident_title}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {selectedFirDetail.incident_description}
                  </div>
                  <div>
                    <strong>Location:</strong>{" "}
                    {selectedFirDetail.incident_location}
                  </div>
                  <div>
                    <strong>Date & Time:</strong>{" "}
                    {new Date(
                      selectedFirDetail.incident_datetime,
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Suspect Information */}
              <div className="details-section">
                <h4>👮 Suspect Information</h4>
                <div className="details-grid">
                  <div>
                    <strong>Name:</strong>{" "}
                    {selectedFirDetail.accused_person || "Not provided"}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {selectedFirDetail.accused_description || "Not provided"}
                  </div>
                </div>
              </div>

              {/* Witness Information */}
              <div className="details-section">
                <h4>👥 Witness Information</h4>
                <div className="details-grid">
                  <div>
                    <strong>Names:</strong>{" "}
                    {selectedFirDetail.witness_names || "Not provided"}
                  </div>
                  <div>
                    <strong>Contact:</strong>{" "}
                    {selectedFirDetail.witness_contact || "Not provided"}
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedFirDetail.status_history &&
                selectedFirDetail.status_history.length > 0 && (
                  <div className="details-section">
                    <h4>📜 Status History</h4>
                    <div className="timeline-list">
                      {selectedFirDetail.status_history.map(
                        (history: any, idx: number) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div>
                              <strong>
                                {history.status.replace(/_/g, " ")}
                              </strong>
                              <div className="timeline-meta">
                                {new Date(history.timestamp).toLocaleString()} -
                                By: {history.changed_by || "System"}
                              </div>
                              {history.remarks && (
                                <div className="timeline-remarks">
                                  {history.remarks}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowFirDetailModal(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowFirDetailModal(false);
                  // Optional: Auto-fill accept/reject
                }}
              >
                Take Action →
              </button>
            </div>
          </div>
        </div>
      )}
      {sidebarOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style>{`
        /* Dashboard Styles - Same as User Side */
        .investigator-dashboard {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --border-light: rgba(255, 255, 255, 0.06);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          --sidebar-width: 280px;
          
          min-height: 100vh;
          background: var(--bg-deep);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text);
          position: relative;
        }

        /* Background Effects */
        .dashboard-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-aura-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: floatA 12s ease-in-out infinite;
        }

        .dashboard-aura-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: floatB 15s ease-in-out infinite reverse;
        }

        .dashboard-aura-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: -8%;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08), transparent);
          animation: floatC 18s ease-in-out infinite;
        }

        @keyframes floatA {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
        }
        @keyframes floatB {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.6; }
        }

        /* Notification */
        .dashboard-notification {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          padding: 14px 20px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
          animation: slideInRight 0.3s ease-out;
        }

        .notification-icon {
          font-size: 24px;
        }

        .notification-content strong {
          color: #92400e;
        }

        .notification-content p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #78350f;
        }

        .notification-btn {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        /* Top Navigation */
        .dashboard-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 72px;
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-light);
        }

        .dashboard-nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dashboard-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .dashboard-hamburger span {
          width: 24px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: all 0.3s;
        }

        .dashboard-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .dashboard-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          border-radius: 6px;
        }

        .dashboard-logo-text {
          font-family: 'Syne', sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        .dashboard-nav-links {
          display: flex;
          gap: 2rem;
        }

        .dashboard-nav-link {
          text-decoration: none;
          color: #7a849c;
          font-size: 0.83rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .dashboard-nav-link:hover,
        .dashboard-nav-link.active {
          color: #e8ecf8;
        }

        .dashboard-nav-right {
          display: flex;
          gap: 8px;
        }

        .dashboard-refresh-btn {
          padding: 8px 16px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .dashboard-refresh-btn:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        /* Main Layout */
        .dashboard-main-layout {
          display: flex;
          min-height: calc(100vh - 72px);
          position: relative;
          z-index: 10;
        }

        /* Sidebar */
        .dashboard-sidebar {
          width: var(--sidebar-width);
          background: rgba(12, 15, 26, 0.8);
          backdrop-filter: blur(16px);
          border-right: 1px solid rgba(99, 102, 241, 0.12);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 72px;
          height: calc(100vh - 72px);
          overflow-y: auto;
        }

        /* Custom Scrollbar - Clean like user side */
        .dashboard-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .dashboard-sidebar::-webkit-scrollbar-track {
          background: rgba(99, 102, 241, 0.05);
          border-radius: 3px;
        }

        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 3px;
        }

        .dashboard-sidebar::-webkit-scrollbar-thumb:hover {
          background: #818cf8;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 72px;
            left: 0;
            transform: translateX(-100%);
            z-index: 100;
            transition: transform 0.3s ease;
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
            box-shadow: 2px 0 20px rgba(0,0,0,0.3);
          }
          .dashboard-hamburger {
            display: flex;
          }
          .dashboard-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 90;
            display: block;
          }
        }

        @media (min-width: 769px) {
          .dashboard-sidebar {
            transform: translateX(0) !important;
          }
          .dashboard-overlay {
            display: none !important;
          }
        }

        .dashboard-sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .dashboard-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-user-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .dashboard-user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .dashboard-user-role {
          font-size: 0.7rem;
          color: #818cf8;
        }

        .dashboard-sidebar-nav {
          flex: 1;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dashboard-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #7a849c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .dashboard-sidebar-item:hover {
          background: rgba(99, 102, 241, 0.08);
          color: #e8ecf8;
          transform: translateX(4px);
        }

        .dashboard-sidebar-item.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          color: #818cf8;
        }

        .dashboard-sidebar-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: #6366f1;
          border-radius: 0 3px 3px 0;
        }

        .sidebar-icon {
          font-size: 1.2rem;
          width: 28px;
        }

        .sidebar-label {
          flex: 1;
        }

        .sidebar-badge {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .dashboard-sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .dashboard-sidebar-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 10px;
          font-size: 0.75rem;
          color: #7a849c;
        }

        /* Main Content */
        .dashboard-main-content {
          flex: 1;
          overflow-x: hidden;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .dashboard-main-content {
            padding-bottom: 0;
          }
        }

        /* Mobile Bottom Navigation */
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 90;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(99, 102, 241, 0.2);
          padding: 8px 16px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        .mobile-bottom-nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 8px;
        }

        .mobile-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          padding: 8px 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #7a849c;
        }

        .mobile-nav-item.active {
          color: #818cf8;
          background: rgba(99, 102, 241, 0.1);
        }

        .mobile-nav-icon {
          font-size: 1.3rem;
        }

        .mobile-nav-label {
          font-size: 0.7rem;
          font-weight: 500;
        }

        /* Mobile Menu Panel */
        .mobile-menu-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(12, 15, 26, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 200;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.5);
        }

        .mobile-menu-panel.open {
          transform: translateY(0);
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .mobile-menu-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-menu-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .mobile-menu-name {
          font-weight: 600;
          color: #e8ecf8;
        }

        .mobile-menu-role {
          font-size: 0.75rem;
          color: #818cf8;
        }

        .mobile-menu-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .mobile-menu-items {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: #7a849c;
          position: relative;
        }

        .mobile-menu-item.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
          color: #818cf8;
        }

        .mobile-menu-icon {
          font-size: 1.2rem;
        }

        .mobile-menu-label {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .mobile-menu-badge {
          position: absolute;
          right: 12px;
          background: rgba(239, 68, 68, 0.8);
          color: white;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 199;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Stats Cards */
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          padding: 0 2rem;
          margin-top: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }
          /* Small Toast Notification - Fixed Position & Responsive */
.dashboard-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: rgba(12, 15, 26, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  padding: 10px 16px;
  min-width: 200px;
  max-width: 280px;
  animation: slideInRight 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 3px solid;
}

.toast-success {
  border-left-color: #10b981;
}
.toast-success .toast-icon {
  color: #10b981;
}

.toast-error {
  border-left-color: #ef4444;
}
.toast-error .toast-icon {
  color: #ef4444;
}

.toast-info {
  border-left-color: #6366f1;
}
.toast-info .toast-icon {
  color: #818cf8;
}

.toast-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.toast-text {
  font-size: 0.75rem;
  color: #e8ecf8;
  line-height: 1.3;
  word-break: break-word;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile responsive - bottom center */
@media (max-width: 768px) {
  .dashboard-toast {
    bottom: 70px;
    right: 16px;
    left: auto;
    max-width: 260px;
  }
}

@media (max-width: 480px) {
  .dashboard-toast {
    bottom: 65px;
    right: 12px;
    padding: 8px 12px;
    max-width: 220px;
  }
  
  .toast-text {
    font-size: 0.7rem;
  }
  
  .toast-icon {
    font-size: 0.85rem;
  }
}
        /* Header */
        .dashboard-header {
          padding: 2rem 2rem 0 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem 1rem 0 1rem;
          }
        }

        .dashboard-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-light);
        }

        @media (max-width: 768px) {
          .dashboard-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }

        .dashboard-welcome h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        @media (max-width: 768px) {
          .dashboard-welcome h1 {
            font-size: 1.4rem;
          }
        }

        .dashboard-welcome h1 span {
          background: linear-gradient(135deg, #6366f1, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-welcome p {
          color: #7a849c;
          font-size: 0.88rem;
        }

        .dashboard-header-stats {
          display: flex;
          gap: 12px;
        }

        .header-stat {
          background: rgba(12, 15, 26, 0.6);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 18px;
          text-align: center;
          transition: all 0.3s;
        }

        .header-stat:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
        }

        .header-stat-value {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
        }

        .header-stat-label {
          font-size: 0.68rem;
          color: #3d4459;
        }

        /* Content Sections */
        .dashboard-content-section {
          padding: 0 2rem 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-content-section {
            padding: 0 1rem 1rem;
          }
        }

        .fade-up {
          animation: fadeUp 0.4s ease-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .section-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Info Card */
        .info-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
        }

        .info-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
          color: #e8ecf8;
        }

        /* FIR Card */
.fir-card {
  background: rgba(7, 9, 14, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 14px;
  padding: 20px 24px;
  transition: all 0.3s;
}

.fir-card.accepted {
  border-left: 3px solid #10b981;
}

.fir-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.fir-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.fir-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.fir-number {
  font-weight: 700;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.12);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
}

.fir-date {
  font-size: 0.7rem;
  color: #3d4459;
}

.fir-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #e8ecf8;
}

.fir-details p {
  margin: 6px 0;
  font-size: 0.85rem;
  color: #7a849c;
}

.fir-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

/* Case Card */
.case-card {
  background: rgba(7, 9, 14, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.3s;
}

.case-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.case-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

/* Report Card */
.report-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(7, 9, 14, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 12px;
  padding: 20px;
}

.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Form Card */
.form-card {
  background: rgba(12, 15, 26, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #7a849c;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.btn-secondary {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
}

.back-btn {
  background: #6b7280;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  margin-bottom: 20px;
}

.icon-btn {
  background: rgba(99, 102, 241, 0.1);
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(99, 102, 241, 0.2);
}

.action-btns {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* Search Bar */
.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-bar input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
}

.search-bar select {
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
}

/* Upload Area */
.upload-area {
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

/* Progress Bar */
.progress-bar {
  height: 8px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 4px;
  transition: width 0.3s;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.data-table th {
  color: #818cf8;
  font-weight: 600;
  font-size: 0.8rem;
}

/* List Items */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

/* Details */
.details-card {
  background: rgba(12, 15, 26, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  padding: 24px;
}

.details-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.details-section h3 {
  color: #818cf8;
  margin-bottom: 16px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

/* Timeline */
.timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.timeline-dot {
  width: 10px;
  height: 10px;
  background: #6366f1;
  border-radius: 50%;
  margin-top: 6px;
}

.timeline-remarks {
  font-size: 12px;
  color: #7a849c;
  margin-top: 4px;
}

.timeline-by {
  font-size: 11px;
  color: #3d4459;
}

/* Verify Section */
.verify-box {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04));
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
}

.evidence-details {
  background: rgba(7, 9, 14, 0.5);
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
}

.verify-result {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  margin-top: 24px;
}

.verify-result.success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.verify-result.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.result-icon {
  font-size: 3rem;
}

/* Report View */
.report-view {
  background: rgba(12, 15, 26, 0.8);
  border-radius: 16px;
  padding: 32px;
}

.report-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
}

.report-header h1 {
  color: #818cf8;
  margin-bottom: 16px;
}

.report-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 12px;
}

.report-actions-bottom {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  flex-wrap: wrap;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #7a849c;
}

.empty-state-large {
  text-align: center;
  padding: 60px 20px;
  background: rgba(12, 15, 26, 0.6);
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.4;
}

.warning-text {
  color: #f59e0b;
  font-size: 0.85rem;
}

.doc-cid-preview {
  font-size: 0.7rem;
  font-family: monospace;
  color: #818cf8;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 4px;
  border-radius: 4px;
}

/* Enhanced Dropdown Styling */
select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px !important;
}

.form-group select,
.form-card select,
select:not([multiple]) {
  cursor: pointer;
}

.form-group select option,
select option {
  background: #0c0f1a;
  color: #e8ecf8;
  padding: 10px;
}

.form-group select:focus,
select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Small Toast Notification - Right Side Fixed */
.dashboard-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  background: rgba(12, 15, 26, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 10px 18px;
  min-width: 260px;
  max-width: 320px;
  animation: slideInRight 0.3s ease-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border-left: 3px solid;
}

.toast-success {
  border-left-color: #10b981;
}
.toast-success .toast-icon {
  color: #10b981;
}

.toast-error {
  border-left-color: #ef4444;
}
.toast-error .toast-icon {
  color: #ef4444;
}

.toast-info {
  border-left-color: #6366f1;
}
.toast-info .toast-icon {
  color: #818cf8;
}

.toast-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-text {
  font-size: 0.8rem;
  color: #e8ecf8;
  line-height: 1.4;
  word-break: break-word;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* For mobile, adjust position */
@media (max-width: 768px) {
  .dashboard-toast {
    top: auto;
    bottom: 80px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

.forensic-evidence-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.forensic-evidence-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 10px;
  margin-bottom: 20px;
}

.forensic-evidence-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(12, 15, 26, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.forensic-evidence-checkbox:hover {
  background: rgba(99, 102, 241, 0.1);
}

.forensic-evidence-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #6366f1;
}

.forensic-evidence-checkbox strong {
  min-width: 150px;
  color: #e8ecf8;
}

.forensic-evidence-checkbox small {
  color: #818cf8;
}

/* Evidence Case Selector */
.evidence-case-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.9rem;
  cursor: pointer;
}

.evidence-case-info {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04));
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border-left: 3px solid #6366f1;
}

.evidence-case-badge {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.evidence-case-number {
  font-weight: 700;
  font-size: 0.85rem;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.12);
  padding: 4px 12px;
  border-radius: 20px;
}

.evidence-case-title {
  font-size: 0.9rem;
  color: #7a849c;
  margin: 0;
}

/* Modal Container - Single Definition */
.modal {
  background: linear-gradient(135deg, #0c0f1a, #07090e);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  position: relative;
  margin: 0 auto;
}

/* For FIR details - larger modal */
.modal-large {
  max-width: 800px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(6, 8, 15, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999 !important;
  padding: 20px;
}


/* Ensure modal appears above everything including nav */
.investigator-dashboard {
  position: relative;
}

.dashboard-nav {
  z-index: 100;
}


.modal {
  z-index: 100000 !important;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.review-modal {
  background: linear-gradient(135deg, #0c0f1a, #07090e);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.review-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);
  background: rgba(7, 9, 14, 0.5);
}

.review-modal-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.review-modal-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e8ecf8;
  margin: 0 0 4px 0;
}

.review-modal-header p {
  font-size: 0.75rem;
  color: #7a849c;
  margin: 0;
}

.review-modal-close {
  margin-left: auto;
  background: rgba(99, 102, 241, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #7a849c;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.review-modal-close:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #e8ecf8;
}

.review-modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(85vh - 140px);
}

.review-doc-info {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 12px;
  margin-bottom: 20px;
}

.review-doc-icon {
  font-size: 2rem;
}

.review-doc-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.review-doc-details strong {
  font-size: 0.9rem;
  color: #e8ecf8;
}

.review-doc-details span {
  font-size: 0.7rem;
  color: #7a849c;
}

.review-section {
  margin-bottom: 20px;
}

.review-section label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 8px;
}

.review-optional {
  color: #7a849c;
  font-weight: normal;
  margin-left: 4px;
}

.review-description {
  font-size: 0.85rem;
  color: #7a849c;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 8px;
}

.review-ipfs-details {
  padding: 12px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 8px;
  font-size: 0.7rem;
}

.review-ipfs-details div {
  margin-bottom: 6px;
  color: #7a849c;
}

.review-ipfs-details code {
  font-size: 0.65rem;
  word-break: break-all;
  color: #818cf8;
}

.review-hash {
  font-size: 0.65rem;
  word-break: break-all;
}

.review-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.85rem;
  resize: vertical;
  font-family: inherit;
}

.review-textarea:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.review-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(99, 102, 241, 0.12);
  background: rgba(7, 9, 14, 0.5);
}

.review-btn-cancel {
  padding: 10px 20px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  color: #7a849c;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.review-btn-cancel:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #e8ecf8;
}

.review-btn-submit {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-btn-accept {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

.review-btn-accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.review-btn-reject {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.review-btn-reject:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.review-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.review-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .fir-card, .case-card {
    padding: 16px;
  }
  
  .fir-actions, .case-actions {
    flex-direction: column;
  }
  
  .fir-actions .btn, .case-actions .btn {
    width: 100%;
    text-align: center;
  }
  
  .review-modal {
    width: 95%;
    margin: 10px;
  }
  
  .review-modal-header {
    flex-wrap: wrap;
  }
  
  .review-doc-info {
    flex-direction: column;
    text-align: center;
  }
  
  .review-modal-footer {
    flex-direction: column;
  }
  
  .review-btn-cancel, .review-btn-submit {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

/* Ensure toast doesn't cover important UI */
.dashboard-toast {
  pointer-events: none;
}

.dashboard-toast .toast-inner {
  pointer-events: auto;
}

/* For very small screens */
@media (max-width: 480px) {
  .dashboard-toast {
    bottom: 70px;
    padding: 10px 16px;
  }
  
  .toast-text {
    font-size: 0.75rem;
  }
  
  .toast-icon {
    font-size: 1rem;
  }
}

/* For landscape mode on mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .dashboard-toast {
    bottom: 16px;
    top: auto;
  }
}
  .btn-info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-large {
  max-width: 800px;
}

  /* Modal Header Left */
.modal-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.modal-header-left h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e8ecf8;
  margin: 0 0 4px 0;
}

.modal-header-left p {
  font-size: 0.7rem;
  color: #7a849c;
  margin: 0;
}

/* Full width in grid */
.details-grid .full-width {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .details-grid .full-width {
    grid-column: span 1;
  }
  
  .modal-header-left {
    flex-wrap: wrap;
  }
}
      `}</style>
    </div>
  );
}
