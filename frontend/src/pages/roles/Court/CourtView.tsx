// frontend/src/pages/roles/Court/CourtView.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../shared/env";

type CaseForReview = {
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  fir_number: string;
  complainant_name: string;
  complainant_contact: string;
  investigator_name: string;
  submitted_at: string;
  evidence_count: number;
  evidence: any[];
  suspects: any[];
  witnesses: any[];
  timeline: any[];
};

type Judgment = {
  judgment_id: string;
  judgment_number: string;
  case_id: string;
  case_number: string;
  case_title: string;
  verdict: string;
  sentence: string;
  reasoning: string;
  judge_name: string;
  created_at: string;
  cloudinary_url?: string;
  hash: string;
};

type Hearing = {
  hearing_id: string;
  case_id: string;
  case_number: string;
  hearing_date: string;
  hearing_time: string;
  hearing_type: string;
  meeting_link: string;
  status: string;
  notes: string;
};

type CourtStats = {
  pending_cases: number;
  decided_cases: number;
  total_judgments: number;
  verdict_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  total_hearings: number;
  upcoming_hearings: number;
};

export function CourtView({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cases, setCases] = useState<CaseForReview[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [stats, setStats] = useState<CourtStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseForReview | null>(null);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Judgment Form
  const [judgmentVerdict, setJudgmentVerdict] = useState("");
  const [judgmentSentence, setJudgmentSentence] = useState("");
  const [judgmentReasoning, setJudgmentReasoning] = useState("");
  const [judgmentPunishment, setJudgmentPunishment] = useState("");
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [selectedSuspectName, setSelectedSuspectName] = useState("");

  // Hearing Form
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [hearingType, setHearingType] = useState("VIRTUAL");
  const [hearingNotes, setHearingNotes] = useState("");
  const [hearingAccess, setHearingAccess] = useState<
    Record<string, { canAccess: boolean; meetingLink: string }>
  >({});

  // Evidence Review
  const [evidenceReviewNotes, setEvidenceReviewNotes] = useState("");
  const [evidenceAdmissible, setEvidenceAdmissible] = useState(true);

  // Search Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Verify Evidence States
  const [verifyCaseId, setVerifyCaseId] = useState("");
  const [verifyEvidenceList, setVerifyEvidenceList] = useState<any[]>([]);
  const [verifySelectedEvidence, setVerifySelectedEvidence] =
    useState<any>(null);
  const [verifyTimeline, setVerifyTimeline] = useState<any[] | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyManualHash, setVerifyManualHash] = useState("");
  const [verifyResultMsg, setVerifyResultMsg] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [hoveredCase, setHoveredCase] = useState<string | null>(null);
  const [hoveredJudgment, setHoveredJudgment] = useState<string | null>(null);
  const [forensicReports, setForensicReports] = useState<any[]>([]);
  const [showForensicModal, setShowForensicModal] = useState(false);
  const [selectedForensicReport, setSelectedForensicReport] =
    useState<any>(null);
  // Add with other states
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [selectedTimelineCase, setSelectedTimelineCase] = useState<any>(null);
  const [allHearings, setAllHearings] = useState<any[]>([]);
  const [selectedCaseForHearings, setSelectedCaseForHearings] = useState("");
  const [hearingFilter, setHearingFilter] = useState("all");
  const [activeHearingTab, setActiveHearingTab] = useState("upcoming");

  // Sidebar navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", badge: null },
    { id: "cases", label: "Cases for Review", icon: "📋", badge: cases.length },
    {
      id: "judgments",
      label: "Past Judgments",
      icon: "📜",
      badge: judgments.length,
    },
    { id: "search", label: "Search Cases", icon: "🔍", badge: null },
    { id: "verify", label: "Verify Evidence", icon: "🔐", badge: null },
    // navItems array mein ye add karein
    {
      id: "upcoming-hearings",
      label: "Upcoming Hearings",
      icon: "⏳",
      badge: allHearings.filter(
        (h) =>
          new Date(h.hearing_date) >= new Date() && h.status === "SCHEDULED",
      ).length,
    },
    {
      id: "past-hearings",
      label: "Past Hearings",
      icon: "📜",
      badge: allHearings.filter((h) => new Date(h.hearing_date) < new Date())
        .length,
    },
    { id: "case-hearings", label: "Case Hearings", icon: "📋", badge: null },
  ];

  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "cases", label: "Cases", icon: "📋" },
    { id: "judgments", label: "Judgments", icon: "📜" },
    { id: "search", label: "Search", icon: "🔍" },
    { id: "verify", label: "Verify", icon: "🔐" },
    { id: "upcoming-hearings", label: "Hearings", icon: "⏳" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Add after loadData useEffect
  useEffect(() => {
    if (cases.length > 0) {
      setForensicReports([]); // Clear previous reports
      cases.forEach(async (caseItem) => {
        await loadForensicReports(caseItem.case_id);
      });
    }
  }, [cases]);

  async function loadData() {
    try {
      const [casesData, judgmentsData, statsData] = await Promise.all([
        apiRequest<CaseForReview[]>("/court/cases-for-review", { token }).catch(
          () => [],
        ),
        apiRequest<Judgment[]>("/court/judgments", { token }).catch(() => []),
        apiRequest<CourtStats>("/court/stats", { token }).catch(() => null),
      ]);
      setCases(casesData);
      setJudgments(judgmentsData);
      setStats(statsData);
      await loadAllHearings(); // Add this line
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function checkHearingAccess(hearingId: string) {
    try {
      const result = await apiRequest<any>(
        `/court/hearing/access/${hearingId}`,
        { token },
      );
      setHearingAccess((prev) => ({
        ...prev,
        [hearingId]: {
          canAccess: result.can_access,
          meetingLink: result.meeting_link,
        },
      }));
      return result;
    } catch (err) {
      console.error("Error checking hearing access:", err);
      return { can_access: false };
    }
  }

  // Load all hearings for court
  async function loadAllHearings() {
    try {
      const allCases = await apiRequest<any[]>("/cases/list", { token });
      let allHearingsList: any[] = [];

      for (const caseItem of allCases) {
        try {
          const hearings = await apiRequest<any[]>(
            `/court/hearings/${caseItem.case_id}`,
            { token },
          );
          const hearingsWithCase = hearings.map((h) => ({
            ...h,
            case_number: caseItem.case_number,
            case_title: caseItem.title,
          }));
          allHearingsList = [...allHearingsList, ...hearingsWithCase];
        } catch (err) {
          console.log(`No hearings for case ${caseItem.case_id}`);
        }
      }

      // Sort by date (upcoming first)
      allHearingsList.sort(
        (a, b) =>
          new Date(a.hearing_date).getTime() -
          new Date(b.hearing_date).getTime(),
      );
      setAllHearings(allHearingsList);
    } catch (err) {
      console.error("Error loading all hearings:", err);
    }
  }

  // Load hearings for specific case
  async function loadHearingsForCase(caseId: string) {
    if (!caseId) {
      setAllHearings([]);
      return;
    }
    try {
      const hearings = await apiRequest<any[]>(`/court/hearings/${caseId}`, {
        token,
      });
      const caseData = cases.find((c) => c.case_id === caseId);
      const hearingsWithCase = hearings.map((h) => ({
        ...h,
        case_number: caseData?.case_number || "N/A",
        case_title: caseData?.title || "N/A",
      }));
      setAllHearings(hearingsWithCase);
    } catch (err) {
      console.error("Error loading case hearings:", err);
      setAllHearings([]);
    }
  }

  // Filter hearings based on selected filter
  function getFilteredHearings() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = [...allHearings];

    if (activeHearingTab === "past") {
      filtered = filtered.filter((h) => new Date(h.hearing_date) < now);
    } else if (activeHearingTab === "upcoming") {
      filtered = filtered.filter((h) => new Date(h.hearing_date) >= now);
    } else if (activeHearingTab === "case" && selectedCaseForHearings) {
      filtered = filtered.filter((h) => h.case_id === selectedCaseForHearings);
    }

    // Apply date filter
    if (hearingFilter === "today") {
      filtered = filtered.filter((h) => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate.toDateString() === today.toDateString();
      });
    } else if (hearingFilter === "week") {
      filtered = filtered.filter((h) => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate >= weekStart;
      });
    } else if (hearingFilter === "month") {
      filtered = filtered.filter((h) => {
        const hearingDate = new Date(h.hearing_date);
        return hearingDate >= monthStart;
      });
    }

    return filtered;
  }

  function getHearingStatusBadge(status: string) {
    const config: Record<string, { color: string; bg: string; icon: string }> =
      {
        SCHEDULED: {
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.12)",
          icon: "⏳",
        },
        COMPLETED: {
          color: "#10b981",
          bg: "rgba(16,185,129,0.12)",
          icon: "✅",
        },
        CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "❌" },
        RESCHEDULED: {
          color: "#3b82f6",
          bg: "rgba(59,130,246,0.12)",
          icon: "🔄",
        },
      };
    const style = config[status] || {
      color: "#64748b",
      bg: "rgba(100,116,139,0.12)",
      icon: "📋",
    };
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "0.7rem",
          fontWeight: 500,
        }}
      >
        {style.icon} {status}
      </span>
    );
  }

  async function loadForensicReports(caseId: string) {
    try {
      const reports = await apiRequest<any[]>(
        `/court/case-forensic-reports/${caseId}`,
        { token },
      );
      // Use a Map to store unique reports by report_id
      setForensicReports((prev) => {
        const existingIds = new Set(prev.map((r) => r.report_id));
        const newReports = reports.filter((r) => !existingIds.has(r.report_id));
        return [...prev, ...newReports];
      });
    } catch (err) {
      console.error("Error loading forensic reports:", err);
    }
  }

  async function loadCaseTimeline(caseId: string) {
    try {
      const data = await apiRequest<any>(`/case-timeline/${caseId}`, { token });
      setTimelineData(data);
    } catch (err) {
      console.error("Error loading timeline:", err);
    }
  }

  async function downloadFullCaseDetails(caseId: string) {
    try {
      setMessage("⏳ Generating case report...");

      // Fetch full case data
      const caseData = await apiRequest<any>(`/cases/${caseId}`, { token });
      const timeline = await apiRequest<any>(`/case-timeline/${caseId}`, {
        token,
      });
      const evidence = await apiRequest<any[]>(
        `/court/evidence-list/${caseId}`,
        { token },
      );
      const forensicReports = await apiRequest<any[]>(
        `/court/case-forensic-reports/${caseId}`,
        { token },
      );

      // Prepare full report data
      const fullReport = {
        case_details: caseData,
        fir_details: caseData.fir_details || {},
        timeline: timeline.timeline || [],
        evidence: evidence || [],
        forensic_reports: forensicReports || [],
        suspects: caseData.suspects || [],
        witnesses: caseData.witnesses || [],
        generated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${API_BASE_URL}/court/download-full-case-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ case_id: caseId, report_data: fullReport }),
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `case_report_${caseData.case_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setMessage("✅ Case report downloaded successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.text();
        console.error("Download failed:", error);
        setMessage("❌ Failed to download case report");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error downloading case report:", err);
      setMessage("❌ Failed to download case report");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleDeliverJudgment() {
    // Validate form
    if (!selectedCase) {
      setMessage("❌ No case selected");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (!selectedSuspectId) {
      setMessage("❌ Please select a suspect/accused person from the list");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (!judgmentVerdict || !judgmentReasoning) {
      setMessage("❌ Please fill verdict and reasoning");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Find the selected suspect details
    const selectedSuspect = selectedCase.suspects?.find(
      (s) =>
        s.id === selectedSuspectId || s.id?.toString() === selectedSuspectId,
    );

    try {
      const result = await apiRequest<any>("/court/judgment", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          suspect_id: selectedSuspectId,
          suspect_name: selectedSuspect?.name || selectedSuspectName,
          verdict: judgmentVerdict,
          sentence: judgmentSentence,
          reasoning: judgmentReasoning,
          punishment_details: judgmentPunishment,
        },
      });
      const judgmentNumber = result?.judgment_number || "Unknown";
      setMessage(
        `✅ Judgment delivered for ${selectedSuspect?.name || selectedSuspectName}! Judgment ID: ${judgmentNumber}`,
      );
      setShowJudgmentModal(false);
      setSelectedCase(null);
      setJudgmentVerdict("");
      setJudgmentSentence("");
      setJudgmentReasoning("");
      setJudgmentPunishment("");
      setSelectedSuspectId("");
      setSelectedSuspectName("");
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to deliver judgment");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleScheduleHearing() {
    if (!selectedCase || !hearingDate || !hearingTime) {
      setMessage("❌ Please fill hearing date and time");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest("/court/schedule-hearing", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          hearing_date: hearingDate,
          hearing_time: hearingTime,
          hearing_type: hearingType,
          notes: hearingNotes,
        },
      });
      setMessage("✅ Hearing scheduled successfully!");
      setShowHearingModal(false);
      setHearingDate("");
      setHearingTime("");
      setHearingNotes("");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to schedule hearing");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleReviewEvidence() {
    if (!selectedEvidence || !evidenceReviewNotes) {
      setMessage("❌ Please enter review notes");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest("/court/review-evidence", {
        method: "POST",
        token,
        body: {
          evidence_id: selectedEvidence.evidence_id,
          review_notes: evidenceReviewNotes,
          is_admissible: evidenceAdmissible,
        },
      });
      setMessage(
        `✅ Evidence marked as ${evidenceAdmissible ? "ADMISSIBLE" : "INADMISSIBLE"}`,
      );
      setShowEvidenceModal(false);
      setSelectedEvidence(null);
      setEvidenceReviewNotes("");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to review evidence");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleSearch() {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (searchStatus) params.append("status", searchStatus);

    try {
      const results = await apiRequest<any[]>(
        `/court/search?${params.toString()}`,
        { token },
      );
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadEvidenceForCase(caseId: string) {
    try {
      const evidence = await apiRequest<any[]>(
        `/court/evidence-list/${caseId}`,
        { token },
      );
      setVerifyEvidenceList(evidence);
    } catch (err) {
      console.error("Error loading evidence:", err);
      setVerifyEvidenceList([]);
    }
  }

  async function loadEvidenceTimeline(evidenceId: string) {
    try {
      const data = await apiRequest<any>(
        `/court/evidence-timeline/${evidenceId}`,
        { token },
      );
      setVerifyTimeline(data.timeline);
    } catch (err) {
      console.error("Error loading timeline:", err);
      setVerifyTimeline(null);
    }
  }

  async function handleVerifyEvidenceByFile() {
    if (!verifySelectedEvidence || !verifyFile) {
      setVerifyResultMsg("❌ Please select evidence and file");
      return;
    }

    const formData = new FormData();
    formData.append("file", verifyFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/court/verify-evidence-file-court?evidence_id=${verifySelectedEvidence.evidence_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const result = await response.json();
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        uploaded_hash: result.uploaded_hash,
        verification_time: result.verification_time,
      });
      await loadEvidenceTimeline(verifySelectedEvidence.evidence_id);
    } catch (err) {
      setVerifyResultMsg("❌ Verification failed");
    }
  }

  async function handleVerifyEvidenceByHash() {
    if (!verifySelectedEvidence || !verifyManualHash) {
      setVerifyResultMsg("❌ Please select evidence and enter hash");
      return;
    }

    try {
      const result = await apiRequest<any>(
        `/court/verify-evidence-hash-court?evidence_id=${verifySelectedEvidence.evidence_id}&provided_hash=${verifyManualHash}`,
        { method: "POST", token },
      );
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        provided_hash: verifyManualHash,
        verification_time: result.verification_time,
      });
      await loadEvidenceTimeline(verifySelectedEvidence.evidence_id);
    } catch (err) {
      setVerifyResultMsg("❌ Verification failed");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      SUBMITTED_TO_COURT: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      UNDER_COURT_REVIEW: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
      DECIDED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    };
    const style = colors[status] || {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
    };
    return (
      <span
        className="status-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      HIGH: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
      MEDIUM: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      LOW: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    };
    const style = colors[priority] || {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
    };
    return (
      <span
        className="priority-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {priority}
      </span>
    );
  }

  function getVerdictBadge(verdict: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      GUILTY: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
      NOT_GUILTY: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
      ACQUITTED: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
      CONVICTED: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
    };
    const style = colors[verdict] || {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
    };
    return (
      <span
        className="verdict-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {verdict}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="court-loading">
        <div className="court-spinner"></div>
        <p>Loading court dashboard...</p>
      </div>
    );
  }

  return (
    <div className="court-dashboard">
      {/* Background Effects */}
      <div className="dashboard-bg" />
      <div className="dashboard-grid" />
      <div className="dashboard-aura dashboard-aura-1" />
      <div className="dashboard-aura dashboard-aura-2" />
      <div className="dashboard-aura dashboard-aura-3" />

      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-left">
          <div className="dashboard-logo">
            <div className="dashboard-logo-mark">⚖️</div>
            <span className="dashboard-logo-text">Court Portal</span>
          </div>
        </div>
        <div className="dashboard-nav-right">
          <button onClick={loadData} className="dashboard-refresh-btn">
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
              <div className="dashboard-user-avatar">⚖️</div>
              <div className="dashboard-user-details">
                <span className="dashboard-user-name">Court Officer</span>
                <span className="dashboard-user-role">Judicial Branch</span>
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
              <span>Secure Cloud Storage - Evidence Integrity Verified</span>
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
          {stats && (
            <div className="court-stats-grid">
              <div className="court-stat-card">
                <div className="court-stat-icon">⚖️</div>
                <div className="court-stat-value">{stats.pending_cases}</div>
                <div className="court-stat-label">Pending Cases</div>
                <div className="court-stat-sub">Awaiting review</div>
              </div>
              <div className="court-stat-card">
                <div className="court-stat-icon">✅</div>
                <div className="court-stat-value">{stats.decided_cases}</div>
                <div className="court-stat-label">Decided Cases</div>
                <div className="court-stat-sub">Judgment delivered</div>
              </div>
              <div className="court-stat-card">
                <div className="court-stat-icon">📜</div>
                <div className="court-stat-value">{stats.total_judgments}</div>
                <div className="court-stat-label">Total Judgments</div>
                <div className="court-stat-sub">On record</div>
              </div>
              <div className="court-stat-card">
                <div className="court-stat-icon">🎙️</div>
                <div className="court-stat-value">
                  {stats.upcoming_hearings}
                </div>
                <div className="court-stat-label">Upcoming Hearings</div>
                <div className="court-stat-sub">Scheduled</div>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <div className="dashboard-welcome">
                <h1>
                  Court <span>Dashboard</span>
                </h1>
                <p>Review cases, deliver judgments, and verify evidence</p>
              </div>
              <div className="dashboard-header-stats">
                <div className="header-stat">
                  <span className="header-stat-value">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="header-stat-label">Today</span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-value">⚖️ Court</span>
                  <span className="header-stat-label">Role</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`court-toast ${message.includes("✅") ? "court-toast-success" : "court-toast-error"}`}
            >
              <span>{message}</span>
            </div>
          )}

          {/* ============ TAB CONTENTS ============ */}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && stats && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">📊</div>
                  <div>
                    <h3>Court Performance</h3>
                    <p>Statistics and case breakdown</p>
                  </div>
                </div>
                <div className="court-dashboard-grid">
                  <div className="court-dashboard-section">
                    <h4>Verdict Breakdown</h4>
                    <div className="court-breakdown-list">
                      {Object.entries(stats.verdict_breakdown).map(
                        ([verdict, count]) => {
                          const percentage =
                            stats.total_judgments > 0
                              ? (count / stats.total_judgments) * 100
                              : 0;
                          return (
                            <div key={verdict} className="court-breakdown-item">
                              <div className="court-breakdown-header">
                                <span
                                  className={`court-verdict-${verdict.toLowerCase()}`}
                                >
                                  {verdict}
                                </span>
                                <span className="court-breakdown-count">
                                  {count}
                                </span>
                              </div>
                              <div className="court-progress-bar">
                                <div
                                  className="court-progress-fill"
                                  style={{
                                    width: `${percentage}%`,
                                    background:
                                      verdict === "GUILTY"
                                        ? "#ef4444"
                                        : "#10b981",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                  <div className="court-dashboard-section">
                    <h4>Pending Cases by Priority</h4>
                    <div className="court-breakdown-list">
                      {Object.entries(stats.priority_breakdown).map(
                        ([priority, count]) => {
                          const percentage =
                            stats.pending_cases > 0
                              ? (count / stats.pending_cases) * 100
                              : 0;
                          const priorityColor =
                            priority === "HIGH"
                              ? "#ef4444"
                              : priority === "MEDIUM"
                                ? "#f59e0b"
                                : "#10b981";
                          return (
                            <div
                              key={priority}
                              className="court-breakdown-item"
                            >
                              <div className="court-breakdown-header">
                                <span
                                  className={`court-priority-${priority.toLowerCase()}`}
                                >
                                  {priority}
                                </span>
                                <span className="court-breakdown-count">
                                  {count}
                                </span>
                              </div>
                              <div className="court-progress-bar">
                                <div
                                  className="court-progress-fill"
                                  style={{
                                    width: `${percentage}%`,
                                    background: priorityColor,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="court-card">
                <div className="court-card-header small">
                  <div className="court-card-icon">⚡</div>
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Common court operations</p>
                  </div>
                </div>
                <div className="court-actions-grid">
                  <button
                    className="court-btn court-btn-primary"
                    onClick={() => setActiveTab("cases")}
                  >
                    📋 Review Pending Cases
                  </button>
                  <button
                    className="court-btn court-btn-secondary"
                    onClick={() => setActiveTab("judgments")}
                  >
                    📜 View Past Judgments
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upcoming-hearings" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">⏳</div>
                  <div>
                    <h3>Upcoming Hearings</h3>
                    <p>Scheduled court hearings</p>
                  </div>
                </div>

                {/* Filter Options */}
                <div className="hearing-filters">
                  <button
                    className={`filter-btn ${hearingFilter === "all" ? "active" : ""}`}
                    onClick={() => setHearingFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${hearingFilter === "today" ? "active" : ""}`}
                    onClick={() => setHearingFilter("today")}
                  >
                    Today
                  </button>
                  <button
                    className={`filter-btn ${hearingFilter === "week" ? "active" : ""}`}
                    onClick={() => setHearingFilter("week")}
                  >
                    This Week
                  </button>
                  <button
                    className={`filter-btn ${hearingFilter === "month" ? "active" : ""}`}
                    onClick={() => setHearingFilter("month")}
                  >
                    This Month
                  </button>
                </div>

                <div className="hearings-list">
                  {getFilteredHearings().filter(
                    (h) =>
                      new Date(h.hearing_date) >= new Date() &&
                      h.status === "SCHEDULED",
                  ).length === 0 ? (
                    <div className="court-empty">
                      <div className="court-empty-icon">🎙️</div>
                      <h4>No Upcoming Hearings</h4>
                      <p>No scheduled hearings found</p>
                    </div>
                  ) : (
                    getFilteredHearings()
                      .filter(
                        (h) =>
                          new Date(h.hearing_date) >= new Date() &&
                          h.status === "SCHEDULED",
                      )
                      .map((hearing, idx) => (
                        <div
                          key={hearing.hearing_id}
                          className="hearing-card"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="hearing-card-header">
                            <div>
                              <span className="hearing-case-number">
                                {hearing.case_number}
                              </span>
                              {getHearingStatusBadge(hearing.status)}
                            </div>
                            <div className="hearing-datetime">
                              📅{" "}
                              {new Date(
                                hearing.hearing_date,
                              ).toLocaleDateString()}{" "}
                              ⏰ {hearing.hearing_time}
                            </div>
                          </div>
                          <h4 className="hearing-title">
                            {hearing.case_title}
                          </h4>
                          <div className="hearing-details">
                            <div>
                              <strong>Type:</strong>{" "}
                              {hearing.hearing_type === "VIRTUAL"
                                ? "💻 Virtual"
                                : "🏛️ Physical"}
                            </div>
                            <div>
                              <strong>Scheduled By:</strong>{" "}
                              {hearing.scheduled_by_name}
                            </div>
                            {hearing.notes && (
                              <div>
                                <strong>Notes:</strong> {hearing.notes}
                              </div>
                            )}
                          </div>
                          {hearing.meeting_link &&
                            hearing.status === "SCHEDULED" && (
                              <div className="hearing-actions">
                                {(() => {
                                  const hearingDateTime = new Date(
                                    `${hearing.hearing_date}T${hearing.hearing_time}`,
                                  );
                                  const now = new Date();
                                  const canJoin =
                                    hearingDateTime <= now &&
                                    hearingDateTime >=
                                      new Date(now.getTime() - 15 * 60000);
                                  return canJoin ? (
                                    <a
                                      href={hearing.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="join-btn active"
                                    >
                                      🎥 Join Meeting Now
                                    </a>
                                  ) : (
                                    <button
                                      className="join-btn disabled"
                                      disabled
                                    >
                                      ⏳ Available at{" "}
                                      {new Date(
                                        hearing.hearing_date,
                                      ).toLocaleDateString()}{" "}
                                      {hearing.hearing_time}
                                    </button>
                                  );
                                })()}
                              </div>
                            )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "past-hearings" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">📜</div>
                  <div>
                    <h3>Past Hearings</h3>
                    <p>Completed and cancelled hearings</p>
                  </div>
                </div>

                <div className="hearings-list">
                  {allHearings.filter(
                    (h) =>
                      new Date(h.hearing_date) < new Date() ||
                      h.status !== "SCHEDULED",
                  ).length === 0 ? (
                    <div className="court-empty">
                      <div className="court-empty-icon">📭</div>
                      <h4>No Past Hearings</h4>
                      <p>No completed hearings found</p>
                    </div>
                  ) : (
                    allHearings
                      .filter(
                        (h) =>
                          new Date(h.hearing_date) < new Date() ||
                          h.status !== "SCHEDULED",
                      )
                      .map((hearing, idx) => (
                        <div
                          key={hearing.hearing_id}
                          className="hearing-card completed"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="hearing-card-header">
                            <div>
                              <span className="hearing-case-number">
                                {hearing.case_number}
                              </span>
                              {getHearingStatusBadge(hearing.status)}
                            </div>
                            <div className="hearing-datetime">
                              📅{" "}
                              {new Date(
                                hearing.hearing_date,
                              ).toLocaleDateString()}{" "}
                              ⏰ {hearing.hearing_time}
                            </div>
                          </div>
                          <h4 className="hearing-title">
                            {hearing.case_title}
                          </h4>
                          <div className="hearing-details">
                            <div>
                              <strong>Type:</strong>{" "}
                              {hearing.hearing_type === "VIRTUAL"
                                ? "💻 Virtual"
                                : "🏛️ Physical"}
                            </div>
                            <div>
                              <strong>Scheduled By:</strong>{" "}
                              {hearing.scheduled_by_name}
                            </div>
                            {hearing.notes && (
                              <div>
                                <strong>Notes:</strong> {hearing.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "case-hearings" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">📋</div>
                  <div>
                    <h3>Case-wise Hearings</h3>
                    <p>View all hearings for a specific case</p>
                  </div>
                </div>

                <div className="case-selector">
                  <select
                    value={selectedCaseForHearings}
                    onChange={(e) => {
                      setSelectedCaseForHearings(e.target.value);
                      loadHearingsForCase(e.target.value);
                    }}
                    className="case-select"
                  >
                    <option value="">-- Select a Case --</option>
                    {cases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.case_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hearings-list">
                  {allHearings.length === 0 ? (
                    <div className="court-empty">
                      <div className="court-empty-icon">🎙️</div>
                      <h4>No Hearings Found</h4>
                      <p>No hearings scheduled for this case</p>
                    </div>
                  ) : (
                    allHearings.map((hearing, idx) => (
                      <div
                        key={hearing.hearing_id}
                        className="hearing-card"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="hearing-card-header">
                          <div>
                            <span className="hearing-case-number">
                              {hearing.case_number}
                            </span>
                            {getHearingStatusBadge(hearing.status)}
                          </div>
                          <div className="hearing-datetime">
                            📅{" "}
                            {new Date(
                              hearing.hearing_date,
                            ).toLocaleDateString()}{" "}
                            ⏰ {hearing.hearing_time}
                          </div>
                        </div>
                        <h4 className="hearing-title">{hearing.case_title}</h4>
                        <div className="hearing-details">
                          <div>
                            <strong>Type:</strong>{" "}
                            {hearing.hearing_type === "VIRTUAL"
                              ? "💻 Virtual"
                              : "🏛️ Physical"}
                          </div>
                          <div>
                            <strong>Scheduled By:</strong>{" "}
                            {hearing.scheduled_by_name}
                          </div>
                          {hearing.notes && (
                            <div>
                              <strong>Notes:</strong> {hearing.notes}
                            </div>
                          )}
                        </div>
                        {hearing.meeting_link &&
                          hearing.status === "SCHEDULED" && (
                            <div className="hearing-actions">
                              <a
                                href={hearing.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="join-btn"
                              >
                                🎥 Join Hearing
                              </a>
                            </div>
                          )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CASES FOR REVIEW TAB */}
          {activeTab === "cases" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">📋</div>
                  <div>
                    <h3>Cases for Court Review</h3>
                    <p>
                      {cases.length} case{cases.length !== 1 ? "s" : ""} pending
                      review
                    </p>
                  </div>
                </div>
                {cases.length === 0 ? (
                  <div className="court-empty">
                    <div className="court-empty-icon">✅</div>
                    <h4>No Pending Cases</h4>
                    <p>All cases have been reviewed</p>
                  </div>
                ) : (
                  <div className="court-cases-list">
                    {cases.map((caseItem, idx) => (
                      <div
                        key={caseItem.case_id}
                        className={`court-case-card ${hoveredCase === caseItem.case_id ? "hovered" : ""}`}
                        onMouseEnter={() => setHoveredCase(caseItem.case_id)}
                        onMouseLeave={() => setHoveredCase(null)}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="court-case-header">
                          <div className="court-case-info">
                            <span className="court-case-number">
                              {caseItem.case_number}
                            </span>
                            {getPriorityBadge(caseItem.priority)}
                            {getStatusBadge(caseItem.status)}
                          </div>
                          <div className="court-case-header-actions">
                            <button
                              className="court-btn court-btn-primary court-btn-small"
                              onClick={() => {
                                setSelectedTimelineCase(caseItem);
                                loadCaseTimeline(caseItem.case_id);
                                setShowTimelineModal(true);
                              }}
                              title="View Complete Case Timeline"
                            >
                              📅 View Timeline
                            </button>
                            <button
                              className="court-btn court-btn-success court-btn-small"
                              onClick={() =>
                                downloadFullCaseDetails(caseItem.case_id)
                              }
                              title="Download Complete Case Report"
                            >
                              📄 Download Report
                            </button>
                            <button
                              className="court-btn court-btn-danger"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                setShowJudgmentModal(true);
                              }}
                            >
                              ⚖️ Deliver Judgment
                            </button>
                          </div>
                        </div>

                        <h4 className="court-case-title">{caseItem.title}</h4>
                        <p className="court-case-desc">
                          {caseItem.description}
                        </p>

                        <div className="court-case-details-grid">
                          <div>
                            <strong>Complainant:</strong>{" "}
                            {caseItem.complainant_name}
                          </div>
                          <div>
                            <strong>Contact:</strong>{" "}
                            {caseItem.complainant_contact}
                          </div>
                          <div>
                            <strong>Investigator:</strong>{" "}
                            {caseItem.investigator_name}
                          </div>
                          <div>
                            <strong>FIR Number:</strong> {caseItem.fir_number}
                          </div>
                          <div>
                            <strong>Submitted:</strong>{" "}
                            {new Date(
                              caseItem.submitted_at,
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <details className="court-details">
                          <summary>
                            📦 View Evidence ({caseItem.evidence_count})
                          </summary>
                          <div className="court-evidence-list">
                            {caseItem.evidence.map((ev) => (
                              <div
                                key={ev.evidence_id}
                                className="court-evidence-item"
                              >
                                <div>
                                  <strong>{ev.title}</strong>
                                  <div className="court-evidence-desc">
                                    {ev.description}
                                  </div>
                                </div>
                                <div className="court-evidence-actions">
                                  <button
                                    className="court-btn-small court-btn-secondary"
                                    onClick={() => {
                                      setSelectedEvidence(ev);
                                      setShowEvidenceModal(true);
                                    }}
                                  >
                                    📝 Review
                                  </button>
                                  <button
                                    className="court-btn-small court-btn-primary"
                                    onClick={() => {
                                      if (ev.cloudinary_url) {
                                        window.open(
                                          ev.cloudinary_url,
                                          "_blank",
                                        );
                                      } else {
                                        setMessage(
                                          "❌ No Cloudinary URL available for this evidence",
                                        );
                                        setTimeout(() => setMessage(""), 3000);
                                      }
                                    }}
                                  >
                                    👁️ View Evidence
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>

                        <details className="court-details">
                          <summary>
                            👤 Suspects ({caseItem.suspects.length})
                          </summary>
                          <div className="court-list">
                            {caseItem.suspects.map((suspect, sidx) => (
                              <div key={sidx} className="court-list-item">
                                <strong>{suspect.name}</strong> -{" "}
                                {suspect.description}
                              </div>
                            ))}
                          </div>
                        </details>

                        <details className="court-details">
                          <summary>
                            👥 Witnesses ({caseItem.witnesses.length})
                          </summary>
                          <div className="court-list">
                            {caseItem.witnesses.map((witness, widx) => (
                              <div key={widx} className="court-list-item">
                                <strong>{witness.name}</strong> -{" "}
                                {witness.statement}
                              </div>
                            ))}
                          </div>
                        </details>

                        {/* Forensic Reports Section */}
                        <details className="court-details">
                          <summary>📊 Forensic Reports</summary>
                          <div className="court-forensic-list">
                            {forensicReports.length === 0 ? (
                              <div className="court-empty-small">
                                Loading forensic reports...
                              </div>
                            ) : (
                              forensicReports
                                .filter((fr) =>
                                  caseItem.evidence.some(
                                    (ev) => ev.evidence_id === fr.evidence_id,
                                  ),
                                )
                                .map((report) => (
                                  <div
                                    key={report.report_id}
                                    className="court-forensic-item"
                                  >
                                    <div className="court-forensic-header">
                                      <strong>{report.report_number}</strong>
                                      <span className="court-badge">
                                        {report.analysis_type}
                                      </span>
                                    </div>
                                    <div className="court-forensic-details">
                                      <div>
                                        <strong>Evidence:</strong>{" "}
                                        {report.evidence_title}
                                      </div>
                                      <div>
                                        <strong>Analyst:</strong>{" "}
                                        {report.analyst_name}
                                      </div>
                                      <div>
                                        <strong>Created:</strong>{" "}
                                        {new Date(
                                          report.created_at,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="court-forensic-actions">
                                      <button
                                        className="court-btn-small court-btn-primary"
                                        onClick={() => {
                                          setSelectedForensicReport(report);
                                          setShowForensicModal(true);
                                        }}
                                      >
                                        👁️ View Full Report
                                      </button>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </details>

                        <div className="court-case-actions">
                          <button
                            className="court-btn court-btn-success"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setShowHearingModal(true);
                            }}
                          >
                            🎙️ Schedule Hearing
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAST JUDGMENTS TAB */}
          {activeTab === "judgments" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">📜</div>
                  <div>
                    <h3>Past Judgments</h3>
                    <p>
                      {judgments.length} judgment
                      {judgments.length !== 1 ? "s" : ""} delivered
                    </p>
                  </div>
                </div>
                {judgments.length === 0 ? (
                  <div className="court-empty">
                    <div className="court-empty-icon">📭</div>
                    <h4>No Judgments Yet</h4>
                    <p>Deliver your first judgment from the Cases tab</p>
                  </div>
                ) : (
                  <div className="court-judgments-list">
                    {judgments.map((judgment, idx) => (
                      <div
                        key={judgment.judgment_id}
                        className={`court-judgment-card ${hoveredJudgment === judgment.judgment_id ? "hovered" : ""}`}
                        onMouseEnter={() =>
                          setHoveredJudgment(judgment.judgment_id)
                        }
                        onMouseLeave={() => setHoveredJudgment(null)}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="court-judgment-header">
                          <div className="court-judgment-info">
                            <span className="court-judgment-number">
                              {judgment.judgment_number}
                            </span>
                            {getVerdictBadge(judgment.verdict)}
                          </div>
                          <span className="court-judgment-date">
                            {new Date(judgment.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="court-judgment-details">
                          <p>
                            <strong>Case:</strong> {judgment.case_number} -{" "}
                            {judgment.case_title}
                          </p>
                          <p>
                            <strong>Judge:</strong> {judgment.judge_name}
                          </p>
                          <p>
                            <strong>Sentence:</strong>{" "}
                            {judgment.sentence || "None"}
                          </p>
                        </div>

                        <details className="court-details">
                          <summary>⚖️ View Reasoning</summary>
                          <div className="court-reasoning">
                            {judgment.reasoning}
                          </div>
                        </details>

                        <details className="court-details">
                          <summary>🔗 Document Details</summary>
                          <div className="court-ipfs-details">
                            {judgment.cloudinary_url && (
                              <div>
                                <strong>Document URL:</strong>{" "}
                                <code>{judgment.cloudinary_url}</code>
                              </div>
                            )}
                            <div>
                              <strong>Hash:</strong>{" "}
                              <code>{judgment.hash}</code>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEARCH CASES TAB */}
          {activeTab === "search" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">🔍</div>
                  <div>
                    <h3>Search Cases</h3>
                    <p>Find cases by number, title, or status</p>
                  </div>
                </div>
                <div className="court-search-form">
                  <div className="court-search-grid">
                    <div className="court-form-group">
                      <label>Keyword</label>
                      <div className="court-input-wrapper">
                        <span className="court-input-icon">🔍</span>
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Case number, title..."
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSearch()
                          }
                        />
                      </div>
                    </div>
                    <div className="court-form-group">
                      <label className="court-form-label">Status</label>
                      <div className="court-select-wrapper">
                        <select
                          value={searchStatus}
                          onChange={(e) => setSearchStatus(e.target.value)}
                          className="court-select-custom"
                        >
                          <option value="">All Status</option>
                          <option value="SUBMITTED_TO_COURT">
                            Submitted to Court
                          </option>
                          <option value="UNDER_COURT_REVIEW">
                            Under Review
                          </option>
                          <option value="DECIDED">Decided</option>
                        </select>
                        <span className="court-select-icon">📋</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="court-btn court-btn-primary"
                    onClick={handleSearch}
                  >
                    🔍 Search Cases
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="court-search-results">
                    <h4>Search Results ({searchResults.length})</h4>
                    <div className="court-results-list">
                      {searchResults.map((result) => (
                        <div key={result.case_id} className="court-result-card">
                          <div className="court-result-header">
                            <strong>{result.case_number}</strong>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="court-result-title">{result.title}</p>
                          <div className="court-result-meta">
                            <span>Complainant: {result.complainant_name}</span>
                            <span>
                              Filed:{" "}
                              {new Date(result.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                  <div className="court-empty-small">
                    <span>🔍</span>
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VERIFY EVIDENCE TAB */}
          {activeTab === "verify" && (
            <div className="court-section court-fade-up">
              <div className="court-card">
                <div className="court-card-header">
                  <div className="court-card-icon">🔐</div>
                  <div>
                    <h3>Verify Evidence Authenticity</h3>
                    <p>Verify evidence by file upload or hash</p>
                  </div>
                </div>

                <div className="court-form">
                  <div className="court-form-group">
                    <label className="court-form-label">
                      📁 Step 1: Select Case
                    </label>
                    <div className="court-select-wrapper">
                      <select
                        value={verifyCaseId}
                        onChange={async (e) => {
                          const caseId = e.target.value;
                          setVerifyCaseId(caseId);
                          setVerifySelectedEvidence(null);
                          setVerifyEvidenceList([]);
                          setVerifyTimeline(null);
                          setVerifyResultMsg("");
                          setVerificationDetails(null);
                          setVerifyFile(null);
                          setVerifyManualHash("");
                          if (caseId && caseId !== "") {
                            await loadEvidenceForCase(caseId);
                          }
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="court-select-custom"
                      >
                        <option value="">-- Select Case --</option>
                        {cases.map((caseItem) => (
                          <option
                            key={caseItem.case_id}
                            value={caseItem.case_id}
                          >
                            {caseItem.case_number} - {caseItem.title}
                          </option>
                        ))}
                      </select>
                      <span className="court-select-icon">⚖️</span>
                    </div>
                  </div>

                  <div className="court-form-group">
                    <label className="court-form-label">
                      📋 Step 2: Select Evidence
                    </label>
                    <div className="court-select-wrapper">
                      <select
                        value={verifySelectedEvidence?.evidence_id || ""}
                        onChange={async (e) => {
                          const evId = e.target.value;
                          const ev = verifyEvidenceList.find(
                            (ev) => ev.evidence_id === evId,
                          );
                          setVerifySelectedEvidence(ev || null);
                          setVerifyManualHash("");
                          setVerifyFile(null);
                          setVerifyResultMsg("");
                          setVerificationDetails(null);
                          if (evId && evId !== "") {
                            await loadEvidenceTimeline(evId);
                          } else {
                            setVerifyTimeline(null);
                          }
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        disabled={
                          !verifyCaseId || verifyEvidenceList.length === 0
                        }
                        className="court-select-custom"
                      >
                        <option value="">-- Select Evidence --</option>
                        {verifyEvidenceList.length === 0 ? (
                          <option disabled>No evidence found</option>
                        ) : (
                          verifyEvidenceList.map((ev) => (
                            <option key={ev.evidence_id} value={ev.evidence_id}>
                              {ev.title} - {ev.status}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="court-select-icon">📦</span>
                    </div>
                    {verifyCaseId && verifyEvidenceList.length === 0 && (
                      <p className="court-hint-warning">
                        ⚠️ No evidence found for this case
                      </p>
                    )}
                  </div>
                </div>

                {/* Evidence Details */}
                {verifySelectedEvidence && (
                  <div className="court-evidence-details">
                    <h4>📄 Evidence Details</h4>
                    <div className="court-evidence-grid">
                      <div>
                        <strong>ID:</strong>{" "}
                        <code>{verifySelectedEvidence.evidence_id}</code>
                      </div>
                      <div>
                        <strong>Title:</strong> {verifySelectedEvidence.title}
                      </div>
                      <div>
                        <strong>Description:</strong>{" "}
                        {verifySelectedEvidence.description}
                      </div>
                      <div>
                        <strong>Status:</strong> {verifySelectedEvidence.status}
                      </div>
                      <div>
                        <strong>Created By:</strong>{" "}
                        {verifySelectedEvidence.created_by}
                      </div>
                      <div>
                        <strong>Created At:</strong>{" "}
                        {new Date(
                          verifySelectedEvidence.created_at,
                        ).toLocaleString()}
                      </div>
                      <div>
                        <strong>Stored Hash:</strong>{" "}
                        <code className="court-hash">
                          {verifySelectedEvidence.hash}
                        </code>
                      </div>
                      {selectedForensicReport.cloudinary_url && (
                        <div className="forensic-section">
                          <strong>Cloudinary URL:</strong>{" "}
                          <code>{selectedForensicReport.cloudinary_url}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chain of Custody Timeline */}
                {verifyTimeline && verifyTimeline.length > 0 && (
                  <div className="court-timeline">
                    <h4>📅 Chain of Custody Timeline</h4>
                    <div className="court-timeline-list">
                      {verifyTimeline.map((event, idx) => (
                        <div key={idx} className="court-timeline-item">
                          <div
                            className="court-timeline-dot"
                            style={{ background: event.color || "#6366f1" }}
                          />
                          <div className="court-timeline-content">
                            <div className="court-timeline-header">
                              <strong>{event.title}</strong>
                              <span>
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="court-timeline-desc">
                              {event.description}
                            </div>
                            <div className="court-timeline-by">
                              By: {event.by}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Section */}
                {verifySelectedEvidence && (
                  <div className="court-verify-section">
                    <h4>🔐 Verify This Evidence</h4>
                    <div className="court-verify-grid">
                      <div className="court-verify-box">
                        <div className="court-verify-icon">📂</div>
                        <h5>Upload Original File</h5>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            setVerifyFile(e.target.files?.[0] || null);
                            setVerifyManualHash("");
                            setVerifyResultMsg("");
                            setVerificationDetails(null);
                          }}
                          className="court-file-input"
                        />
                        <button
                          className="court-btn court-btn-success court-btn-block"
                          onClick={handleVerifyEvidenceByFile}
                          disabled={!verifyFile}
                        >
                          🔐 Verify File
                        </button>
                      </div>

                      <div className="court-verify-box">
                        <div className="court-verify-icon">🔑</div>
                        <h5>Enter Hash</h5>
                        <input
                          type="text"
                          value={verifyManualHash}
                          onChange={(e) => {
                            setVerifyManualHash(e.target.value);
                            setVerifyFile(null);
                            setVerifyResultMsg("");
                            setVerificationDetails(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          placeholder="Enter 64-character SHA-256 hash"
                          className="court-hash-input"
                        />
                        <button
                          className="court-btn court-btn-primary court-btn-block"
                          onClick={handleVerifyEvidenceByHash}
                          disabled={!verifyManualHash}
                        >
                          🔐 Verify Hash
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Result */}
                {verifyResultMsg && (
                  <div
                    className={`court-verify-result ${verifyResultMsg.includes("✅") ? "success" : "error"}`}
                  >
                    <div className="court-verify-result-icon">
                      {verifyResultMsg.includes("✅") ? "✅" : "❌"}
                    </div>
                    <div className="court-verify-result-content">
                      <h4>
                        {verifyResultMsg.includes("✅")
                          ? "Verification Passed!"
                          : "Verification Failed!"}
                      </h4>
                      <p>{verifyResultMsg}</p>
                      {verificationDetails && (
                        <div className="court-verify-details">
                          <div>
                            <strong>Stored Hash:</strong>{" "}
                            <code>{verificationDetails.stored_hash}</code>
                          </div>
                          <div>
                            <strong>Provided Hash:</strong>{" "}
                            <code>
                              {verificationDetails.uploaded_hash ||
                                verificationDetails.provided_hash}
                            </code>
                          </div>
                          <div>
                            <strong>Verified at:</strong>{" "}
                            {new Date(
                              verificationDetails.verification_time,
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu-panel ${sidebarOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-user">
            <div className="mobile-menu-avatar">⚖️</div>
            <div>
              <div className="mobile-menu-name">Court Officer</div>
              <div className="mobile-menu-role">Judicial Branch</div>
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
      {sidebarOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* JUDGMENT MODAL */}
      {showJudgmentModal && selectedCase && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowJudgmentModal(false);
            setSelectedCase(null);
            setSelectedSuspectId("");
            setSelectedSuspectName("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚖️ Deliver Judgment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowJudgmentModal(false);
                  setSelectedCase(null);
                  setSelectedSuspectId("");
                  setSelectedSuspectName("");
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Case:</strong> {selectedCase.case_number} -{" "}
                {selectedCase.title}
              </p>

              {/* ============ SUSPECT DROPDOWN - NEW ============ */}
              <div className="form-group">
                <label>👤 Select Accused/Suspect Person *</label>
                <select
                  value={selectedSuspectId}
                  onChange={(e) => {
                    const suspectId = e.target.value;
                    setSelectedSuspectId(suspectId);
                    const suspect = selectedCase.suspects?.find(
                      (s) =>
                        s.id === suspectId || s.id?.toString() === suspectId,
                    );
                    if (suspect) {
                      setSelectedSuspectName(suspect.name);
                    }
                  }}
                  className="court-select-custom"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <option value="">-- Select Accused Person --</option>
                  {selectedCase.suspects && selectedCase.suspects.length > 0 ? (
                    selectedCase.suspects.map((suspect, idx) => (
                      <option key={suspect.id || idx} value={suspect.id || idx}>
                        👤 {suspect.name} -{" "}
                        {suspect.description?.substring(0, 50) ||
                          "No description"}
                      </option>
                    ))
                  ) : (
                    <option disabled>No suspects added to this case</option>
                  )}
                </select>
                {selectedCase.suspects &&
                  selectedCase.suspects.length === 0 && (
                    <p
                      className="warning-text"
                      style={{
                        fontSize: "0.7rem",
                        marginTop: "8px",
                        color: "#f59e0b",
                      }}
                    >
                      ⚠️ No suspects have been added to this case yet. Judgment
                      cannot be delivered without selecting an accused person.
                    </p>
                  )}
              </div>
              {/* ============ END SUSPECT DROPDOWN ============ */}

              <div className="form-group">
                <label>Verdict *</label>
                <select
                  value={judgmentVerdict}
                  onChange={(e) => setJudgmentVerdict(e.target.value)}
                >
                  <option value="">-- Select Verdict --</option>
                  <option value="GUILTY">🔴 GUILTY</option>
                  <option value="NOT_GUILTY">🟢 NOT GUILTY</option>
                  <option value="ACQUITTED">🔵 ACQUITTED</option>
                  <option value="CONVICTED">⚫ CONVICTED</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sentence</label>
                <input
                  value={judgmentSentence}
                  onChange={(e) => setJudgmentSentence(e.target.value)}
                  placeholder="e.g., 5 years imprisonment, fine of Rs. 50,000"
                />
              </div>
              <div className="form-group">
                <label>Reasoning *</label>
                <textarea
                  value={judgmentReasoning}
                  onChange={(e) => setJudgmentReasoning(e.target.value)}
                  rows={5}
                  placeholder="Detailed reasoning for the judgment..."
                />
              </div>
              <div className="form-group">
                <label>Punishment Details</label>
                <textarea
                  value={judgmentPunishment}
                  onChange={(e) => setJudgmentPunishment(e.target.value)}
                  rows={3}
                  placeholder="Specific punishment details..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="court-btn court-btn-secondary"
                onClick={() => {
                  setShowJudgmentModal(false);
                  setSelectedCase(null);
                  setSelectedSuspectId("");
                  setSelectedSuspectName("");
                }}
              >
                Cancel
              </button>
              <button
                className="court-btn court-btn-danger"
                onClick={handleDeliverJudgment}
                disabled={
                  !selectedSuspectId || !judgmentVerdict || !judgmentReasoning
                }
              >
                ⚖️ Deliver Judgment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEARING MODAL */}
      {showHearingModal && selectedCase && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowHearingModal(false);
            setSelectedCase(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎙️ Schedule Hearing</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowHearingModal(false);
                  setSelectedCase(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Case:</strong> {selectedCase.case_number}
              </p>
              <div className="form-group">
                <label className="court-form-label">Hearing Date *</label>
                <div className="court-date-wrapper">
                  <span className="court-date-icon">📅</span>
                  <input
                    type="date"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="court-date-input"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="court-form-label">Hearing Time *</label>
                <div className="court-time-wrapper">
                  <span className="court-time-icon">⏰</span>
                  <input
                    type="time"
                    value={hearingTime}
                    onChange={(e) => setHearingTime(e.target.value)}
                    className="court-time-input"
                    step="900"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="court-form-label">Hearing Type</label>
                <div className="court-select-wrapper">
                  <select
                    value={hearingType}
                    onChange={(e) => setHearingType(e.target.value)}
                    className="court-select-custom"
                  >
                    <option value="VIRTUAL">💻 Virtual (Online)</option>
                    <option value="PHYSICAL">🏛️ Physical (In-Person)</option>
                  </select>
                  <span className="court-select-icon">⚖️</span>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={hearingNotes}
                  onChange={(e) => setHearingNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="court-btn court-btn-secondary"
                onClick={() => {
                  setShowHearingModal(false);
                  setSelectedCase(null);
                }}
              >
                Cancel
              </button>
              <button
                className="court-btn court-btn-success"
                onClick={handleScheduleHearing}
              >
                📅 Schedule Hearing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE REVIEW MODAL */}
      {showEvidenceModal && selectedEvidence && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowEvidenceModal(false);
            setSelectedEvidence(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Review Evidence</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEvidenceModal(false);
                  setSelectedEvidence(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Evidence:</strong> {selectedEvidence.title}
              </p>
              <p className="evidence-desc">{selectedEvidence.description}</p>
              <div className="form-group">
                <label>Admissibility</label>
                <select
                  value={evidenceAdmissible ? "true" : "false"}
                  onChange={(e) =>
                    setEvidenceAdmissible(e.target.value === "true")
                  }
                >
                  <option value="true">✅ Admissible</option>
                  <option value="false">❌ Inadmissible</option>
                </select>
              </div>
              <div className="form-group">
                <label>Review Notes *</label>
                <textarea
                  value={evidenceReviewNotes}
                  onChange={(e) => setEvidenceReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Your review notes..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="court-btn court-btn-secondary"
                onClick={() => {
                  setShowEvidenceModal(false);
                  setSelectedEvidence(null);
                }}
              >
                Cancel
              </button>
              <button
                className="court-btn court-btn-primary"
                onClick={handleReviewEvidence}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORENSIC REPORT MODAL */}
      {showForensicModal && selectedForensicReport && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowForensicModal(false);
            setSelectedForensicReport(null);
          }}
        >
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                📊 Forensic Report: {selectedForensicReport.report_number}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowForensicModal(false);
                  setSelectedForensicReport(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="forensic-report-details">
                <div className="forensic-section">
                  <strong>Evidence:</strong>{" "}
                  {selectedForensicReport.evidence_title}
                </div>
                <div className="forensic-section">
                  <strong>Analysis Type:</strong>{" "}
                  {selectedForensicReport.analysis_type}
                </div>
                <div className="forensic-section">
                  <strong>Analyst:</strong>{" "}
                  {selectedForensicReport.analyst_name} (
                  {selectedForensicReport.analyst_email})
                </div>
                <div className="forensic-section">
                  <strong>Created:</strong>{" "}
                  {new Date(selectedForensicReport.created_at).toLocaleString()}
                </div>
                <div className="forensic-section">
                  <strong>Findings:</strong>
                  <div className="forensic-content">
                    {selectedForensicReport.findings}
                  </div>
                </div>
                <div className="forensic-section">
                  <strong>Conclusion:</strong>
                  <div className="forensic-content">
                    {selectedForensicReport.conclusion}
                  </div>
                </div>
                <details className="forensic-details">
                  <summary>🔗 Document Details</summary>
                  {selectedForensicReport.cloudinary_url && (
                    <div>
                      <strong>Cloudinary URL:</strong>{" "}
                      <code>{selectedForensicReport.cloudinary_url}</code>
                    </div>
                  )}
                  <div>
                    <strong>Hash:</strong>{" "}
                    <code>{selectedForensicReport.hash}</code>
                  </div>
                </details>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="court-btn court-btn-secondary"
                onClick={() => {
                  setShowForensicModal(false);
                  setSelectedForensicReport(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE MODAL */}
      {showTimelineModal && timelineData && selectedTimelineCase && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowTimelineModal(false);
            setTimelineData(null);
          }}
        >
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                📅 Complete Case Timeline: {selectedTimelineCase.case_number}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowTimelineModal(false);
                  setTimelineData(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body timeline-modal-body">
              {/* Progress */}
              <div className="timeline-progress">
                <div className="progress-header">
                  <span>Case Progress</span>
                  <span>{timelineData.progress_percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${timelineData.progress_percentage}%` }}
                  />
                </div>
                <div className="progress-stage">
                  <span>📍 Current Stage: {timelineData.current_stage}</span>
                </div>
              </div>

              {/* Timeline Events */}
              <div className="timeline-events-list">
                {timelineData.timeline?.map((event: any, idx: number) => (
                  <div
                    key={idx}
                    className={`timeline-event-item ${event.type === "case_level" ? "case-level" : "evidence-level"}`}
                  >
                    <div className="timeline-event-icon">{event.icon}</div>
                    <div className="timeline-event-content">
                      <div className="timeline-event-header">
                        <strong>{event.event}</strong>
                        <span className="timeline-event-date">
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="timeline-event-desc">{event.description}</p>
                      <div className="timeline-event-by">
                        By: {event.by || "System"}
                      </div>
                      {event.evidence_title && (
                        <div className="timeline-event-evidence">
                          📦 Evidence: {event.evidence_title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="court-btn court-btn-secondary"
                onClick={() => {
                  setShowTimelineModal(false);
                  setTimelineData(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Court Dashboard Styles - Indigo Theme */
        .court-dashboard {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --border-light: rgba(255, 255, 255, 0.06);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
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

        /* Background Effects - Same as dashboard */
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

        /* Loading */
        .court-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep);
          gap: 16px;
        }

        .court-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .court-loading p {
          color: #7a849c;
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
        }

        .dashboard-logo {
          display: flex;
          align-items: center;
          gap: 10px;
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
          font-size: 0.8rem;
          font-weight: 500;
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

        .dashboard-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .dashboard-sidebar::-webkit-scrollbar-track {
          background: rgba(99, 102, 241, 0.05);
        }

        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 3px;
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

        /* Court Stats */
        .court-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 0 2rem;
          margin-top: 24px;
        }

        @media (max-width: 900px) {
          .court-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .court-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .court-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .court-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .court-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .court-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .court-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        .court-stat-sub {
          font-size: 0.65rem;
          color: #3d4459;
          margin-top: 2px;
        }

        /* Court Section */
        .court-section {
          padding: 0 2rem 2rem;
        }

        @media (max-width: 768px) {
          .court-section {
            padding: 0 1rem 1rem;
          }
        }

        .court-fade-up {
          animation: fadeUp 0.4s ease-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Court Cards */
        .court-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .court-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .court-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .court-card-header.small {
          margin-bottom: 16px;
          padding-bottom: 10px;
        }

        .court-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .court-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .court-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Dashboard Grid */
        .court-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .court-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .court-dashboard-section h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 16px;
        }

        .court-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .court-breakdown-item {
          width: 100%;
        }

        .court-breakdown-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .court-verdict-guilty {
          color: #ef4444;
        }

        .court-verdict-not_guilty, .court-verdict-acquitted {
          color: #10b981;
        }

        .court-priority-high {
          color: #ef4444;
        }

        .court-priority-medium {
          color: #f59e0b;
        }

        .court-priority-low {
          color: #10b981;
        }

        .court-breakdown-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .court-progress-bar {
          height: 6px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .court-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        /* Actions Grid */
        .court-actions-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Buttons */
        .court-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .court-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .court-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .court-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .court-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .court-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .court-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .court-btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
        }

        .court-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .court-btn-small {
          padding: 4px 12px;
          font-size: 0.7rem;
        }

        .court-btn-block {
          width: 100%;
        }

        /* Toast */
        .court-toast {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: toastIn 0.3s ease-out;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .court-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .court-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Case Card */
        .court-cases-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .court-case-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px 24px;
          transition: all 0.3s;
          animation: slideIn 0.3s ease-out backwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .court-case-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .court-case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .court-case-info {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .court-case-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .status-badge, .priority-badge, .verdict-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .court-case-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #e8ecf8;
        }

        .court-case-desc {
          font-size: 0.85rem;
          color: #7a849c;
          margin-bottom: 16px;
        }

        .court-case-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .court-case-details-grid div {
          font-size: 0.75rem;
          color: #7a849c;
        }

        .court-case-details-grid strong {
          color: #e8ecf8;
        }

        .court-details {
          margin-top: 12px;
        }

        .court-details summary {
          cursor: pointer;
          font-size: 0.8rem;
          color: #818cf8;
          list-style: none;
        }

        .court-details summary::-webkit-details-marker {
          display: none;
        }

        .court-evidence-list, .court-list {
          margin-top: 12px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
        }

        .court-evidence-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 10px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        }

        .court-evidence-item:last-child {
          border-bottom: none;
        }

        .court-evidence-desc {
          font-size: 0.7rem;
          color: #3d4459;
          margin-top: 2px;
        }

        .court-evidence-actions {
          display: flex;
          gap: 8px;
        }

        .court-list-item {
          padding: 8px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          font-size: 0.8rem;
          color: #7a849c;
        }

        .court-case-actions {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        /* Judgments List */
        .court-judgments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .court-judgment-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
          animation: slideIn 0.3s ease-out backwards;
        }

        .court-judgment-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .court-judgment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .court-judgment-info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .court-judgment-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .court-judgment-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .court-judgment-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          margin: 12px 0;
          font-size: 0.8rem;
          color: #7a849c;
        }

        .court-reasoning, .court-ipfs-details {
          margin-top: 12px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 8px;
          font-size: 0.8rem;
          color: #7a849c;
        }

        /* Search Form */
        .court-search-form {
          margin-bottom: 24px;
        }

        .court-search-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 600px) {
          .court-search-grid {
            grid-template-columns: 1fr;
          }
        }

        .court-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .court-form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .court-input-wrapper, .court-select-wrapper {
          position: relative;
        }

        .court-input-icon, .court-select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .court-input-wrapper input, .court-select-wrapper select {
          width: 100%;
          padding: 10px 12px 10px 36px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
        }

        .court-input-wrapper input:focus, .court-select-wrapper select:focus {
          outline: none;
          border-color: #6366f1;
        }

        /* Search Results */
        .court-search-results {
          margin-top: 24px;
        }

        .court-search-results h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 16px;
        }

        .court-results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .court-result-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 16px;
        }

        .court-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .court-result-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e8ecf8;
          margin: 8px 0;
        }

        .court-result-meta {
          display: flex;
          gap: 16px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .court-empty-small {
          text-align: center;
          padding: 40px;
          color: #7a849c;
        }

        /* Evidence Details */
        .court-evidence-details {
          margin-top: 20px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
        }

        .court-evidence-details h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
        }

        .court-evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .court-evidence-grid div {
          font-size: 0.8rem;
          color: #7a849c;
        }

        .court-evidence-grid code {
          font-size: 0.7rem;
          word-break: break-all;
        }

        .court-hash, .court-cid {
          font-size: 0.7rem;
          word-break: break-all;
        }

        /* Timeline */
        .court-timeline {
          margin-top: 20px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }

        .court-timeline h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #10b981;
          margin-bottom: 16px;
        }

        .court-timeline-list {
          position: relative;
          padding-left: 20px;
        }

        .court-timeline-item {
          position: relative;
          padding-bottom: 20px;
          padding-left: 20px;
          border-left: 2px solid rgba(99, 102, 241, 0.2);
        }

        .court-timeline-item:last-child {
          padding-bottom: 0;
        }

        .court-timeline-dot {
          position: absolute;
          left: -6px;
          top: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .court-timeline-header {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .court-timeline-header strong {
          font-size: 0.8rem;
          color: #e8ecf8;
        }

        .court-timeline-header span {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .court-timeline-desc {
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 4px;
        }

        .court-timeline-by {
          font-size: 0.65rem;
          color: #3d4459;
        }

        /* Verify Section */
        .court-verify-section {
          margin-top: 24px;
        }

        .court-verify-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 16px;
        }

        .court-verify-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .court-verify-grid {
            grid-template-columns: 1fr;
          }
        }

        .court-verify-box {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          text-align: center;
        }

        .court-verify-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .court-verify-box h5 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 16px;
        }

        .court-file-input, .court-hash-input {
          width: 100%;
          padding: 10px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        /* Verify Result */
        .court-verify-result {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 20px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .court-verify-result.success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .court-verify-result.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .court-verify-result-icon {
          font-size: 2rem;
        }

        .court-verify-result-content h4 {
          margin: 0 0 8px 0;
          font-size: 1rem;
        }

        .court-verify-result.success h4 {
          color: #4ade80;
        }

        .court-verify-result.error h4 {
          color: #f87171;
        }

        .court-verify-result-content p {
          font-size: 0.85rem;
          margin: 0 0 12px 0;
        }

        .court-verify-details {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .court-verify-details code {
          font-size: 0.65rem;
          word-break: break-all;
        }

        /* Modal */
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
          z-index: 1000;
        }

        .modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }

        .modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }

        .modal-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1rem;
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #6366f1;
        }

        .evidence-desc {
          font-size: 0.8rem;
          color: #7a849c;
          margin-bottom: 16px;
        }

        /* Empty State */
        .court-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .court-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .court-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .court-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        .modal-large {
  max-width: 700px !important;
}

.forensic-report-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forensic-section {
  background: rgba(7, 9, 14, 0.5);
  padding: 12px;
  border-radius: 8px;
}

.forensic-section strong {
  display: block;
  margin-bottom: 8px;
  color: #818cf8;
}

.forensic-content {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #7a849c;
  line-height: 1.5;
  white-space: pre-wrap;
}

.forensic-details {
  margin-top: 8px;
}

.forensic-details summary {
  cursor: pointer;
  color: #818cf8;
  font-size: 0.8rem;
}

.court-forensic-list {
  margin-top: 12px;
  padding: 12px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 10px;
}

.court-forensic-item {
  padding: 12px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.08);
}

.court-forensic-item:last-child {
  border-bottom: none;
}

.court-forensic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.court-badge {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
}

.court-forensic-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  font-size: 0.75rem;
  color: #7a849c;
  margin-bottom: 12px;
}

.court-forensic-actions {
  display: flex;
  gap: 8px;
}

/* Timeline Modal Styles */
.timeline-modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.timeline-progress {
  background: rgba(7, 9, 14, 0.5);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #7a849c;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 4px;
  transition: width 0.5s;
}

.progress-stage {
  margin-top: 12px;
  font-size: 0.8rem;
  color: #818cf8;
}

.timeline-events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-event-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  background: rgba(7, 9, 14, 0.5);
  border-radius: 12px;
}

.timeline-event-item.case-level {
  border-left: 3px solid #10b981;
}

.timeline-event-item.evidence-level {
  border-left: 3px solid #6366f1;
}

.timeline-event-icon {
  font-size: 1.3rem;
}

.timeline-event-content {
  flex: 1;
}

.timeline-event-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.timeline-event-header strong {
  font-size: 0.85rem;
  color: #e8ecf8;
}

.timeline-event-date {
  font-size: 0.7rem;
  color: #3d4459;
}

.timeline-event-desc {
  font-size: 0.75rem;
  color: #7a849c;
  margin: 4px 0;
}

.timeline-event-by {
  font-size: 0.65rem;
  color: #3d4459;
}

.timeline-event-evidence {
  font-size: 0.7rem;
  color: #818cf8;
  margin-top: 6px;
}

/* Case Header Actions */
.court-case-header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.court-btn-small {
  padding: 6px 12px;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .court-case-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .court-case-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .court-btn-small {
    flex: 1;
    text-align: center;
  }
}
  /* Additional Mobile Responsive Fixes */
@media (max-width: 480px) {
  .court-case-header-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .court-btn-small {
    width: 100%;
    text-align: center;
  }
  
  .court-case-details-grid {
    grid-template-columns: 1fr;
  }
  
  .court-evidence-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .court-forensic-details {
    grid-template-columns: 1fr;
  }
  
  .court-forensic-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .timeline-event-item {
    flex-direction: column;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
  
  .court-stats-grid {
    gap: 12px;
  }
  
  .court-stat-card {
    padding: 12px;
  }
  
  .court-stat-value {
    font-size: 1.2rem;
  }
}
  /* Custom Select Dropdown Styling */
.court-select-custom {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.85rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s;
}

.court-select-custom:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(12, 15, 26, 0.9);
}

.court-select-custom:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.court-select-custom option {
  background: #0c0f1a;
  padding: 10px;
}

/* Form Label */
.court-form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 8px;
  display: block;
}

/* Date and Time Pickers */
.court-date-wrapper, .court-time-wrapper {
  position: relative;
}

.court-date-icon, .court-time-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
  z-index: 2;
}

.court-date-input, .court-time-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.court-date-input:hover, .court-time-input:hover {
  border-color: rgba(99, 102, 241, 0.5);
}

.court-date-input:focus, .court-time-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Calendar popup styling */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.6;
  cursor: pointer;
}

input[type="date"]::-webkit-calendar-picker-indicator:hover,
input[type="time"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Hearing Filters */
.hearing-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 20px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  color: #7a849c;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

/* Hearings List */
.hearings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.hearing-card {
  background: rgba(7, 9, 14, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.3s;
  animation: fadeIn 0.3s ease-out backwards;
}

.hearing-card.completed {
  opacity: 0.8;
  background: rgba(7, 9, 14, 0.3);
}

.hearing-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.hearing-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.hearing-case-number {
  font-weight: 700;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.12);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  margin-right: 10px;
}

.hearing-datetime {
  font-size: 0.8rem;
  color: #7a849c;
}

.hearing-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 8px 0;
  color: #e8ecf8;
}

.hearing-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin: 12px 0;
  font-size: 0.8rem;
  color: #7a849c;
}

.hearing-details strong {
  color: #e8ecf8;
}

.hearing-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.join-btn {
  display: inline-block;
  padding: 8px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.case-selector {
  margin-bottom: 20px;
}

.case-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
  color: #e8ecf8;
  font-size: 0.9rem;
}
      `}</style>
    </div>
  );
}
