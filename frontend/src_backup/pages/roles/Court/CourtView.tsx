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
  ipfs_cid: string;
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
  
  // Judgment Form
  const [judgmentVerdict, setJudgmentVerdict] = useState("");
  const [judgmentSentence, setJudgmentSentence] = useState("");
  const [judgmentReasoning, setJudgmentReasoning] = useState("");
  const [judgmentPunishment, setJudgmentPunishment] = useState("");
  
  // Hearing Form
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [hearingType, setHearingType] = useState("VIRTUAL");
  const [hearingNotes, setHearingNotes] = useState("");
  
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
  const [verifySelectedEvidence, setVerifySelectedEvidence] = useState<any>(null);
  const [verifyTimeline, setVerifyTimeline] = useState<any[] | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyManualHash, setVerifyManualHash] = useState("");
  const [verifyResultMsg, setVerifyResultMsg] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [casesData, judgmentsData, statsData] = await Promise.all([
        apiRequest<CaseForReview[]>("/court/cases-for-review", { token }).catch(() => []),
        apiRequest<Judgment[]>("/court/judgments", { token }).catch(() => []),
        apiRequest<CourtStats>("/court/stats", { token }).catch(() => null)
      ]);
      setCases(casesData);
      setJudgments(judgmentsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliverJudgment() {
    if (!selectedCase || !judgmentVerdict || !judgmentReasoning) {
      setMessage("❌ Please fill verdict and reasoning");
      return;
    }

    try {
      const result = await apiRequest<any>("/court/judgment", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase.case_id,
          verdict: judgmentVerdict,
          sentence: judgmentSentence,
          reasoning: judgmentReasoning,
          punishment_details: judgmentPunishment
        }
      });
      const judgmentNumber = result?.judgment_number || "Unknown";
      setMessage(`✅ Judgment delivered! Judgment ID: ${judgmentNumber}`);
      setShowJudgmentModal(false);
      setSelectedCase(null);
      setJudgmentVerdict("");
      setJudgmentSentence("");
      setJudgmentReasoning("");
      setJudgmentPunishment("");
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to deliver judgment");
    }
  }

  async function handleScheduleHearing() {
    if (!selectedCase || !hearingDate || !hearingTime) {
      setMessage("❌ Please fill hearing date and time");
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
          notes: hearingNotes
        }
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
    }
  }

  async function handleReviewEvidence() {
    if (!selectedEvidence || !evidenceReviewNotes) {
      setMessage("❌ Please enter review notes");
      return;
    }

    try {
      await apiRequest("/court/review-evidence", {
        method: "POST",
        token,
        body: {
          evidence_id: selectedEvidence.evidence_id,
          review_notes: evidenceReviewNotes,
          is_admissible: evidenceAdmissible
        }
      });
      setMessage(`✅ Evidence marked as ${evidenceAdmissible ? "ADMISSIBLE" : "INADMISSIBLE"}`);
      setShowEvidenceModal(false);
      setSelectedEvidence(null);
      setEvidenceReviewNotes("");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to review evidence");
    }
  }

  async function handleSearch() {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (searchStatus) params.append("status", searchStatus);
    
    try {
      const results = await apiRequest<any[]>(`/court/search?${params.toString()}`, { token });
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  }

  // ============ Verify Evidence Functions ============
  async function loadEvidenceForCase(caseId: string) {
    try {
      const evidence = await apiRequest<any[]>(`/court/evidence-list/${caseId}`, { token });
      setVerifyEvidenceList(evidence);
    } catch (err) {
      console.error("Error loading evidence:", err);
      setVerifyEvidenceList([]);
    }
  }

  async function loadEvidenceTimeline(evidenceId: string) {
    try {
      const data = await apiRequest<any>(`/court/evidence-timeline/${evidenceId}`, { token });
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
        { method: "POST", token }
      );
      setVerifyResultMsg(result.message);
      setVerificationDetails({
        stored_hash: result.stored_hash,
        provided_hash: verifyManualHash,
        verification_time: result.verification_time
      });
      await loadEvidenceTimeline(verifySelectedEvidence.evidence_id);
    } catch (err) {
      setVerifyResultMsg("❌ Verification failed");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      SUBMITTED_TO_COURT: "#f59e0b",
      UNDER_COURT_REVIEW: "#3b82f6",
      DECIDED: "#10b981"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>{status.replace(/_/g, " ")}</span>;
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#10b981"
    };
    return <span style={{ background: colors[priority] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{priority}</span>;
  }

  function getVerdictBadge(verdict: string) {
    const colors: Record<string, string> = {
      GUILTY: "#ef4444",
      NOT_GUILTY: "#10b981",
      ACQUITTED: "#3b82f6",
      CONVICTED: "#ef4444"
    };
    return <span style={{ background: colors[verdict] || "#6b7280", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>{verdict}</span>;
  }

  if (loading) {
    return <div className="card">Loading court dashboard...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>⚖️</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{stats.pending_cases}</div>
            <div>Pending Cases</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>✅</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{stats.decided_cases}</div>
            <div>Decided Cases</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>📜</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.total_judgments}</div>
            <div>Total Judgments</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>🎙️</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats.upcoming_hearings}</div>
            <div>Upcoming Hearings</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("dashboard")} style={{ background: activeTab === "dashboard" ? "#3b82f6" : "transparent", color: activeTab === "dashboard" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📊 Dashboard</button>
        <button onClick={() => setActiveTab("cases")} style={{ background: activeTab === "cases" ? "#3b82f6" : "transparent", color: activeTab === "cases" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📋 Cases for Review ({cases.length})</button>
        <button onClick={() => setActiveTab("judgments")} style={{ background: activeTab === "judgments" ? "#3b82f6" : "transparent", color: activeTab === "judgments" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>📜 Past Judgments ({judgments.length})</button>
        <button onClick={() => setActiveTab("search")} style={{ background: activeTab === "search" ? "#3b82f6" : "transparent", color: activeTab === "search" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>🔍 Search Cases</button>
        <button onClick={() => setActiveTab("verify")} style={{ background: activeTab === "verify" ? "#3b82f6" : "transparent", color: activeTab === "verify" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>🔐 Verify Evidence</button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && stats && (
        <div>
          <div className="card">
            <h3>📊 Court Performance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <h4>Verdict Breakdown</h4>
                {Object.entries(stats.verdict_breakdown).map(([verdict, count]) => (
                  <div key={verdict} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>{verdict}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                      <div style={{ width: `${(count / stats.total_judgments) * 100}%`, height: "100%", background: verdict === "GUILTY" ? "#ef4444" : "#10b981", borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4>Pending Cases by Priority</h4>
                {Object.entries(stats.priority_breakdown).map(([priority, count]) => {
                  const colors: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
                  return (
                    <div key={priority} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>{priority}</span>
                        <span>{count}</span>
                      </div>
                      <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                        <div style={{ width: `${(count / stats.pending_cases) * 100}%`, height: "100%", background: colors[priority], borderRadius: "4px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>⚡ Quick Actions</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <button onClick={() => setActiveTab("cases")} style={{ background: "#3b82f6", cursor: "pointer" }}>📋 Review Pending Cases</button>
              <button onClick={() => setActiveTab("judgments")} style={{ background: "#8b5cf6", cursor: "pointer" }}>📜 View Past Judgments</button>
            </div>
          </div>
        </div>
      )}

      {/* CASES FOR REVIEW TAB */}
      {activeTab === "cases" && (
        <div className="card">
          <h3>📋 Cases for Court Review</h3>
          {cases.length === 0 ? (
            <p>No cases pending for court review.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {cases.map((caseItem) => (
                <div key={caseItem.case_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                    <div>
                      <strong style={{ fontSize: "18px" }}>{caseItem.case_number}</strong>
                      <span style={{ marginLeft: "12px" }}>{getPriorityBadge(caseItem.priority)}</span>
                      <span style={{ marginLeft: "8px" }}>{getStatusBadge(caseItem.status)}</span>
                    </div>
                    <button 
                      onClick={() => { setSelectedCase(caseItem); setShowJudgmentModal(true); }}
                      style={{ background: "#ef4444", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
                    >
                      ⚖️ Deliver Judgment
                    </button>
                  </div>
                  
                  <h4>{caseItem.title}</h4>
                  <p style={{ color: "#666" }}>{caseItem.description}</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                    <div>
                      <strong>Complainant:</strong> {caseItem.complainant_name}
                      <div style={{ fontSize: "12px", color: "#666" }}>{caseItem.complainant_contact}</div>
                    </div>
                    <div>
                      <strong>Investigator:</strong> {caseItem.investigator_name}
                    </div>
                    <div>
                      <strong>FIR Number:</strong> {caseItem.fir_number}
                    </div>
                    <div>
                      <strong>Submitted:</strong> {new Date(caseItem.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <details style={{ marginTop: "16px" }}>
                    <summary style={{ cursor: "pointer", color: "#3b82f6" }}>📦 View Evidence ({caseItem.evidence_count})</summary>
                    <div style={{ marginTop: "12px" }}>
                      {caseItem.evidence.map((ev) => (
                        <div key={ev.evidence_id} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                          <div>
                            <strong>{ev.title}</strong>
                            <div style={{ fontSize: "12px", color: "#666" }}>{ev.description}</div>
                          </div>
                          <div>
                            <button 
                              onClick={() => { setSelectedEvidence(ev); setShowEvidenceModal(true); }}
                              style={{ background: "#8b5cf6", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                            >
                              📝 Review
                            </button>
                            <button 
                              onClick={() => window.open(`https://dweb.link/ipfs/${ev.ipfs_cid}`, "_blank")}
                              style={{ background: "#3b82f6", marginLeft: "8px", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                            >
                              👁️ View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <details style={{ marginTop: "12px" }}>
                    <summary style={{ cursor: "pointer", color: "#3b82f6" }}>👤 Suspects ({caseItem.suspects.length})</summary>
                    <div style={{ marginTop: "12px" }}>
                      {caseItem.suspects.map((suspect, idx) => (
                        <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", padding: "8px" }}>
                          <strong>{suspect.name}</strong> - {suspect.description}
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <details style={{ marginTop: "12px" }}>
                    <summary style={{ cursor: "pointer", color: "#3b82f6" }}>👥 Witnesses ({caseItem.witnesses.length})</summary>
                    <div style={{ marginTop: "12px" }}>
                      {caseItem.witnesses.map((witness, idx) => (
                        <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", padding: "8px" }}>
                          <strong>{witness.name}</strong> - {witness.statement}
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                    <button 
                      onClick={() => { setSelectedCase(caseItem); setShowHearingModal(true); }}
                      style={{ background: "#10b981", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      🎙️ Schedule Hearing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JUDGMENT MODAL */}
      {showJudgmentModal && selectedCase && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => { setShowJudgmentModal(false); setSelectedCase(null); }} />
          <div className="card" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, width: "90%", maxWidth: "600px", maxHeight: "80%", overflow: "auto" }}>
            {/* ... judgment modal content ... */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>⚖️ Deliver Judgment</h2>
              <button onClick={() => { setShowJudgmentModal(false); setSelectedCase(null); }} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>✕ Close</button>
            </div>
            <hr />
            <p><strong>Case:</strong> {selectedCase.case_number} - {selectedCase.title}</p>
            <div className="form-grid">
              <label>Verdict *</label>
              <select value={judgmentVerdict} onChange={(e) => setJudgmentVerdict(e.target.value)} style={{ padding: "10px", borderRadius: "6px" }}>
                <option value="">-- Select Verdict --</option>
                <option value="GUILTY">GUILTY</option>
                <option value="NOT_GUILTY">NOT GUILTY</option>
                <option value="ACQUITTED">ACQUITTED</option>
                <option value="CONVICTED">CONVICTED</option>
              </select>
              <label>Sentence</label>
              <input value={judgmentSentence} onChange={(e) => setJudgmentSentence(e.target.value)} placeholder="e.g., 5 years imprisonment, fine of Rs. 50,000" />
              <label>Reasoning *</label>
              <textarea value={judgmentReasoning} onChange={(e) => setJudgmentReasoning(e.target.value)} rows={5} placeholder="Detailed reasoning for the judgment..." />
              <label>Punishment Details</label>
              <textarea value={judgmentPunishment} onChange={(e) => setJudgmentPunishment(e.target.value)} rows={3} placeholder="Specific punishment details..." />
              <button onClick={handleDeliverJudgment} style={{ background: "#ef4444", cursor: "pointer" }}>⚖️ Deliver Judgment</button>
            </div>
          </div>
        </>
      )}

      {/* HEARING MODAL */}
      {showHearingModal && selectedCase && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => { setShowHearingModal(false); setSelectedCase(null); }} />
          <div className="card" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, width: "90%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>🎙️ Schedule Hearing</h2>
              <button onClick={() => { setShowHearingModal(false); setSelectedCase(null); }} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>✕ Close</button>
            </div>
            <hr />
            <p><strong>Case:</strong> {selectedCase.case_number}</p>
            <div className="form-grid">
              <label>Hearing Date *</label>
              <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} />
              <label>Hearing Time *</label>
              <input type="time" value={hearingTime} onChange={(e) => setHearingTime(e.target.value)} />
              <label>Hearing Type</label>
              <select value={hearingType} onChange={(e) => setHearingType(e.target.value)}>
                <option value="VIRTUAL">💻 Virtual</option>
                <option value="PHYSICAL">🏛️ Physical</option>
              </select>
              <label>Notes</label>
              <textarea value={hearingNotes} onChange={(e) => setHearingNotes(e.target.value)} rows={3} placeholder="Any additional notes..." />
              <button onClick={handleScheduleHearing} style={{ background: "#10b981", cursor: "pointer" }}>📅 Schedule Hearing</button>
            </div>
          </div>
        </>
      )}

      {/* EVIDENCE REVIEW MODAL */}
      {showEvidenceModal && selectedEvidence && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => { setShowEvidenceModal(false); setSelectedEvidence(null); }} />
          <div className="card" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, width: "90%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>📝 Review Evidence</h2>
              <button onClick={() => { setShowEvidenceModal(false); setSelectedEvidence(null); }} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>✕ Close</button>
            </div>
            <hr />
            <p><strong>Evidence:</strong> {selectedEvidence.title}</p>
            <p style={{ fontSize: "13px", color: "#666" }}>{selectedEvidence.description}</p>
            <div className="form-grid">
              <label>Admissibility</label>
              <select value={evidenceAdmissible ? "true" : "false"} onChange={(e) => setEvidenceAdmissible(e.target.value === "true")}>
                <option value="true">✅ Admissible</option>
                <option value="false">❌ Inadmissible</option>
              </select>
              <label>Review Notes *</label>
              <textarea value={evidenceReviewNotes} onChange={(e) => setEvidenceReviewNotes(e.target.value)} rows={4} placeholder="Your review notes..." />
              <button onClick={handleReviewEvidence} style={{ background: "#8b5cf6", cursor: "pointer" }}>Submit Review</button>
            </div>
          </div>
        </>
      )}

      {/* PAST JUDGMENTS TAB */}
      {activeTab === "judgments" && (
        <div className="card">
          <h3>📜 Past Judgments</h3>
          {judgments.length === 0 ? (
            <p>No judgments delivered yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {judgments.map((judgment) => (
                <div key={judgment.judgment_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <strong>{judgment.judgment_number}</strong>
                      <span style={{ marginLeft: "12px" }}>{getVerdictBadge(judgment.verdict)}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#999" }}>{new Date(judgment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ marginTop: "8px" }}><strong>Case:</strong> {judgment.case_number} - {judgment.case_title}</p>
                  <p><strong>Judge:</strong> {judgment.judge_name}</p>
                  <p><strong>Sentence:</strong> {judgment.sentence || "None"}</p>
                  <details>
                    <summary style={{ cursor: "pointer", color: "#3b82f6" }}>View Reasoning</summary>
                    <div style={{ marginTop: "8px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                      {judgment.reasoning}
                    </div>
                  </details>
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", color: "#666", fontSize: "12px" }}>IPFS Details</summary>
                    <code style={{ fontSize: "10px", wordBreak: "break-all" }}>CID: {judgment.ipfs_cid}</code>
                    <br />
                    <code style={{ fontSize: "10px", wordBreak: "break-all" }}>Hash: {judgment.hash}</code>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEARCH CASES TAB */}
      {activeTab === "search" && (
        <div className="card">
          <h3>🔍 Search Cases</h3>
          <div className="form-grid">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label>Keyword</label>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Case number, title..." />
              </div>
              <div>
                <label>Status</label>
                <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="SUBMITTED_TO_COURT">Submitted to Court</option>
                  <option value="UNDER_COURT_REVIEW">Under Review</option>
                  <option value="DECIDED">Decided</option>
                </select>
              </div>
            </div>
            <button onClick={handleSearch} style={{ background: "#3b82f6", cursor: "pointer" }}>🔍 Search</button>
          </div>
          
          {searchResults.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h4>Search Results ({searchResults.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {searchResults.map((result) => (
                  <div key={result.case_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{result.case_number}</strong>
                      {getStatusBadge(result.status)}
                    </div>
                    <p><strong>{result.title}</strong></p>
                    <p style={{ fontSize: "13px", color: "#666" }}>Complainant: {result.complainant_name}</p>
                    <p style={{ fontSize: "12px", color: "#999" }}>Filed: {new Date(result.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VERIFY EVIDENCE TAB */}
      {activeTab === "verify" && (
        <div className="card">
          <h2>🔐 Verify Evidence Authenticity</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
            Verify evidence authenticity by uploading the original file or entering the hash.
            Complete chain of custody is shown below.
          </p>
          
          <div className="form-grid">
            <label>📁 Step 1: Select Case</label>
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
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <option value="">-- Select Case --</option>
              {cases.map((caseItem) => (
                <option key={caseItem.case_id} value={caseItem.case_id}>
                  {caseItem.case_number} - {caseItem.title}
                </option>
              ))}
            </select>

            <label>📋 Step 2: Select Evidence</label>
            <select 
              value={verifySelectedEvidence?.evidence_id || ""} 
              onChange={async (e) => {
                const evId = e.target.value;
                const ev = verifyEvidenceList.find(ev => ev.evidence_id === evId);
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
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={!verifyCaseId || verifyEvidenceList.length === 0}
            >
              <option value="">-- Select Evidence --</option>
              {verifyEvidenceList.map((ev) => (
                <option key={ev.evidence_id} value={ev.evidence_id}>
                  {ev.title} - {ev.status}
                </option>
              ))}
            </select>
          </div>

          {/* Evidence Details */}
          {verifySelectedEvidence && (
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginTop: "16px" }}>
              <h3>📄 Evidence Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", marginTop: "12px" }}>
                <div><strong>ID:</strong> {verifySelectedEvidence.evidence_id}</div>
                <div><strong>Title:</strong> {verifySelectedEvidence.title}</div>
                <div><strong>Description:</strong> {verifySelectedEvidence.description}</div>
                <div><strong>Status:</strong> {verifySelectedEvidence.status}</div>
                <div><strong>Created By:</strong> {verifySelectedEvidence.created_by}</div>
                <div><strong>Created At:</strong> {new Date(verifySelectedEvidence.created_at).toLocaleString()}</div>
                <div><strong>Stored Hash:</strong> <code style={{ fontSize: "11px", wordBreak: "break-all" }}>{verifySelectedEvidence.hash}</code></div>
                <div><strong>IPFS CID:</strong> <code style={{ fontSize: "11px", wordBreak: "break-all" }}>{verifySelectedEvidence.ipfs_cid}</code></div>
              </div>
            </div>
          )}

          {/* Chain of Custody Timeline */}
          {verifyTimeline && verifyTimeline.length > 0 && (
            <div style={{ marginTop: "24px", marginBottom: "24px", background: "#f0fdf4", padding: "20px", borderRadius: "12px", border: "1px solid #10b981" }}>
              <h3>📅 Chain of Custody Timeline</h3>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
                Complete history of this evidence from upload to present
              </p>
              <div style={{ position: "relative", paddingLeft: "30px" }}>
                {verifyTimeline.map((event, idx) => (
                  <div key={idx} style={{ position: "relative", paddingBottom: "20px", borderLeft: `2px solid ${event.color || "#e2e8f0"}`, marginLeft: "10px", paddingLeft: "20px" }}>
                    <div style={{ position: "absolute", left: "-12px", top: "0", width: "24px", height: "24px", borderRadius: "50%", background: event.color || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "white" }}>
                      {event.icon || "📋"}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>{event.title}</strong>
                      <span style={{ fontSize: "11px", color: "#999", marginLeft: "12px" }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>{event.description}</div>
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>By: {event.by}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Section */}
          {verifySelectedEvidence && (
            <div style={{ marginTop: "24px" }}>
              <h3>🔐 Verify This Evidence</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
                
                {/* File Upload Verification */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                  <h4>📂 Upload Original File</h4>
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
                  <button 
                    onClick={handleVerifyEvidenceByFile}
                    disabled={!verifyFile}
                    style={{ background: "#10b981", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", width: "100%", marginTop: "8px" }}
                  >
                    🔐 Verify File
                  </button>
                </div>

                {/* Hash Verification */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                  <h4>🔑 Enter Hash</h4>
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
                  <button 
                    onClick={handleVerifyEvidenceByHash}
                    disabled={!verifyManualHash}
                    style={{ background: "#3b82f6", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", width: "100%", marginTop: "8px" }}
                  >
                    🔐 Verify Hash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verifyResultMsg && (
            <div style={{ 
              marginTop: "24px", 
              padding: "20px", 
              borderRadius: "12px", 
              background: verifyResultMsg.includes("✅") ? "#d1fae5" : "#fee2e2",
              border: `1px solid ${verifyResultMsg.includes("✅") ? "#10b981" : "#ef4444"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "40px" }}>{verifyResultMsg.includes("✅") ? "✅" : "❌"}</span>
                <div>
                  <h3 style={{ margin: 0, color: verifyResultMsg.includes("✅") ? "#065f46" : "#991b1b" }}>{verifyResultMsg}</h3>
                  {verificationDetails && (
                    <div style={{ marginTop: "8px", fontSize: "13px" }}>
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
      )}

      {message && (
        <div className="card" style={{ marginTop: "16px", background: message.includes("✅") ? "#d1fae5" : "#fee2e2" }}>
          <p style={{ color: message.includes("✅") ? "#065f46" : "#991b1b" }}>{message}</p>
        </div>
      )}
    </div>
  );
}
