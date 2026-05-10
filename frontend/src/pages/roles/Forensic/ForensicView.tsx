// frontend/src/pages/roles/Forensic/ForensicView.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../shared/env";
import { ForensicChainCustody } from "./components/ForensicChainCustody";
import { ForensicCaseQueue } from "./components/ForensicCaseQueue";
import { ForensicAcceptedCases } from "./components/ForensicAcceptedCases";
import { ForensicShareReport } from "./components/ForensicShareReport";

type ForensicViewProps = {
  verifyEvidenceId: string;
  verifyHash: string;
  verifyResult: string;
  forensicEvidenceId: string;
  forensicText: string;
  transferReportId: string;
  evidence: any[];
  setVerifyEvidenceId: (value: string) => void;
  setVerifyHash: (value: string) => void;
  setForensicEvidenceId: (value: string) => void;
  setForensicText: (value: string) => void;
  setTransferReportId: (value: string) => void;
  verifyEvidence: () => void;
  createForensicReport: () => void;
  transferReportToCourt: () => void;
};

export function ForensicView(props: ForensicViewProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [queue, setQueue] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Analysis Tab States
  const [analysisCases, setAnalysisCases] = useState<any[]>([]);
  const [selectedAnalysisCase, setSelectedAnalysisCase] = useState("");
  const [analysisEvidenceList, setAnalysisEvidenceList] = useState<any[]>([]);
  const [selectedAnalysisEvidence, setSelectedAnalysisEvidence] =
    useState<any>(null);
  const [analysisType, setAnalysisType] = useState("DIGITAL_FORENSICS");
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [equipment, setEquipment] = useState("");
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  // Reports Tab States
  const [reportsCases, setReportsCases] = useState<any[]>([]);
  const [selectedReportCase, setSelectedReportCase] = useState("");
  const [reportsEvidenceList, setReportsEvidenceList] = useState<any[]>([]);
  const [selectedReportEvidence, setSelectedReportEvidence] = useState("");
  const [filteredReports, setFilteredReports] = useState<any[]>([]);

  // Verify Evidence States
  const [verifyCases, setVerifyCases] = useState<any[]>([]);
  const [verifyCaseId, setVerifyCaseId] = useState("");
  const [verifyEvidenceList, setVerifyEvidenceList] = useState<any[]>([]);
  const [verifySelectedEvidence, setVerifySelectedEvidence] =
    useState<any>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyManualHash, setVerifyManualHash] = useState("");
  const [verifyResultMsg, setVerifyResultMsg] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<any>(null);

  // Report Modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [message, setMessage] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("justice_token");

  // Sidebar navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", badge: null },
    { id: "case-queue", label: "Case Queue", icon: "📋", badge: null },
    { id: "accepted-cases", label: "Accepted Cases", icon: "✅", badge: null },
    { id: "analyze", label: "New Analysis", icon: "🔬", badge: null },
    { id: "reports", label: "My Reports", icon: "📄", badge: myReports.length },
    { id: "verify", label: "Verify Evidence", icon: "🔐", badge: null },
    { id: "chain", label: "Chain of Custody", icon: "🔗", badge: null },
    { id: "share", label: "Share Report", icon: "📤", badge: null },
    { id: "templates", label: "Templates", icon: "📝", badge: null },
  ];

  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "case-queue", label: "Queue", icon: "📋" },
    { id: "accepted-cases", label: "Accepted", icon: "✅" },
    { id: "analyze", label: "Analyze", icon: "🔬" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "verify", label: "Verify", icon: "🔐" },
    { id: "share", label: "Share", icon: "📤" },
  ];

  useEffect(() => {
    loadData();
    loadCases();
    loadReportsCases();
    loadVerifyCases();
  }, []);

  async function loadData() {
    try {
      const [queueData, reportsData, statsData] = await Promise.all([
        apiRequest<any[]>("/forensic/queue", { token }).catch((e) => {
          console.error("Queue API error:", e);
          return [];
        }),
        apiRequest<any[]>("/forensic/reports", { token }).catch(() => []),
        apiRequest<any>("/forensic/stats", { token }).catch(() => null),
      ]);
      console.log("Queue data received:", queueData); // Debug line
      setQueue(queueData);
      setMyReports(reportsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCases() {
    try {
      // Try multiple endpoints
      let cases = [];
      try {
        cases = await apiRequest<any[]>("/cases/list", { token });
      } catch {
        try {
          cases = await apiRequest<any[]>("/forensic/cases-list", { token });
        } catch {
          cases = await apiRequest<any[]>("/cases", { token });
        }
      }
      console.log("Cases loaded:", cases); // Debug
      setAnalysisCases(cases || []);
    } catch (err) {
      console.error("Error loading cases:", err);
      setAnalysisCases([]);
    }
  }

  async function loadReportsCases() {
    try {
      let cases = [];
      try {
        cases = await apiRequest<any[]>("/cases/list", { token });
      } catch {
        cases = await apiRequest<any[]>("/forensic/cases-list", { token });
      }
      setReportsCases(cases || []);
    } catch (err) {
      console.error(err);
      setReportsCases([]);
    }
  }

  async function loadVerifyCases() {
    try {
      let cases = [];
      try {
        cases = await apiRequest<any[]>("/cases/list", { token });
      } catch {
        cases = await apiRequest<any[]>("/forensic/cases-list", { token });
      }
      setVerifyCases(cases || []);
    } catch (err) {
      console.error(err);
      setVerifyCases([]);
    }
  }

  async function loadAnalysisEvidence(caseId: string) {
    if (!caseId) {
      setAnalysisEvidenceList([]);
      return;
    }
    setLoadingEvidence(true);
    try {
      let allEvidence = [];
      try {
        allEvidence = await apiRequest<any[]>(`/cases/${caseId}/evidence`, {
          token,
        });
      } catch {
        try {
          allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", {
            token,
          });
        } catch {
          const allCasesEvidence = await apiRequest<any[]>(
            "/cases/evidence/list",
            { token },
          );
          allEvidence = allCasesEvidence || [];
        }
      }
      const caseEvidence = allEvidence.filter((ev) => ev.case_id === caseId);
      setAnalysisEvidenceList(caseEvidence);
      if (caseEvidence.length === 0) {
        setMessage(`⚠️ No evidence found for this case.`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error in loadAnalysisEvidence:", err);
      setAnalysisEvidenceList([]);
    } finally {
      setLoadingEvidence(false);
    }
  }

  async function loadReportsEvidence(caseId: string) {
    if (!caseId) {
      setReportsEvidenceList([]);
      setFilteredReports([]);
      return;
    }
    try {
      // Get evidence for this case
      let allEvidence = [];
      try {
        allEvidence = await apiRequest<any[]>(`/cases/${caseId}/evidence`, {
          token,
        });
      } catch {
        try {
          allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", {
            token,
          });
        } catch {
          allEvidence = [];
        }
      }
      const caseEvidence = allEvidence.filter((ev) => ev.case_id === caseId);
      setReportsEvidenceList(caseEvidence);

      // Get reports for this case
      const allReports = await apiRequest<any[]>("/forensic/reports", {
        token,
      }).catch(() => []);
      const caseReports = allReports.filter((r) => r.case_id === caseId);
      setFilteredReports(caseReports);
    } catch (err) {
      console.error(err);
      setReportsEvidenceList([]);
      setFilteredReports([]);
    }
  }

  async function loadVerifyEvidenceByCase(caseId: string) {
    if (!caseId) {
      setVerifyEvidenceList([]);
      return;
    }
    try {
      const allEvidence = await apiRequest<any[]>(
        "/forensic/forensic-evidence",
        { token },
      ).catch(() => []);
      const caseEvidence = allEvidence.filter((ev) => ev.case_id === caseId);
      setVerifyEvidenceList(caseEvidence);
    } catch (err) {
      console.error(err);
      setVerifyEvidenceList([]);
    }
  }

  async function handleCreateReport() {
    if (!selectedAnalysisEvidence || !findings || !conclusion) {
      setMessage("❌ Please select evidence and fill findings & conclusion");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const result = await apiRequest<any>("/forensic/analyze", {
        method: "POST",
        token,
        body: {
          evidence_id: selectedAnalysisEvidence.evidence_id,
          analysis_type: analysisType,
          findings: findings,
          conclusion: conclusion,
          methodology: methodology, // ← ADD THIS
          equipment_used: equipment, // ← ADD THIS
        },
      });
      setMessage(`✅ Report created! Report ID: ${result.report_id}`);
      setSelectedAnalysisCase("");
      setSelectedAnalysisEvidence(null);
      setFindings("");
      setConclusion("");
      setMethodology("");
      setEquipment("");
      setAnalysisEvidenceList([]);
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to create report");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleFilterReports() {
    if (!selectedReportCase) {
      setFilteredReports([]);
      return;
    }
    if (selectedReportEvidence) {
      const reports = await apiRequest<any[]>(
        `/forensic/reports/by-case/${selectedReportCase}`,
        { token },
      ).catch(() => []);
      const evidenceReports = reports.filter(
        (r) => r.evidence_id === selectedReportEvidence,
      );
      setFilteredReports(evidenceReports);
    } else {
      const reports = await apiRequest<any[]>(
        `/forensic/reports/by-case/${selectedReportCase}`,
        { token },
      ).catch(() => []);
      setFilteredReports(reports);
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
        `${API_BASE_URL}/cases/evidence/verify-by-file?evidence_id=${verifySelectedEvidence.evidence_id}`,
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
      loadData();
    } catch (err) {
      setVerifyResultMsg(
        "❌ Verification failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  }

  async function handleVerifyEvidenceByHash() {
    if (!verifySelectedEvidence || !verifyManualHash) {
      setVerifyResultMsg("❌ Please select evidence and enter hash");
      return;
    }

    try {
      const result = await apiRequest<any>("/cases/evidence/verify", {
        method: "POST",
        token,
        body: {
          evidence_id: verifySelectedEvidence.evidence_id,
          provided_hash: verifyManualHash,
        },
      });
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        provided_hash: verifyManualHash,
        verification_time: result.verification_time,
      });
      setVerifyManualHash("");
      loadData();
    } catch (err) {
      setVerifyResultMsg(
        "❌ Verification failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  }

  useEffect(() => {
    if (selectedReportCase) {
      handleFilterReports();
    }
  }, [selectedReportCase, selectedReportEvidence]);

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
        className="fr-badge fr-priority"
        style={{ background: style.bg, color: style.color }}
      >
        {priority}
      </span>
    );
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string; icon: string }> =
      {
        PENDING: {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "#f59e0b",
          icon: "⏳",
        },
        IN_PROGRESS: {
          bg: "rgba(59, 130, 246, 0.12)",
          color: "#3b82f6",
          icon: "🔄",
        },
        COMPLETED: {
          bg: "rgba(16, 185, 129, 0.12)",
          color: "#10b981",
          icon: "✅",
        },
        TRANSFERRED_TO_COURT: {
          bg: "rgba(139, 92, 246, 0.12)",
          color: "#8b5cf6",
          icon: "📤",
        },
      };
    const style = colors[status] || {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
      icon: "📋",
    };
    return (
      <span
        className="fr-badge fr-status"
        style={{ background: style.bg, color: style.color }}
      >
        <span className="fr-status-icon">{style.icon}</span>
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="fr-loading">
        <div className="fr-spinner"></div>
        <p>Loading forensic dashboard...</p>
      </div>
    );
  }

  return (
    <div className="fr-dashboard">
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
            <div className="dashboard-logo-mark">🔬</div>
            <span className="dashboard-logo-text">Forensic Portal</span>
          </div>
        </div>
        <div className="dashboard-nav-right">
          <button
            onClick={() => {
              loadData();
              loadCases();
              loadReportsCases();
              loadVerifyCases();
            }}
            className="dashboard-refresh-btn"
          >
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
              <div className="dashboard-user-avatar">🔬</div>
              <div className="dashboard-user-details">
                <span className="dashboard-user-name">Forensic Analyst</span>
                <span className="dashboard-user-role">Digital Forensics</span>
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
                Evidence is stored on IPFS - Decentralized & Tamper-Proof
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

          {/* Welcome Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <div className="dashboard-welcome">
                <h1>
                  Forensic <span>Analysis Dashboard</span>
                </h1>
                <p>
                  Analyze evidence, generate reports, and verify authenticity
                </p>
              </div>
              <div className="dashboard-header-stats">
                <div className="header-stat">
                  <span className="header-stat-value">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="header-stat-label">Today</span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-value">🔬 Forensic</span>
                  <span className="header-stat-label">Role</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`fr-toast ${message.includes("✅") ? "fr-toast-success" : "fr-toast-error"}`}
            >
              <span>{message}</span>
            </div>
          )}

          {/* ============ TAB CONTENTS ============ */}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="fr-section fr-fade-up">
              <div className="fr-card">
                <div className="fr-card-header">
                  <div className="fr-card-icon">📊</div>
                  <div>
                    <h3>Forensic Dashboard</h3>
                    <p>Welcome to the Forensic Analysis Dashboard</p>
                  </div>
                </div>
                <div className="fr-dashboard-stats">
                  <div className="fr-dashboard-stat">
                    <span className="fr-dashboard-stat-icon">📋</span>
                    <div className="fr-dashboard-stat-value">
                      {stats?.pending_cases || 0}
                    </div>
                    <div className="fr-dashboard-stat-label">Pending Cases</div>
                  </div>
                  <div className="fr-dashboard-stat">
                    <span className="fr-dashboard-stat-icon">✅</span>
                    <div className="fr-dashboard-stat-value">
                      {stats?.accepted_cases || 0}
                    </div>
                    <div className="fr-dashboard-stat-label">
                      Accepted Cases
                    </div>
                  </div>
                  <div className="fr-dashboard-stat">
                    <span className="fr-dashboard-stat-icon">📄</span>
                    <div className="fr-dashboard-stat-value">
                      {stats?.my_reports || 0}
                    </div>
                    <div className="fr-dashboard-stat-label">
                      Reports Created
                    </div>
                  </div>
                  <div className="fr-dashboard-stat">
                    <span className="fr-dashboard-stat-icon">🔬</span>
                    <div className="fr-dashboard-stat-value">
                      {stats?.in_progress_evidence || 0}
                    </div>
                    <div className="fr-dashboard-stat-label">In Progress</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "case-queue" && <ForensicCaseQueue token={token!} />}

          {activeTab === "accepted-cases" && (
            <ForensicAcceptedCases token={token!} />
          )}

          {/* ANALYZE TAB */}
          {activeTab === "analyze" && (
            <div className="fr-section fr-fade-up">
              <div className="fr-card">
                <div className="fr-card-header">
                  <div className="fr-card-icon">🔬</div>
                  <div>
                    <h3>Forensic Analysis</h3>
                    <p>Generate detailed forensic analysis report</p>
                  </div>
                </div>
                <div className="fr-form">
                  {/* Step 1: Select Case */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📁 Step 1: Select Case
                    </label>
                    <div className="fr-select-wrapper">
                      <select
                        value={selectedAnalysisCase}
                        onChange={async (e) => {
                          const caseId = e.target.value;
                          setSelectedAnalysisCase(caseId);
                          setSelectedAnalysisEvidence(null);
                          setAnalysisEvidenceList([]);
                          if (caseId) {
                            await loadAnalysisEvidence(caseId);
                          }
                        }}
                        className="fr-select-custom"
                      >
                        <option value="">-- Select a Case --</option>
                        {analysisCases.length === 0 ? (
                          <option disabled>Loading cases...</option>
                        ) : (
                          analysisCases.map((caseItem) => (
                            <option
                              key={caseItem.case_id}
                              value={caseItem.case_id}
                            >
                              {caseItem.case_number} - {caseItem.title}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="fr-select-icon">⚖️</span>
                    </div>
                    {analysisCases.length === 0 && (
                      <p className="fr-hint-warning">⚠️ No cases found</p>
                    )}
                  </div>

                  {/* Step 2: Select Evidence */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📋 Step 2: Select Evidence
                    </label>
                    <div className="fr-select-wrapper">
                      <select
                        value={selectedAnalysisEvidence?.evidence_id || ""}
                        onChange={(e) => {
                          const ev = analysisEvidenceList.find(
                            (ev) => ev.evidence_id === e.target.value,
                          );
                          setSelectedAnalysisEvidence(ev);
                        }}
                        disabled={
                          !selectedAnalysisCase ||
                          analysisEvidenceList.length === 0
                        }
                        className="fr-select-custom"
                      >
                        <option value="">-- Select Evidence --</option>
                        {analysisEvidenceList.length === 0 ? (
                          <option disabled>No evidence found</option>
                        ) : (
                          analysisEvidenceList.map((ev) => (
                            <option key={ev.evidence_id} value={ev.evidence_id}>
                              {ev.title} - {ev.analysis_status || "PENDING"}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="fr-select-icon">📦</span>
                    </div>
                    {selectedAnalysisCase &&
                      analysisEvidenceList.length === 0 &&
                      !loadingEvidence && (
                        <p className="fr-hint-warning">
                          ⚠️ No evidence found for this case. Make sure evidence
                          has been added to the case.
                        </p>
                      )}
                  </div>

                  {selectedAnalysisEvidence && (
                    <div className="fr-evidence-details">
                      <strong>Evidence Details</strong>
                      <div className="fr-evidence-grid">
                        <div>
                          <span>ID:</span>{" "}
                          <code>{selectedAnalysisEvidence.evidence_id}</code>
                        </div>
                        <div>
                          <span>Title:</span> {selectedAnalysisEvidence.title}
                        </div>
                        <div>
                          <span>Description:</span>{" "}
                          {selectedAnalysisEvidence.description}
                        </div>
                        <div>
                          <span>Case ID:</span>{" "}
                          {selectedAnalysisEvidence.case_id}
                        </div>
                      </div>
                      <details className="fr-details">
                        <summary>View IPFS Details</summary>
                        <code>CID: {selectedAnalysisEvidence.ipfs_cid}</code>
                        <br />
                        <code>Hash: {selectedAnalysisEvidence.hash}</code>
                      </details>
                    </div>
                  )}

                  {/* Analysis Type */}
                  <div className="fr-form-row">
                    <div className="fr-form-group">
                      <label className="fr-form-label">🔬 Analysis Type</label>
                      <div className="fr-select-wrapper">
                        <select
                          value={analysisType}
                          onChange={(e) => setAnalysisType(e.target.value)}
                          className="fr-select-custom"
                        >
                          <option value="DIGITAL_FORENSICS">
                            💻 Digital Forensics
                          </option>
                          <option value="DNA_ANALYSIS">🧬 DNA Analysis</option>
                          <option value="FINGERPRINT">
                            👆 Fingerprint Analysis
                          </option>
                          <option value="BALLISTICS">🔫 Ballistics</option>
                          <option value="TOXICOLOGY">⚗️ Toxicology</option>
                        </select>
                        <span className="fr-select-icon">🔬</span>
                      </div>
                    </div>
                  </div>

                  {/* Methodology */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">📋 Methodology Used</label>
                    <div className="fr-textarea-wrapper">
                      <span className="fr-textarea-icon">📋</span>
                      <textarea
                        value={methodology}
                        onChange={(e) => setMethodology(e.target.value)}
                        rows={3}
                        placeholder="Describe the methodology used for analysis..."
                        className="fr-textarea-custom"
                      />
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">⚙️ Equipment Used</label>
                    <div className="fr-input-wrapper">
                      <span className="fr-input-icon">⚙️</span>
                      <input
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
                        placeholder="e.g., FTK Imager, EnCase, DNA Sequencer"
                        className="fr-input-custom"
                      />
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      🔍 Findings <span className="fr-required">*</span>
                    </label>
                    <div className="fr-textarea-wrapper">
                      <span className="fr-textarea-icon">🔍</span>
                      <textarea
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                        rows={6}
                        required
                        placeholder="Detailed findings from the analysis..."
                        className="fr-textarea-custom"
                      />
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📝 Conclusion <span className="fr-required">*</span>
                    </label>
                    <div className="fr-textarea-wrapper">
                      <span className="fr-textarea-icon">📝</span>
                      <textarea
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        rows={3}
                        required
                        placeholder="Conclusion and recommendations..."
                        className="fr-textarea-custom"
                      />
                    </div>
                  </div>

                  <div className="fr-form-actions">
                    <button
                      className="fr-btn fr-btn-success"
                      onClick={handleCreateReport}
                      disabled={
                        !selectedAnalysisEvidence || !findings || !conclusion
                      }
                    >
                      📄 Generate Forensic Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="fr-section fr-fade-up">
              <div className="fr-card">
                <div className="fr-card-header">
                  <div className="fr-card-icon">📄</div>
                  <div>
                    <h3>My Forensic Reports</h3>
                    <p>Select a case to view its reports</p>
                  </div>
                </div>

                {/* Step 1: Select Case */}
                <div className="fr-form-group">
                  <label className="fr-form-label">
                    📁 Step 1: Select Case
                  </label>
                  <div className="fr-select-wrapper">
                    <select
                      value={selectedReportCase}
                      onChange={async (e) => {
                        const caseId = e.target.value;
                        setSelectedReportCase(caseId);
                        setSelectedReportEvidence("");
                        setFilteredReports([]);
                        if (caseId) {
                          await loadReportsEvidence(caseId);
                        } else {
                          setReportsEvidenceList([]);
                          setFilteredReports([]);
                        }
                      }}
                      className="fr-select-custom"
                    >
                      <option value="">-- Select a Case --</option>
                      {reportsCases.length === 0 ? (
                        <option disabled>Loading cases...</option>
                      ) : (
                        reportsCases.map((caseItem) => (
                          <option
                            key={caseItem.case_id}
                            value={caseItem.case_id}
                          >
                            {caseItem.case_number} - {caseItem.title}
                          </option>
                        ))
                      )}
                    </select>
                    <span className="fr-select-icon">⚖️</span>
                  </div>
                </div>

                {/* Step 2: Filter by Evidence (Optional) */}
                {selectedReportCase && reportsEvidenceList.length > 0 && (
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📋 Step 2: Filter by Evidence (Optional)
                    </label>
                    <div className="fr-select-wrapper">
                      <select
                        value={selectedReportEvidence}
                        onChange={(e) => {
                          setSelectedReportEvidence(e.target.value);
                          if (e.target.value) {
                            const filtered = filteredReports.filter(
                              (r) => r.evidence_id === e.target.value,
                            );
                            setFilteredReports(filtered);
                          } else {
                            loadReportsEvidence(selectedReportCase);
                          }
                        }}
                        className="fr-select-custom"
                      >
                        <option value="">-- All Evidence --</option>
                        {reportsEvidenceList.map((ev) => (
                          <option key={ev.evidence_id} value={ev.evidence_id}>
                            {ev.title} - {ev.analysis_status || "PENDING"}
                          </option>
                        ))}
                      </select>
                      <span className="fr-select-icon">📦</span>
                    </div>
                  </div>
                )}

                {/* Reports List */}
                {selectedReportCase && (
                  <>
                    {filteredReports.length === 0 ? (
                      <div className="fr-empty">
                        <div className="fr-empty-icon">📭</div>
                        <h4>No Reports Found</h4>
                        <p>
                          No forensic reports have been generated for this case
                          yet.
                        </p>
                        <button
                          className="fr-btn fr-btn-primary"
                          onClick={() => setActiveTab("analyze")}
                          style={{ marginTop: "16px" }}
                        >
                          🔬 Create New Analysis
                        </button>
                      </div>
                    ) : (
                      <div className="fr-reports-list">
                        {filteredReports.map((report, idx) => (
                          <div
                            key={report.report_id}
                            className={`fr-report-card ${hoveredItem === report.report_id ? "hovered" : ""}`}
                            onMouseEnter={() =>
                              setHoveredItem(report.report_id)
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                          >
                            <div className="fr-report-header">
                              <div className="fr-report-info">
                                <span className="fr-report-icon">📄</span>
                                <div>
                                  <strong className="fr-report-number">
                                    {report.report_number}
                                  </strong>
                                  <div className="fr-report-meta">
                                    <span>Evidence: {report.evidence_id}</span>
                                    <span>
                                      Case:{" "}
                                      {report.case_number || report.case_id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="fr-report-details">
                              <div>
                                <span>Analysis Type:</span>{" "}
                                {report.analysis_type}
                              </div>
                              <div>
                                <span>Created:</span>{" "}
                                {new Date(report.created_at).toLocaleString()}
                              </div>
                              <div>
                                <span>Analyst:</span> {report.analyst_name}
                              </div>
                              {report.methodology && (
                                <div className="fr-report-methodology">
                                  <span>Methodology:</span>{" "}
                                  {report.methodology.substring(0, 100)}...
                                </div>
                              )}
                            </div>
                            <button
                              className="fr-btn fr-btn-primary"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowReportModal(true);
                              }}
                            >
                              👁️ View Full Report
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {selectedReportCase && reportsEvidenceList.length === 0 && (
                  <div className="fr-empty">
                    <div className="fr-empty-icon">🔍</div>
                    <h4>No Evidence Found</h4>
                    <p>This case has no evidence assigned yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "share" && <ForensicShareReport token={token!} />}

          {/* VERIFY TAB */}
          {activeTab === "verify" && (
            <div className="fr-section fr-fade-up">
              <div className="fr-card">
                <div className="fr-card-header">
                  <div className="fr-card-icon">🔐</div>
                  <div>
                    <h3>Verify Evidence Authenticity</h3>
                    <p>Upload file or enter hash to verify evidence</p>
                  </div>
                </div>
                <div className="fr-form">
                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📁 Step 1: Select Case
                    </label>
                    <div className="fr-select-wrapper">
                      <select
                        value={verifyCaseId}
                        onChange={async (e) => {
                          const caseId = e.target.value;
                          setVerifyCaseId(caseId);
                          setVerifySelectedEvidence(null);
                          setVerifyManualHash("");
                          setVerifyFile(null);
                          setVerifyResultMsg("");
                          setVerificationDetails(null);
                          if (caseId) {
                            await loadVerifyEvidenceByCase(caseId);
                          } else {
                            setVerifyEvidenceList([]);
                          }
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="fr-select-custom"
                      >
                        <option value="">-- Select a Case --</option>
                        {verifyCases.length === 0 ? (
                          <option disabled>Loading cases...</option>
                        ) : (
                          verifyCases.map((caseItem) => (
                            <option
                              key={caseItem.case_id}
                              value={caseItem.case_id}
                            >
                              {caseItem.case_number} - {caseItem.title}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="fr-select-icon">⚖️</span>
                    </div>
                    {verifyCases.length === 0 && (
                      <p className="fr-hint-warning">
                        ⚠️ No cases found with evidence
                      </p>
                    )}
                  </div>

                  <div className="fr-form-group">
                    <label className="fr-form-label">
                      📋 Step 2: Select Evidence
                    </label>
                    <div className="fr-select-wrapper">
                      <select
                        value={verifySelectedEvidence?.evidence_id || ""}
                        onChange={(e) => {
                          const ev = verifyEvidenceList.find(
                            (ev) => ev.evidence_id === e.target.value,
                          );
                          setVerifySelectedEvidence(ev);
                          setVerifyManualHash("");
                          setVerifyFile(null);
                          setVerifyResultMsg("");
                          setVerificationDetails(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        disabled={
                          !verifyCaseId || verifyEvidenceList.length === 0
                        }
                        className="fr-select-custom"
                      >
                        <option value="">-- Select Evidence --</option>
                        {verifyEvidenceList.length === 0 ? (
                          <option disabled>No evidence found</option>
                        ) : (
                          verifyEvidenceList.map((ev) => (
                            <option key={ev.evidence_id} value={ev.evidence_id}>
                              {ev.title} - {ev.analysis_status || "PENDING"}
                            </option>
                          ))
                        )}
                      </select>
                      <span className="fr-select-icon">📦</span>
                    </div>
                    {verifyCaseId && verifyEvidenceList.length === 0 && (
                      <p className="fr-hint-warning">
                        ⚠️ No evidence found for this case
                      </p>
                    )}
                  </div>

                  {verifySelectedEvidence && (
                    <div className="fr-evidence-details">
                      <strong>Evidence Details</strong>
                      <div className="fr-evidence-grid">
                        <div>
                          <span>ID:</span>{" "}
                          <code>{verifySelectedEvidence.evidence_id}</code>
                        </div>
                        <div>
                          <span>Stored Hash:</span>{" "}
                          <code className="fr-hash">
                            {verifySelectedEvidence.hash}
                          </code>
                        </div>
                        <div>
                          <span>IPFS CID:</span>{" "}
                          <code>{verifySelectedEvidence.ipfs_cid}</code>
                        </div>
                        <div>
                          <span>Status:</span> {verifySelectedEvidence.status}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="fr-verify-grid">
                    <div className="fr-verify-box">
                      <h4>📂 Upload File to Verify</h4>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          setVerifyFile(e.target.files?.[0] || null);
                          setVerifyManualHash("");
                          setVerifyResultMsg("");
                          setVerificationDetails(null);
                        }}
                        className="fr-file-input"
                      />
                      <p className="fr-hint">
                        Upload the original evidence file to verify its
                        authenticity.
                      </p>
                      <button
                        className="fr-btn fr-btn-success fr-btn-block"
                        onClick={handleVerifyEvidenceByFile}
                        disabled={!verifyFile || !verifySelectedEvidence}
                      >
                        🔐 Verify File
                      </button>
                    </div>

                    <div className="fr-verify-box">
                      <h4>🔑 Enter Hash to Verify</h4>
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
                        className="fr-hash-input"
                      />
                      <p className="fr-hint">
                        Enter the SHA-256 hash of the evidence to verify.
                      </p>
                      <button
                        className="fr-btn fr-btn-primary fr-btn-block"
                        onClick={handleVerifyEvidenceByHash}
                        disabled={!verifyManualHash || !verifySelectedEvidence}
                      >
                        🔐 Verify Hash
                      </button>
                    </div>
                  </div>

                  {verifyResultMsg && (
                    <div
                      className={`fr-verify-result ${verifyResultMsg.includes("✅") ? "success" : "error"}`}
                    >
                      <div className="fr-verify-result-icon">
                        {verifyResultMsg.includes("✅") ? "✅" : "❌"}
                      </div>
                      <div className="fr-verify-result-content">
                        <h4>
                          {verifyResultMsg.includes("✅")
                            ? "Verification Passed!"
                            : "Verification Failed!"}
                        </h4>
                        <p>{verifyResultMsg}</p>
                        {verificationDetails && (
                          <div className="fr-verify-details">
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
            </div>
          )}

          {/* CHAIN OF CUSTODY TAB */}
          {activeTab === "chain" && <ForensicChainCustody token={token!} />}

          {/* TEMPLATES TAB */}
          {activeTab === "templates" && (
            <div className="fr-section fr-fade-up">
              <div className="fr-card">
                <div className="fr-card-header">
                  <div className="fr-card-icon">📝</div>
                  <div>
                    <h3>Analysis Templates</h3>
                    <p>Standard templates for evidence analysis</p>
                  </div>
                </div>
                <div className="fr-templates-grid">
                  <div className="fr-template-card">
                    <div className="fr-template-icon">💻</div>
                    <h4>Digital Forensics</h4>
                    <p>Standard template for digital evidence analysis</p>
                    <ul>
                      <li>Device Information</li>
                      <li>Acquisition Method</li>
                      <li>Hash Verification</li>
                      <li>Recovered Files</li>
                      <li>Conclusion</li>
                    </ul>
                  </div>
                  <div className="fr-template-card">
                    <div className="fr-template-icon">🧬</div>
                    <h4>DNA Analysis</h4>
                    <p>Standard template for DNA evidence analysis</p>
                    <ul>
                      <li>Sample Information</li>
                      <li>Extraction Method</li>
                      <li>PCR Amplification</li>
                      <li>Results</li>
                      <li>Conclusion</li>
                    </ul>
                  </div>
                  <div className="fr-template-card">
                    <div className="fr-template-icon">👆</div>
                    <h4>Fingerprint Analysis</h4>
                    <p>Standard template for fingerprint evidence</p>
                    <ul>
                      <li>Latent Print Information</li>
                      <li>Comparison Method</li>
                      <li>Minutiae Points</li>
                      <li>Comparison Results</li>
                      <li>Conclusion</li>
                    </ul>
                  </div>
                  <div className="fr-template-card">
                    <div className="fr-template-icon">🔫</div>
                    <h4>Ballistics</h4>
                    <p>Standard template for ballistics analysis</p>
                    <ul>
                      <li>Firearm Information</li>
                      <li>Ammunition Type</li>
                      <li>Striations Analysis</li>
                      <li>Distance Determination</li>
                      <li>Conclusion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div
          className="fr-modal-overlay"
          onClick={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
        >
          <div className="fr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fr-modal-header">
              <h3>📄 Forensic Report</h3>
              <button
                className="fr-modal-close"
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReport(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="fr-modal-body">
              <div className="fr-report-view">
                <div className="fr-report-view-header">
                  <p>
                    <strong>Report Number:</strong>{" "}
                    {selectedReport.report_number}
                  </p>
                  <p>
                    <strong>Report ID:</strong> {selectedReport.report_id}
                  </p>
                  <p>
                    <strong>Evidence ID:</strong> {selectedReport.evidence_id}
                  </p>
                  <p>
                    <strong>Case ID:</strong> {selectedReport.case_id}
                  </p>
                  <p>
                    <strong>Analysis Type:</strong>{" "}
                    {selectedReport.analysis_type}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Analyst:</strong> {selectedReport.analyst_name} (
                    {selectedReport.analyst_email})
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedReport.status)}
                  </p>
                </div>

                {/* ============ METHODOLOGY ============ */}
                {selectedReport.methodology && (
                  <div className="fr-report-view-section">
                    <h4>📋 Methodology</h4>
                    <div className="fr-report-content">
                      <p>{selectedReport.methodology}</p>
                    </div>
                  </div>
                )}

                {/* ============ EQUIPMENT USED ============ */}
                {selectedReport.equipment_used && (
                  <div className="fr-report-view-section">
                    <h4>⚙️ Equipment Used</h4>
                    <div className="fr-report-content">
                      <p>{selectedReport.equipment_used}</p>
                    </div>
                  </div>
                )}

                {/* ============ FINDINGS ============ */}
                <div className="fr-report-view-section">
                  <h4>🔍 Findings</h4>
                  <div className="fr-report-content">
                    <p>{selectedReport.findings}</p>
                  </div>
                </div>

                {/* ============ CONCLUSION ============ */}
                <div className="fr-report-view-section">
                  <h4>📝 Conclusion</h4>
                  <div className="fr-report-content">
                    <p>{selectedReport.conclusion}</p>
                  </div>
                </div>

                <details className="fr-details">
                  <summary>IPFS Details</summary>
                  <code>CID: {selectedReport.ipfs_cid}</code>
                  <br />
                  <code>Hash: {selectedReport.hash}</code>
                </details>
              </div>
            </div>
            <div className="fr-modal-footer">
              <div
                style={{ display: "flex", gap: "12px", marginRight: "auto" }}
              >
                <button
                  className="fr-btn"
                  style={{ background: "#ef4444", color: "white" }}
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `${API_BASE_URL}/forensic/report/download/${selectedReport.report_id}?format=pdf`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `forensic_report_${selectedReport.report_number}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }
                    } catch (err) {
                      alert("Download failed");
                    }
                  }}
                >
                  📄 Download PDF
                </button>
              </div>
              <button
                className="fr-btn fr-btn-secondary"
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReport(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Panel */}
      {/* Mobile Menu Panel - Fixed */}
      <div className={`mobile-menu-panel ${sidebarOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-user">
            <div className="mobile-menu-avatar">🔬</div>
            <div>
              <div className="mobile-menu-name">Forensic Analyst</div>
              <div className="mobile-menu-role">Digital Forensics</div>
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

      {/* Overlay - Only show when sidebarOpen is true */}
      {sidebarOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <style>{`
        /* Forensic Dashboard Styles - Indigo Theme */
        .fr-dashboard {
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

        /* Loading */
        .fr-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep);
          gap: 16px;
        }

        .fr-spinner {
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

        .fr-loading p {
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

        /* Mobile Menu Panel - Fixed */
.mobile-menu-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #0c0f1a, #07090e);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px 20px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.mobile-menu-panel.open {
  transform: translateY(0);
}

.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-menu-items {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.mobile-menu-item.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  color: #818cf8;
}

.mobile-menu-item:hover {
  background: rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.mobile-menu-icon {
  font-size: 1.2rem;
}

.mobile-menu-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.mobile-menu-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
}


.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  background: rgba(12, 15, 26, 0.9);
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-menu-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.mobile-menu-name {
  font-weight: 600;
  color: #e8ecf8;
  font-size: 0.9rem;
}

.mobile-menu-role {
  font-size: 0.7rem;
  color: #818cf8;
}

.mobile-menu-close {
  background: rgba(99, 102, 241, 0.1);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-close:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #e8ecf8;
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

        /* Section */
        .fr-section {
          padding: 0 2rem 2rem;
        }

        @media (max-width: 768px) {
          .fr-section {
            padding: 0 1rem 1rem;
          }
        }

        .fr-fade-up {
          animation: fadeUp 0.4s ease-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Stats Cards */
        .fr-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          padding: 0 2rem;
          margin-top: 24px;
        }

        @media (max-width: 900px) {
          .fr-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .fr-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .fr-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .fr-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .fr-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .fr-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .fr-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        .fr-stat-sub {
          font-size: 0.65rem;
          color: #3d4459;
          margin-top: 2px;
        }

                /* Card */
        .fr-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s;
        }

        .fr-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .fr-card-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .fr-card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .fr-card-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        /* Dashboard Stats */
        .fr-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .fr-dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .fr-dashboard-stats {
            grid-template-columns: 1fr;
          }
        }

        .fr-dashboard-stat {
          text-align: center;
          padding: 20px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          transition: all 0.3s;
        }

        .fr-dashboard-stat:hover {
          transform: translateY(-3px);
          background: rgba(12, 15, 26, 0.8);
        }

        .fr-dashboard-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .fr-dashboard-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .fr-dashboard-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        /* Queue List */
        .fr-queue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fr-queue-item {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
          animation: fr-slideIn 0.3s ease-out backwards;
        }

        @keyframes fr-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fr-queue-item.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .fr-queue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .fr-queue-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .fr-queue-icon {
          font-size: 1.3rem;
        }

        .fr-queue-title {
          font-size: 0.95rem;
          color: #e8ecf8;
        }

        .fr-queue-meta {
          display: flex;
          gap: 16px;
          margin-top: 4px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .fr-queue-description {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 12px 0;
          line-height: 1.5;
        }

        .fr-queue-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        /* Badges */
        .fr-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .fr-status-icon {
          font-size: 0.75rem;
        }

        /* Form Styles */
        .fr-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .fr-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fr-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #7a849c;
        }

        .fr-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .fr-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 600px) {
          .fr-form-row {
            grid-template-columns: 1fr;
          }
        }

        /* Input Wrappers */
        .fr-input-wrapper, .fr-select-wrapper, .fr-textarea-wrapper {
          position: relative;
        }

        .fr-input-icon, .fr-select-icon, .fr-textarea-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .fr-textarea-icon {
          top: 16px;
          transform: none;
        }

        .fr-input-wrapper input, .fr-select-wrapper select, .fr-textarea-wrapper textarea {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
          transition: all 0.3s;
        }

        .fr-input-wrapper input:focus, .fr-select-wrapper select:focus, .fr-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .fr-select-wrapper select {
          appearance: none;
          cursor: pointer;
        }

        /* Evidence Details */
        .fr-evidence-details {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 16px;
          margin: 8px 0;
        }

        .fr-evidence-details strong {
          display: block;
          margin-bottom: 12px;
          color: #818cf8;
        }

        .fr-evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .fr-evidence-grid div {
          font-size: 0.8rem;
          color: #7a849c;
        }

        .fr-evidence-grid div span {
          font-weight: 600;
          color: #e8ecf8;
        }

        .fr-evidence-grid code {
          font-size: 0.7rem;
          color: #818cf8;
          word-break: break-all;
        }

        /* Details */
        .fr-details {
          margin-top: 12px;
        }

        .fr-details summary {
          cursor: pointer;
          font-size: 0.75rem;
          color: #818cf8;
          list-style: none;
        }

        .fr-details summary::-webkit-details-marker {
          display: none;
        }

        .fr-details code {
          font-size: 0.7rem;
          color: #7a849c;
          word-break: break-all;
          display: block;
          margin-top: 8px;
          padding: 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
        }

        /* Verify Grid */
        .fr-verify-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin: 20px 0;
        }

        @media (max-width: 768px) {
          .fr-verify-grid {
            grid-template-columns: 1fr;
          }
        }

        .fr-verify-box {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
        }

        .fr-verify-box h4 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #e8ecf8;
        }

        .fr-file-input, .fr-hash-input {
          width: 100%;
          padding: 10px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.8rem;
          margin-bottom: 12px;
        }

        .fr-hint {
          font-size: 0.7rem;
          color: #3d4459;
          margin-bottom: 16px;
        }

        /* Buttons */
        .fr-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fr-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .fr-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .fr-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .fr-btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .fr-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .fr-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .fr-btn-block {
          width: 100%;
          text-align: center;
        }

        .fr-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fr-link-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .fr-link-btn:hover {
          color: #a5b4fc;
          transform: translateX(4px);
        }

        /* Form Actions */
        .fr-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        /* Toast */
        .fr-toast {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: fr-toastIn 0.3s ease-out;
        }

        @keyframes fr-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fr-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .fr-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Verify Result */
        .fr-verify-result {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 20px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .fr-verify-result.success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .fr-verify-result.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .fr-verify-result-icon {
          font-size: 2rem;
        }

        .fr-verify-result-content h4 {
          margin: 0 0 8px 0;
          font-size: 1rem;
        }

        .fr-verify-result.success h4 {
          color: #4ade80;
        }

        .fr-verify-result.error h4 {
          color: #f87171;
        }

        .fr-verify-result-content p {
          font-size: 0.85rem;
          margin: 0 0 12px 0;
        }

        .fr-verify-details {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .fr-verify-details code {
          font-size: 0.65rem;
          word-break: break-all;
        }

        /* Reports List */
        .fr-reports-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fr-report-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
          animation: fr-slideIn 0.3s ease-out backwards;
        }

        .fr-report-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .fr-report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .fr-report-info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .fr-report-icon {
          font-size: 1.3rem;
        }

        .fr-report-number {
          font-size: 0.9rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .fr-report-meta {
          display: flex;
          gap: 16px;
          margin-top: 6px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .fr-report-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 12px 0;
          padding: 12px 0;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        }

        .fr-report-details div {
          font-size: 0.75rem;
          color: #7a849c;
        }

        .fr-report-details div span {
          font-weight: 600;
          color: #e8ecf8;
        }

        /* Templates Grid */
        .fr-templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .fr-template-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
        }

        .fr-template-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(12, 15, 26, 0.8);
        }

        .fr-template-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .fr-template-card h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .fr-template-card p {
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 12px;
        }

        .fr-template-card ul {
          margin: 0;
          padding-left: 20px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .fr-template-card li {
          margin-bottom: 4px;
        }

        /* Modal */
        .fr-modal-overlay {
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
          animation: fr-fadeInModal 0.2s ease;
        }

        @keyframes fr-fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fr-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          overflow-y: auto;
          animation: fr-slideUpModal 0.3s ease;
        }

        @keyframes fr-slideUpModal {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .fr-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }

        .fr-modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }

        .fr-modal-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1rem;
          cursor: pointer;
        }

        .fr-modal-close:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #e8ecf8;
        }

        .fr-modal-body {
          padding: 24px;
        }

        .fr-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }

        /* Report View inside Modal */
        .fr-report-view-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .fr-report-view-header p {
          margin: 8px 0;
          font-size: 0.85rem;
          color: #7a849c;
        }

        .fr-report-view-section {
          margin-bottom: 20px;
        }

        .fr-report-view-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
        }

        .fr-report-content {
          background: rgba(7, 9, 14, 0.5);
          padding: 16px;
          border-radius: 10px;
        }

        .fr-report-content p {
          margin: 0;
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Empty State */
        .fr-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .fr-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .fr-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .fr-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Hash */
        .fr-hash {
          font-size: 0.7rem;
          word-break: break-all;
        }

        .fr-select-custom {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 12px;
  color: #e8ecf8;
  font-size: 0.9rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s;
}

.fr-select-custom:hover {
  border-color: rgba(99,102,241,0.4);
  background: rgba(12, 15, 26, 0.9);
}

.fr-select-custom:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.fr-select-custom option {
  background: #0c0f1a;
  padding: 12px;
}

.fr-form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 8px;
  display: block;
}

.fr-hint-warning {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ========== IMPROVED FORM STYLES ========== */

/* Labels */
.fr-form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 8px;
  display: block;
}

/* Custom Select Dropdown */
.fr-select-custom {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 12px;
  color: #e8ecf8;
  font-size: 0.9rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s;
}

.fr-select-custom:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(12, 15, 26, 0.9);
}

.fr-select-custom:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.fr-select-custom option {
  background: #0c0f1a;
  padding: 12px;
}

/* Custom Input */
.fr-input-custom {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 12px;
  color: #e8ecf8;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.fr-input-custom:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Custom Textarea */
.fr-textarea-custom {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: rgba(7, 9, 14, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 12px;
  color: #e8ecf8;
  font-size: 0.9rem;
  transition: all 0.3s;
  resize: vertical;
  font-family: inherit;
}

.fr-textarea-custom:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* Hint Warning */
.fr-hint-warning {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Select Wrapper icon adjustment */
.fr-select-wrapper .fr-select-icon,
.fr-input-wrapper .fr-input-icon,
.fr-textarea-wrapper .fr-textarea-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
  color: #6366f1;
  z-index: 2;
}

.fr-textarea-wrapper .fr-textarea-icon {
  top: 18px;
  transform: none;
}

/* Make wrapper relative for proper icon positioning */
.fr-select-wrapper,
.fr-input-wrapper,
.fr-textarea-wrapper {
  position: relative;
}

/* Disabled select styling */
.fr-select-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Force download buttons to be visible */
.fr-modal-footer {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 16px 24px !important;
  border-top: 1px solid rgba(99, 102, 241, 0.12) !important;
  background: rgba(7, 9, 14, 0.8) !important;
  border-radius: 0 0 20px 20px !important;
}

.fr-modal-footer .fr-btn {
  padding: 10px 18px !important;
  border-radius: 8px !important;
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  border: none !important;
  transition: all 0.2s !important;
}

.fr-modal-footer .fr-btn:hover {
  transform: translateY(-2px) !important;
  opacity: 0.9 !important;
}

.fr-modal-footer .fr-btn-secondary {
  background: rgba(99, 102, 241, 0.15) !important;
  color: #818cf8 !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
}
      `}</style>
    </div>
  );
}
