import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type PendingCase = {
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  fir: {
    fir_number: string;
    complainant_name: string;
    complainant_email: string;
    complaint_text: string;
    filed_at: string;
  };
  investigator: {
    name: string;
    email: string;
    badge_number: string;
  };
  evidence_list: any[];
  total_evidence: number;
  submitted_at: string;
  priority: string;
  timeline?: any[];
};

export function ForensicCaseQueue({ token }: { token: string }) {
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [estimatedDays, setEstimatedDays] = useState(7);
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  useEffect(() => {
    loadPendingCases();
  }, []);

  async function loadPendingCases() {
    try {
      const cases = await apiRequest<PendingCase[]>("/forensic/pending-cases", {
        token,
      });
      setPendingCases(cases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewCaseDetails(caseId: string) {
    try {
      const caseData = await apiRequest<any>(
        `/forensic/case-details/${caseId}`,
        { token },
      );
      console.log("Case details received:", caseData);
      setSelectedCase(caseData);
      setShowModal(true);
    } catch (err) {
      console.error("Error loading case details:", err);
      setMessage("❌ Failed to load case details");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleAction(caseId: string) {
    if (action === "ACCEPT") {
      try {
        await apiRequest(`/forensic/case-action/${caseId}`, {
          method: "POST",
          token,
          body: { action: "ACCEPT", estimated_days: estimatedDays },
        });
        setMessage("✅ Case accepted for forensic analysis!");
        setTimeout(() => setMessage(""), 3000);

        // Close modals and refresh
        setShowModal(false);
        setAction(null);
        await loadPendingCases(); // Refresh queue

        // Also refresh accepted cases if that component exists
        // window.dispatchEvent(new Event('refreshAcceptedCases'));
      } catch (err) {
        setMessage("❌ Failed to accept case");
        setTimeout(() => setMessage(""), 3000);
      }
    } else if (action === "REJECT") {
      // ... similar
    }
  }

  function getPriorityColor(priority: string) {
    return priority === "HIGH" ? "#ef4444" : "#f59e0b";
  }

  function getStatusBadge(status: string) {
    const statusConfig: any = {
      PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "⏳" },
      ACCEPTED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: "✅" },
      REJECTED: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "❌" },
      COMPLETED: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: "📊" },
      TRANSFERRED_TO_FORENSIC: {
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.15)",
        icon: "🔬",
      },
    };
    const config = statusConfig[status] || {
      color: "#64748b",
      bg: "rgba(100,116,139,0.15)",
      icon: "📋",
    };
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "0.7rem",
          fontWeight: "500",
        }}
      >
        {config.icon} {status.replace(/_/g, " ")}
      </span>
    );
  }

  if (loading) {
    return <div className="fcq-loading">Loading pending cases...</div>;
  }

  return (
    <div className="fcq-container">
      <div className="fcq-header">
        <div>
          <h3>📋 Pending Forensic Cases</h3>
          <p>Review case details, accept or reject for forensic analysis</p>
        </div>
        <span className="fcq-badge">{pendingCases.length} Pending</span>
      </div>

      {pendingCases.length === 0 ? (
        <div className="fcq-empty">
          <div className="fcq-empty-icon">✅</div>
          <h4>No Pending Cases</h4>
          <p>All cases have been accepted or rejected</p>
        </div>
      ) : (
        <div className="fcq-list">
          {pendingCases.map((caseItem) => (
            <div key={caseItem.case_id} className="fcq-case-card">
              <div className="fcq-case-header">
                <div className="fcq-case-info">
                  <div className="fcq-case-icon">⚖️</div>
                  <div>
                    <div className="fcq-case-number">
                      {caseItem.case_number}
                    </div>
                    <div className="fcq-case-title">{caseItem.title}</div>
                    <div className="fcq-case-desc">
                      {caseItem.description?.substring(0, 100)}...
                    </div>
                  </div>
                </div>
                <div className="fcq-case-badges">
                  <span
                    className="fcq-priority"
                    style={{
                      background: `${getPriorityColor(caseItem.priority)}20`,
                      color: getPriorityColor(caseItem.priority),
                    }}
                  >
                    {caseItem.priority}
                  </span>
                  <span className="fcq-evidence-count">
                    📦 {caseItem.total_evidence} Evidence
                  </span>
                </div>
              </div>

              <div className="fcq-case-details">
                <div className="fcq-detail-item">
                  <span className="fcq-detail-label">👤 Complainant</span>
                  <span className="fcq-detail-value">
                    {caseItem.fir?.complainant_name || "N/A"}
                  </span>
                </div>
                <div className="fcq-detail-item">
                  <span className="fcq-detail-label">👮 Investigator</span>
                  <span className="fcq-detail-value">
                    {caseItem.investigator?.name || "Not Assigned"}
                  </span>
                </div>
                <div className="fcq-detail-item">
                  <span className="fcq-detail-label">📅 Submitted</span>
                  <span className="fcq-detail-value">
                    {caseItem.submitted_at
                      ? new Date(caseItem.submitted_at).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="fcq-case-actions">
                <button
                  className="fcq-btn-view"
                  onClick={() => viewCaseDetails(caseItem.case_id)}
                >
                  👁️ View Complete Case Details
                </button>
                <div className="fcq-action-buttons">
                  <button
                    className="fcq-btn-accept"
                    onClick={() => {
                      setSelectedCase(caseItem as any);
                      setAction("ACCEPT");
                    }}
                  >
                    ✅ Accept Case
                  </button>
                  <button
                    className="fcq-btn-reject"
                    onClick={() => {
                      setSelectedCase(caseItem as any);
                      setAction("REJECT");
                    }}
                  >
                    ❌ Reject Case
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accept Modal */}
      {action === "ACCEPT" && selectedCase && (
        <div
          className="fcq-modal-overlay"
          onClick={() => {
            setAction(null);
          }}
        >
          <div className="fcq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fcq-modal-header">
              <h3>✅ Accept Forensic Case</h3>
              <button
                className="fcq-modal-close"
                onClick={() => setAction(null)}
              >
                ✕
              </button>
            </div>
            <div className="fcq-modal-body">
              <p>
                Case: <strong>{selectedCase.case_number}</strong> -{" "}
                {selectedCase.title}
              </p>
              <div className="fcq-form-group">
                <label>Estimated Days for Analysis:</label>
                <input
                  type="number"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(parseInt(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>
            </div>
            <div className="fcq-modal-footer">
              <button
                className="fcq-btn-cancel"
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className="fcq-btn-accept"
                onClick={() => handleAction(selectedCase.case_id)}
              >
                Confirm Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {action === "REJECT" && selectedCase && (
        <div
          className="fcq-modal-overlay"
          onClick={() => {
            setAction(null);
          }}
        >
          <div className="fcq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fcq-modal-header">
              <h3>❌ Reject Forensic Case</h3>
              <button
                className="fcq-modal-close"
                onClick={() => setAction(null)}
              >
                ✕
              </button>
            </div>
            <div className="fcq-modal-body">
              <p>
                Case: <strong>{selectedCase.case_number}</strong> -{" "}
                {selectedCase.title}
              </p>
              <div className="fcq-form-group">
                <label>
                  Rejection Reason <span className="required">*</span>:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this case is being rejected..."
                />
              </div>
            </div>
            <div className="fcq-modal-footer">
              <button
                className="fcq-btn-cancel"
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className="fcq-btn-reject"
                onClick={() => handleAction(selectedCase.case_id)}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {showModal && selectedCase && !action && (
        <div
          className="fcq-modal-overlay"
          onClick={() => {
            setShowModal(false);
            setSelectedCase(null);
          }}
        >
          <div
            className="fcq-modal fcq-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fcq-modal-header">
              <h3>📋 Case Details: {selectedCase.case_number}</h3>
              <button
                className="fcq-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setSelectedCase(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="fcq-modal-body">
              {/* FIR Information */}
              <div className="fcq-section">
                <h4>📝 FIR Information</h4>
                <div className="fcq-info-grid">
                  <div>
                    <strong>FIR Number:</strong>{" "}
                    {selectedCase.fir?.fir_number || "N/A"}
                  </div>
                  <div>
                    <strong>Filed On:</strong>{" "}
                    {selectedCase.fir?.filed_at
                      ? new Date(selectedCase.fir.filed_at).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Complainant:</strong>{" "}
                    {selectedCase.fir?.complainant?.name ||
                      selectedCase.fir?.complainant_name ||
                      "N/A"}
                  </div>
                  <div>
                    <strong>Incident Date:</strong>{" "}
                    {selectedCase.fir?.incident_date
                      ? new Date(
                          selectedCase.fir.incident_date,
                        ).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Incident Location:</strong>{" "}
                    {selectedCase.fir?.incident_location || "N/A"}
                  </div>
                  <div className="full-width">
                    <strong>Complaint:</strong>{" "}
                    {selectedCase.fir?.complaint_text || "N/A"}
                  </div>
                </div>
              </div>

              {/* Investigator Information */}
              <div className="fcq-section">
                <h4>👮 Investigator Information</h4>
                <div className="fcq-info-grid">
                  <div>
                    <strong>Name:</strong>{" "}
                    {selectedCase.investigator?.name || "Not Assigned"}
                  </div>
                  <div>
                    <strong>Badge Number:</strong>{" "}
                    {selectedCase.investigator?.badge_number || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedCase.investigator?.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {selectedCase.investigator?.phone || "N/A"}
                  </div>
                </div>
              </div>

              {/* Suspects & Witnesses */}
              {(selectedCase.suspects?.length > 0 ||
                selectedCase.witnesses?.length > 0) && (
                <div className="fcq-section">
                  <h4>👥 Persons Involved</h4>
                  <div className="fcq-two-columns">
                    {selectedCase.suspects?.length > 0 && (
                      <div>
                        <strong>Suspects:</strong>
                        <ul>
                          {selectedCase.suspects.map((s: any, i: number) => (
                            <li key={i}>
                              {s.name} - {s.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedCase.witnesses?.length > 0 && (
                      <div>
                        <strong>Witnesses:</strong>
                        <ul>
                          {selectedCase.witnesses.map((w: any, i: number) => (
                            <li key={i}>{w.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evidence List - IMPROVED */}
              <div className="fcq-section">
                <h4>📦 Evidence ({selectedCase.evidence?.length || 0})</h4>
                {selectedCase.evidence?.length === 0 ? (
                  <div className="fcq-empty-small">
                    No evidence found for this case
                  </div>
                ) : (
                  <div className="fcq-evidence-grid">
                    {selectedCase.evidence?.map((ev: any, idx: number) => (
                      <div key={idx} className="fcq-evidence-card">
                        <div className="fcq-evidence-header">
                          <strong>{ev.title}</strong>
                          {getStatusBadge(ev.analysis_status || ev.status)}
                        </div>
                        <p className="fcq-evidence-desc">{ev.description}</p>
                        <div className="fcq-evidence-meta-grid">
                          <div>
                            <span>Type:</span> {ev.type || "DOCUMENT"}
                          </div>
                          <div>
                            <span>Submitted:</span>{" "}
                            {ev.submitted_to_forensic_at
                              ? new Date(
                                  ev.submitted_to_forensic_at,
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          {ev.accepted_at && (
                            <div>
                              <span>Accepted:</span>{" "}
                              {new Date(ev.accepted_at).toLocaleDateString()}
                            </div>
                          )}
                          {ev.analysis_completed_at && (
                            <div>
                              <span>Completed:</span>{" "}
                              {new Date(
                                ev.analysis_completed_at,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="fcq-evidence-actions">
                          {ev.ipfs_cid && (
                            <button
                              className="fcq-evidence-btn"
                              onClick={() =>
                                window.open(
                                  `https://dweb.link/ipfs/${ev.ipfs_cid}`,
                                  "_blank",
                                )
                              }
                            >
                              📄 View Evidence
                            </button>
                          )}
                          {ev.forensic_report && (
                            <button
                              className="fcq-evidence-btn"
                              onClick={() => {
                                setSelectedEvidence(ev);
                                setShowEvidenceModal(true);
                              }}
                            >
                              📊 View Forensic Report
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete Case Timeline */}
              <div className="fcq-section">
                <h4>
                  📅 Complete Case Timeline (
                  {selectedCase.timeline?.length || 0} events)
                </h4>
                {selectedCase.timeline?.length === 0 ? (
                  <div className="fcq-empty-small">
                    No timeline events available
                  </div>
                ) : (
                  <div className="fcq-timeline-full">
                    {selectedCase.timeline?.map((item: any, idx: number) => (
                      <div key={idx} className="fcq-timeline-item-full">
                        <div className="fcq-timeline-dot"></div>
                        <div className="fcq-timeline-content-full">
                          <div className="fcq-timeline-header">
                            <span className="fcq-timeline-icon">
                              {item.icon}
                            </span>
                            <strong>{item.event}</strong>
                            <span className="fcq-timeline-date">
                              {item.date
                                ? new Date(item.date).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          <p className="fcq-timeline-desc">
                            {item.description}
                          </p>
                          <div className="fcq-timeline-by">
                            By: {item.by || "System"}
                          </div>
                          {item.details && (
                            <details className="fcq-timeline-details">
                              <summary>View Details</summary>
                              <pre>{JSON.stringify(item.details, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="fcq-modal-footer">
              <button
                className="fcq-btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  setSelectedCase(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Report Modal */}
      {showEvidenceModal && selectedEvidence && (
        <div
          className="fcq-modal-overlay"
          onClick={() => {
            setShowEvidenceModal(false);
            setSelectedEvidence(null);
          }}
        >
          <div
            className="fcq-modal fcq-modal-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fcq-modal-header">
              <h3>📊 Forensic Report: {selectedEvidence.title}</h3>
              <button
                className="fcq-modal-close"
                onClick={() => {
                  setShowEvidenceModal(false);
                  setSelectedEvidence(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="fcq-modal-body">
              <div className="fcq-report-section">
                <strong>Report Number:</strong>{" "}
                {selectedEvidence.forensic_report?.report_number || "N/A"}
              </div>
              <div className="fcq-report-section">
                <strong>Analysis Type:</strong>{" "}
                {selectedEvidence.analysis_type || "Not specified"}
              </div>
              <div className="fcq-report-section">
                <strong>Findings:</strong>
                <div className="fcq-report-content">
                  {selectedEvidence.forensic_report?.findings ||
                    "No findings available"}
                </div>
              </div>
              <div className="fcq-report-section">
                <strong>Conclusion:</strong>
                <div className="fcq-report-content">
                  {selectedEvidence.forensic_report?.conclusion ||
                    "No conclusion available"}
                </div>
              </div>
              <div className="fcq-report-section">
                <strong>Generated At:</strong>{" "}
                {selectedEvidence.forensic_report?.created_at
                  ? new Date(
                      selectedEvidence.forensic_report.created_at,
                    ).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div className="fcq-modal-footer">
              <button
                className="fcq-btn-cancel"
                onClick={() => {
                  setShowEvidenceModal(false);
                  setSelectedEvidence(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`fcq-toast ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <style>{`
        .fcq-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .fcq-loading {
          text-align: center;
          padding: 60px;
          color: #7a849c;
        }
        
        .fcq-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.05));
          border-radius: 16px;
          border: 1px solid rgba(99,102,241,0.2);
        }
        
        .fcq-header h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }
        
        .fcq-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }
        
        .fcq-badge {
          background: #6366f1;
          color: white;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .fcq-case-card {
          background: rgba(12, 15, 26, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.3s;
        }
        
        .fcq-case-card:hover {
          border-color: rgba(99,102,241,0.35);
          transform: translateY(-2px);
        }
        
        .fcq-case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        
        .fcq-case-info {
          display: flex;
          gap: 16px;
          flex: 1;
        }
        
        .fcq-case-icon {
          font-size: 2rem;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
        }
        
        .fcq-case-number {
          font-size: 1rem;
          font-weight: 700;
          color: #818cf8;
          background: rgba(99,102,241,0.15);
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 8px;
        }
        
        .fcq-case-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: #e8ecf8;
          margin-bottom: 6px;
        }
        
        .fcq-case-desc {
          font-size: 0.8rem;
          color: #7a849c;
        }
        
        .fcq-case-badges {
          display: flex;
          gap: 10px;
        }
        
        .fcq-priority {
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .fcq-evidence-count {
          padding: 5px 14px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 500;
          color: #94a3b8;
        }
        
        .fcq-case-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 16px 0;
          margin: 12px 0;
          border-top: 1px solid rgba(99,102,241,0.1);
          border-bottom: 1px solid rgba(99,102,241,0.1);
        }
        
        .fcq-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .fcq-detail-label {
          font-size: 0.7rem;
          color: #7a849c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .fcq-detail-value {
          font-size: 0.9rem;
          color: #e8ecf8;
          font-weight: 500;
        }
        
        .fcq-case-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }
        
        .fcq-action-buttons {
          display: flex;
          gap: 12px;
        }
        
        .fcq-btn-view, .fcq-btn-accept, .fcq-btn-reject, .fcq-btn-cancel {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        
        .fcq-btn-view {
          background: rgba(30, 41, 59, 0.8);
          color: #94a3b8;
          border: 1px solid rgba(99,102,241,0.2);
        }
        
        .fcq-btn-view:hover {
          background: #1e293b;
          color: #e8ecf8;
        }
        
        .fcq-btn-accept {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .fcq-btn-accept:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        
        .fcq-btn-reject {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        
        .fcq-btn-reject:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        
        .fcq-btn-cancel {
          background: #334155;
          color: #94a3b8;
        }
        
        .fcq-btn-cancel:hover {
          background: #475569;
        }
        
        /* Modal Styles */
        .fcq-modal-overlay {
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
        
        .fcq-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 900px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        
        .fcq-modal-large { max-width: 1000px; }
        .fcq-modal-medium { max-width: 600px; }
        
        .fcq-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99,102,241,0.1);
        }
        
        .fcq-modal-header h3 {
          font-size: 1.2rem;
          color: #818cf8;
          margin: 0;
        }
        
        .fcq-modal-close {
          background: rgba(99,102,241,0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1.1rem;
          cursor: pointer;
        }
        
        .fcq-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        
        .fcq-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99,102,241,0.1);
        }
        
        /* Section Styles */
        .fcq-section {
          margin-bottom: 28px;
        }
        
        .fcq-section h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fcq-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          background: rgba(7, 9, 14, 0.5);
          padding: 16px;
          border-radius: 12px;
        }
        
        .fcq-info-grid .full-width {
          grid-column: span 2;
        }
        
        .fcq-info-grid div {
          font-size: 0.8rem;
          color: #7a849c;
        }
        
        .fcq-info-grid strong {
          color: #e8ecf8;
          margin-right: 8px;
        }
        
        /* Evidence Grid */
        .fcq-evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        
        .fcq-evidence-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 12px;
          padding: 14px;
        }
        
        .fcq-evidence-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .fcq-evidence-desc {
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 12px;
        }
        
        .fcq-evidence-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 0.7rem;
          color: #7a849c;
          margin-bottom: 12px;
        }
        
        .fcq-evidence-meta-grid span {
          color: #3d4459;
        }
        
        .fcq-evidence-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .fcq-evidence-btn {
          padding: 6px 12px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 6px;
          color: #818cf8;
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        /* Timeline */
        .fcq-timeline-full {
          position: relative;
          padding-left: 30px;
        }
        
        .fcq-timeline-item-full {
          position: relative;
          padding-bottom: 20px;
        }
        
        .fcq-timeline-dot {
          position: absolute;
          left: -22px;
          top: 4px;
          width: 10px;
          height: 10px;
          background: #6366f1;
          border-radius: 50%;
          border: 2px solid #818cf8;
        }
        
        .fcq-timeline-item-full::before {
          content: '';
          position: absolute;
          left: -18px;
          top: 14px;
          width: 2px;
          height: calc(100% - 10px);
          background: rgba(99,102,241,0.2);
        }
        
        .fcq-timeline-item-full:last-child::before {
          display: none;
        }
        
        .fcq-timeline-content-full {
          background: rgba(7, 9, 14, 0.5);
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
        }
        
        .fcq-timeline-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        
        .fcq-timeline-icon {
          font-size: 1.1rem;
        }
        
        .fcq-timeline-header strong {
          font-size: 0.85rem;
          color: #e8ecf8;
        }
        
        .fcq-timeline-date {
          font-size: 0.7rem;
          color: #3d4459;
          margin-left: auto;
        }
        
        .fcq-timeline-desc {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 6px 0;
        }
        
        .fcq-timeline-by {
          font-size: 0.65rem;
          color: #3d4459;
        }
        
        .fcq-timeline-details {
          margin-top: 8px;
        }
        
        .fcq-timeline-details summary {
          font-size: 0.7rem;
          color: #818cf8;
          cursor: pointer;
        }
        
        .fcq-timeline-details pre {
          font-size: 0.65rem;
          background: rgba(0,0,0,0.3);
          padding: 8px;
          border-radius: 6px;
          overflow-x: auto;
        }
        
        .fcq-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .fcq-two-columns ul {
          margin: 8px 0 0 20px;
          font-size: 0.8rem;
          color: #7a849c;
        }
        
        .fcq-empty-small {
          text-align: center;
          padding: 40px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          color: #7a849c;
        }
        
        .fcq-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }
        
        .fcq-empty-icon {
          font-size: 3.5rem;
          margin-bottom: 16px;
        }
        
        .fcq-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }
        
        .fcq-empty p {
          color: #7a849c;
          font-size: 0.8rem;
        }
        
        .fcq-form-group {
          margin-bottom: 20px;
        }
        
        .fcq-form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #7a849c;
        }
        
        .fcq-form-group input, .fcq-form-group textarea {
          width: 100%;
          padding: 10px 14px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
        }
        
        .fcq-form-group input:focus, .fcq-form-group textarea:focus {
          outline: none;
          border-color: #6366f1;
        }
        
        .fcq-report-section {
          margin-bottom: 20px;
        }
        
        .fcq-report-section strong {
          color: #818cf8;
          display: block;
          margin-bottom: 8px;
        }
        
        .fcq-report-content {
          background: rgba(7, 9, 14, 0.5);
          padding: 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.5;
        }
        
        .fcq-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          z-index: 1100;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .fcq-toast.success { background: #10b981; color: white; }
        .fcq-toast.error { background: #ef4444; color: white; }
        
        .required { color: #ef4444; margin-left: 2px; }
        
        @media (max-width: 768px) {
          .fcq-container { padding: 16px; }
          .fcq-case-header { flex-direction: column; }
          .fcq-case-details { grid-template-columns: 1fr; }
          .fcq-case-actions { flex-direction: column; }
          .fcq-action-buttons { width: 100%; }
          .fcq-btn-view, .fcq-btn-accept, .fcq-btn-reject { flex: 1; text-align: center; }
          .fcq-info-grid { grid-template-columns: 1fr; }
          .fcq-info-grid .full-width { grid-column: span 1; }
          .fcq-two-columns { grid-template-columns: 1fr; }
          .fcq-evidence-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
