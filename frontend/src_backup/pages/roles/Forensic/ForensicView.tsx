// frontend/src/pages/roles/Forensic/ForensicView.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../shared/env";
import { ForensicChainCustody } from "./components/ForensicChainCustody";

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
  
  // Analysis Tab States
  const [analysisCases, setAnalysisCases] = useState<any[]>([]);
  const [selectedAnalysisCase, setSelectedAnalysisCase] = useState("");
  const [analysisEvidenceList, setAnalysisEvidenceList] = useState<any[]>([]);
  const [selectedAnalysisEvidence, setSelectedAnalysisEvidence] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState("DIGITAL_FORENSICS");
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [equipment, setEquipment] = useState("");
  
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
  const [verifySelectedEvidence, setVerifySelectedEvidence] = useState<any>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyManualHash, setVerifyManualHash] = useState("");
  const [verifyResultMsg, setVerifyResultMsg] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  
  // Report Modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [message, setMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("justice_token");

  useEffect(() => {
    loadData();
    loadCases();
    loadReportsCases();
    loadVerifyCases();
  }, []);

  async function loadData() {
    try {
      const [queueData, reportsData, statsData] = await Promise.all([
        apiRequest<any[]>("/forensic/queue", { token }).catch(() => []),
        apiRequest<any[]>("/forensic/reports", { token }).catch(() => []),
        apiRequest<any>("/forensic/stats", { token }).catch(() => null)
      ]);
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
      const cases = await apiRequest<any[]>("/forensic/cases-list", { token }).catch(() => []);
      setAnalysisCases(cases);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadReportsCases() {
    try {
      const cases = await apiRequest<any[]>("/forensic/cases-list", { token }).catch(() => []);
      setReportsCases(cases);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadVerifyCases() {
    try {
      const cases = await apiRequest<any[]>("/forensic/cases-list", { token }).catch(() => []);
      setVerifyCases(cases);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAnalysisEvidence(caseId: string) {
    if (!caseId) {
      setAnalysisEvidenceList([]);
      return;
    }
    try {
      const allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", { token }).catch(() => []);
      const caseEvidence = allEvidence.filter(ev => ev.case_id === caseId);
      setAnalysisEvidenceList(caseEvidence);
    } catch (err) {
      console.error(err);
      setAnalysisEvidenceList([]);
    }
  }

  async function loadReportsEvidence(caseId: string) {
    if (!caseId) {
      setReportsEvidenceList([]);
      setFilteredReports([]);
      return;
    }
    try {
      const allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", { token }).catch(() => []);
      const caseEvidence = allEvidence.filter(ev => ev.case_id === caseId);
      setReportsEvidenceList(caseEvidence);
      
      const reports = await apiRequest<any[]>(`/forensic/reports/by-case/${caseId}`, { token }).catch(() => []);
      setFilteredReports(reports);
    } catch (err) {
      console.error(err);
      setReportsEvidenceList([]);
      setFilteredReports([]);
    }
  }

  // FIXED: Direct evidence loading for verify tab
  async function loadVerifyEvidenceByCase(caseId: string) {
    if (!caseId) {
      setVerifyEvidenceList([]);
      return;
    }
    try {
      const allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", { token }).catch(() => []);
      const caseEvidence = allEvidence.filter(ev => ev.case_id === caseId);
      console.log("Verify evidence loaded:", caseEvidence);
      setVerifyEvidenceList(caseEvidence);
    } catch (err) {
      console.error("Error loading verify evidence:", err);
      setVerifyEvidenceList([]);
    }
  }

  async function handleCreateReport() {
    if (!selectedAnalysisEvidence || !findings || !conclusion) {
      setMessage("❌ Please select evidence and fill findings & conclusion");
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
          conclusion: conclusion
        }
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
    }
  }

  async function handleFilterReports() {
    if (!selectedReportCase) {
      setFilteredReports([]);
      return;
    }
    if (selectedReportEvidence) {
      const reports = await apiRequest<any[]>(`/forensic/reports/by-case/${selectedReportCase}`, { token }).catch(() => []);
      const evidenceReports = reports.filter(r => r.evidence_id === selectedReportEvidence);
      setFilteredReports(evidenceReports);
    } else {
      const reports = await apiRequest<any[]>(`/forensic/reports/by-case/${selectedReportCase}`, { token }).catch(() => []);
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
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        }
      );
      const result = await response.json();
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        uploaded_hash: result.uploaded_hash,
        verification_time: result.verification_time
      });
      loadData();
    } catch (err) {
      setVerifyResultMsg("❌ Verification failed: " + (err instanceof Error ? err.message : "Unknown error"));
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
          provided_hash: verifyManualHash
        }
      });
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        provided_hash: verifyManualHash,
        verification_time: result.verification_time
      });
      setVerifyManualHash("");
      loadData();
    } catch (err) {
      setVerifyResultMsg("❌ Verification failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }

  useEffect(() => {
    if (selectedReportCase) {
      handleFilterReports();
    }
  }, [selectedReportCase, selectedReportEvidence]);

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#10b981"
    };
    return <span style={{ background: colors[priority] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{priority}</span>;
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: "#f59e0b",
      IN_PROGRESS: "#3b82f6",
      COMPLETED: "#10b981",
      TRANSFERRED_TO_COURT: "#8b5cf6"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{status.replace(/_/g, " ")}</span>;
  }

  if (loading) {
    return <div className="card">Loading forensic dashboard...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "32px" }}>⏳</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{stats.pending}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>Pending</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "32px" }}>🔬</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{stats.in_progress}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>In Progress</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "32px" }}>✅</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{stats.completed}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>Completed</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "32px" }}>📋</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.my_reports}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>My Reports</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("dashboard")} style={{ background: activeTab === "dashboard" ? "#3b82f6" : "transparent", color: activeTab === "dashboard" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📊 Dashboard</button>
        <button onClick={() => setActiveTab("queue")} style={{ background: activeTab === "queue" ? "#3b82f6" : "transparent", color: activeTab === "queue" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📋 Queue ({queue.length})</button>
        <button onClick={() => setActiveTab("analyze")} style={{ background: activeTab === "analyze" ? "#3b82f6" : "transparent", color: activeTab === "analyze" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>🔬 New Analysis</button>
        <button onClick={() => setActiveTab("reports")} style={{ background: activeTab === "reports" ? "#3b82f6" : "transparent", color: activeTab === "reports" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📄 My Reports ({myReports.length})</button>
        <button onClick={() => setActiveTab("verify")} style={{ background: activeTab === "verify" ? "#3b82f6" : "transparent", color: activeTab === "verify" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>🔐 Verify Evidence</button>
        <button onClick={() => setActiveTab("chain")} style={{ background: activeTab === "chain" ? "#3b82f6" : "transparent", color: activeTab === "chain" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>🔗 Chain of Custody</button>
        <button onClick={() => setActiveTab("templates")} style={{ background: activeTab === "templates" ? "#3b82f6" : "transparent", color: activeTab === "templates" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📝 Templates</button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="card">
          <h3>📊 Forensic Dashboard</h3>
          <p>Welcome to Forensic Analysis Dashboard</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "32px" }}>📋</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{queue.length}</div>
              <div>Pending Analysis</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "32px" }}>📄</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats?.my_reports || 0}</div>
              <div>Reports Created</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "32px" }}>✅</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats?.completed || 0}</div>
              <div>Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === "queue" && (
        <div className="card">
          <h3>📋 Evidence Queue for Analysis</h3>
          {queue.length === 0 ? (
            <p>No evidence pending for analysis.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {queue.map((item) => (
                <div key={item.evidence_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                    <strong>{item.title}</strong>
                    {getPriorityBadge(item.priority || "MEDIUM")}
                  </div>
                  <p style={{ fontSize: "14px", color: "#666" }}>{item.description}</p>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "12px" }}>
                    Case ID: {item.case_id} | Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => {
                        setActiveTab("analyze");
                      }}
                      style={{ background: "#10b981", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      🔬 Start Analysis
                    </button>
                    <button 
                      onClick={() => window.open(`https://dweb.link/ipfs/${item.ipfs_cid}`, "_blank")}
                      style={{ background: "#3b82f6", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      📄 View Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYZE TAB */}
      {activeTab === "analyze" && (
        <div className="card">
          <h2>🔬 Forensic Analysis</h2>
          
          <div className="form-grid">
            <label>📁 Step 1: Select Case</label>
            <select 
              value={selectedAnalysisCase} 
              onChange={(e) => {
                setSelectedAnalysisCase(e.target.value);
                setSelectedAnalysisEvidence(null);
                loadAnalysisEvidence(e.target.value);
              }}
            >
              <option value="">-- Select Case --</option>
              {analysisCases.map((caseItem) => (
                <option key={caseItem.case_id} value={caseItem.case_id}>
                  {caseItem.case_number} - {caseItem.title}
                </option>
              ))}
            </select>

            <label>📋 Step 2: Select Evidence</label>
            <select 
              value={selectedAnalysisEvidence?.evidence_id || ""} 
              onChange={(e) => {
                const ev = analysisEvidenceList.find(ev => ev.evidence_id === e.target.value);
                setSelectedAnalysisEvidence(ev);
              }}
              disabled={!selectedAnalysisCase}
            >
              <option value="">-- Select Evidence --</option>
              {analysisEvidenceList.map((ev) => (
                <option key={ev.evidence_id} value={ev.evidence_id}>
                  {ev.title} - Status: {ev.analysis_status || "PENDING"}
                </option>
              ))}
            </select>

            {selectedAnalysisEvidence && (
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginTop: "8px" }}>
                <strong>Evidence Details:</strong>
                <div style={{ fontSize: "13px", marginTop: "8px" }}>
                  <p><strong>ID:</strong> {selectedAnalysisEvidence.evidence_id}</p>
                  <p><strong>Title:</strong> {selectedAnalysisEvidence.title}</p>
                  <p><strong>Description:</strong> {selectedAnalysisEvidence.description}</p>
                  <p><strong>Case ID:</strong> {selectedAnalysisEvidence.case_id}</p>
                  <details>
                    <summary style={{ cursor: "pointer", color: "#3b82f6" }}>View IPFS Details</summary>
                    <code style={{ fontSize: "11px", wordBreak: "break-all" }}>CID: {selectedAnalysisEvidence.ipfs_cid}</code>
                    <br />
                    <code style={{ fontSize: "11px", wordBreak: "break-all" }}>Hash: {selectedAnalysisEvidence.hash}</code>
                  </details>
                </div>
              </div>
            )}

            <label>Analysis Type</label>
            <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
              <option value="DIGITAL_FORENSICS">💻 Digital Forensics</option>
              <option value="DNA_ANALYSIS">🧬 DNA Analysis</option>
              <option value="FINGERPRINT">👆 Fingerprint Analysis</option>
              <option value="BALLISTICS">🔫 Ballistics</option>
              <option value="TOXICOLOGY">⚗️ Toxicology</option>
            </select>

            <label>Methodology Used</label>
            <textarea 
              value={methodology} 
              onChange={(e) => setMethodology(e.target.value)} 
              rows={3} 
              placeholder="Describe the methodology used for analysis..."
              style={{ width: "100%", padding: "8px" }}
            />

            <label>Equipment Used</label>
            <input 
              value={equipment} 
              onChange={(e) => setEquipment(e.target.value)} 
              placeholder="e.g., FTK Imager, EnCase, DNA Sequencer"
              style={{ width: "100%", padding: "8px" }}
            />

            <label>Findings *</label>
            <textarea 
              value={findings} 
              onChange={(e) => setFindings(e.target.value)} 
              rows={6} 
              required
              placeholder="Detailed findings from the analysis..."
              style={{ width: "100%", padding: "8px" }}
            />

            <label>Conclusion *</label>
            <textarea 
              value={conclusion} 
              onChange={(e) => setConclusion(e.target.value)} 
              rows={3} 
              required
              placeholder="Conclusion and recommendations..."
              style={{ width: "100%", padding: "8px" }}
            />

            <button 
              onClick={handleCreateReport} 
              disabled={!selectedAnalysisEvidence || !findings || !conclusion}
              style={{ background: "#10b981", padding: "12px", borderRadius: "8px", cursor: "pointer" }}
            >
              📄 Generate Forensic Report
            </button>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="card">
          <h3>📄 My Forensic Reports ({myReports.length})</h3>
          {myReports.length === 0 ? (
            <p>No reports created yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {myReports.map((report) => (
                <div key={report.report_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{report.report_number}</strong>
                    {getStatusBadge(report.status)}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <p><strong>Evidence ID:</strong> {report.evidence_id}</p>
                    <p><strong>Case ID:</strong> {report.case_id}</p>
                    <p><strong>Analysis Type:</strong> {report.analysis_type}</p>
                    <p><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</p>
                    <p><strong>By:</strong> {report.analyst_name} ({report.analyst_email})</p>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <button 
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      style={{ background: "#3b82f6", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      👁️ View Full Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report View Modal */}
      {showReportModal && selectedReport && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => { setShowReportModal(false); setSelectedReport(null); }} />
          <div className="card" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, width: "90%", maxWidth: "700px", maxHeight: "80%", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0 }}>📄 Forensic Report</h2>
              <button onClick={() => { setShowReportModal(false); setSelectedReport(null); }} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>✕ Close</button>
            </div>
            <hr />
            <div>
              <p><strong>Report Number:</strong> {selectedReport.report_number}</p>
              <p><strong>Report ID:</strong> {selectedReport.report_id}</p>
              <p><strong>Evidence ID:</strong> {selectedReport.evidence_id}</p>
              <p><strong>Case ID:</strong> {selectedReport.case_id}</p>
              <p><strong>Case Title:</strong> {selectedReport.case_title || "N/A"}</p>
              <p><strong>Analysis Type:</strong> {selectedReport.analysis_type}</p>
              <p><strong>Created:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
              <p><strong>Analyst:</strong> {selectedReport.analyst_name} ({selectedReport.analyst_email})</p>
              <p><strong>Status:</strong> {selectedReport.status}</p>
              
              <h3>🔍 Findings</h3>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ whiteSpace: "pre-wrap" }}>{selectedReport.findings}</p>
              </div>
              
              <h3>📝 Conclusion</h3>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ whiteSpace: "pre-wrap" }}>{selectedReport.conclusion}</p>
              </div>
              
              <details>
                <summary style={{ cursor: "pointer", color: "#3b82f6" }}>IPFS Details</summary>
                <code style={{ fontSize: "11px", wordBreak: "break-all" }}>CID: {selectedReport.ipfs_cid}</code>
                <br />
                <code style={{ fontSize: "11px", wordBreak: "break-all" }}>Hash: {selectedReport.hash}</code>
              </details>
            </div>
          </div>
        </>
      )}

      {/* VERIFY TAB - FIXED */}
      {activeTab === "verify" && (
        <div className="card">
          <h2>🔐 Verify Evidence Authenticity</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
            Select a case, then select evidence, and upload the original file or enter hash to verify authenticity.
          </p>
          <div className="form-grid">
            <label>📁 Step 1: Select Case</label>
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
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <option value="">-- Select Case --</option>
              {verifyCases.map((caseItem) => (
                <option key={caseItem.case_id} value={caseItem.case_id}>
                  {caseItem.case_number} - {caseItem.title}
                </option>
              ))}
            </select>

            <label>📋 Step 2: Select Evidence</label>
            <select 
              value={verifySelectedEvidence?.evidence_id || ""} 
              onChange={(e) => {
                const ev = verifyEvidenceList.find(ev => ev.evidence_id === e.target.value);
                setVerifySelectedEvidence(ev);
                setVerifyManualHash("");
                setVerifyFile(null);
                setVerifyResultMsg("");
                setVerificationDetails(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={!verifyCaseId || verifyEvidenceList.length === 0}
            >
              <option value="">-- Select Evidence --</option>
              {verifyEvidenceList.map((ev) => (
                <option key={ev.evidence_id} value={ev.evidence_id}>
                  {ev.title} - Status: {ev.status || ev.analysis_status || "PENDING"}
                </option>
              ))}
            </select>

            {verifySelectedEvidence && (
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <strong>Evidence Details:</strong>
                <p style={{ marginTop: "8px", fontSize: "13px" }}><strong>ID:</strong> {verifySelectedEvidence.evidence_id}</p>
                <p style={{ fontSize: "13px" }}><strong>Stored Hash:</strong> <code style={{ wordBreak: "break-all" }}>{verifySelectedEvidence.hash}</code></p>
                <p style={{ fontSize: "12px", color: "#666" }}><strong>IPFS CID:</strong> <code style={{ wordBreak: "break-all" }}>{verifySelectedEvidence.ipfs_cid}</code></p>
                <p style={{ fontSize: "12px", color: "#666" }}><strong>Status:</strong> {verifySelectedEvidence.status}</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
              {/* File Upload Section */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <h3>📂 Upload File to Verify</h3>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    setVerifyFile(e.target.files?.[0] || null);
                    setVerifyManualHash("");
                    setVerifyResultMsg("");
                    setVerificationDetails(null);
                  }}
                  style={{ marginTop: "12px", marginBottom: "12px", width: "100%" }}
                />
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Upload the original evidence file to verify its authenticity.</p>
                <button 
                  onClick={handleVerifyEvidenceByFile}
                  disabled={!verifyFile || !verifySelectedEvidence}
                  style={{ background: "#10b981", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", width: "100%" }}
                >
                  🔐 Verify File
                </button>
              </div>

              {/* Hash Verification Section */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <h3>🔑 Enter Hash to Verify</h3>
                <input 
                  type="text"
                  value={verifyManualHash}
                  onChange={(e) => {
                    setVerifyManualHash(e.target.value);
                    setVerifyFile(null);
                    setVerifyResultMsg("");
                    setVerificationDetails(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  placeholder="Enter 64-character SHA-256 hash"
                  style={{ width: "100%", padding: "10px", marginTop: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                />
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Enter the SHA-256 hash of the evidence to verify.</p>
                <button 
                  onClick={handleVerifyEvidenceByHash}
                  disabled={!verifyManualHash || !verifySelectedEvidence}
                  style={{ background: "#3b82f6", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", width: "100%" }}
                >
                  🔐 Verify Hash
                </button>
              </div>
            </div>

            {verifyResultMsg && (
              <div style={{ 
                marginTop: "24px", 
                padding: "20px", 
                borderRadius: "12px", 
                background: verifyResultMsg.includes("✅") ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${verifyResultMsg.includes("✅") ? "#10b981" : "#ef4444"}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "32px" }}>{verifyResultMsg.includes("✅") ? "✅" : "❌"}</span>
                  <div>
                    <h3 style={{ margin: 0, color: verifyResultMsg.includes("✅") ? "#065f46" : "#991b1b" }}>{verifyResultMsg}</h3>
                    {verificationDetails && (
                      <div style={{ marginTop: "8px", fontSize: "12px" }}>
                        <p><strong>Stored Hash:</strong> <code>{verificationDetails.stored_hash}</code></p>
                        <p><strong>Provided Hash:</strong> <code>{verificationDetails.uploaded_hash || verificationDetails.provided_hash}</code></p>
                        <p><strong>Verified at:</strong> {new Date(verificationDetails.verification_time).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAIN OF CUSTODY TAB */}
      {activeTab === "chain" && <ForensicChainCustody token={token!} />}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div className="card">
          <h3>📝 Analysis Templates</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h4>💻 Digital Forensics</h4>
              <p>Standard template for digital evidence analysis</p>
              <ul style={{ fontSize: "13px" }}>
                <li>Device Information</li>
                <li>Acquisition Method</li>
                <li>Hash Verification</li>
                <li>Recovered Files</li>
                <li>Conclusion</li>
              </ul>
            </div>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h4>🧬 DNA Analysis</h4>
              <p>Standard template for DNA evidence analysis</p>
              <ul style={{ fontSize: "13px" }}>
                <li>Sample Information</li>
                <li>Extraction Method</li>
                <li>PCR Amplification</li>
                <li>Results</li>
                <li>Conclusion</li>
              </ul>
            </div>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h4>👆 Fingerprint Analysis</h4>
              <p>Standard template for fingerprint evidence</p>
              <ul style={{ fontSize: "13px" }}>
                <li>Latent Print Information</li>
                <li>Comparison Method</li>
                <li>Minutiae Points</li>
                <li>Comparison Results</li>
                <li>Conclusion</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="card" style={{ marginTop: "16px", background: message.includes("✅") ? "#d1fae5" : "#fee2e2" }}>
          <p style={{ color: message.includes("✅") ? "#065f46" : "#991b1b" }}>{message}</p>
        </div>
      )}
    </div>
  );
}
