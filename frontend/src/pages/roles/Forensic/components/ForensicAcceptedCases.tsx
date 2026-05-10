import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type AcceptedCase = {
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  fir: {
    fir_number: string;
    complainant_name: string;
    complaint_text: string;
    filed_at: string;
  };
  investigator: {
    name: string;
    email: string;
    badge_number: string;
  };
  evidence_stats: {
    total: number;
    accepted: number;
    completed: number;
    pending: number;
  };
  accepted_at: string;
  priority: string;
};

export function ForensicAcceptedCases({ token }: { token: string }) {
  const [acceptedCases, setAcceptedCases] = useState<AcceptedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAcceptedCases();
    // Refresh every 30 seconds to get updates
    const interval = setInterval(loadAcceptedCases, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadAcceptedCases() {
    try {
      const cases = await apiRequest<AcceptedCase[]>("/forensic/accepted-cases", { token });
      setAcceptedCases(cases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewCaseDetails(caseId: string) {
    try {
      const caseData = await apiRequest<any>(`/forensic/case-details/${caseId}`, { token });
      setSelectedCase(caseData);
      setShowModal(true);
    } catch (err) {
      setMessage("❌ Failed to load case details");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function getPriorityColor(priority: string) {
    return priority === "HIGH" ? "#ef4444" : "#f59e0b";
  }

  function getProgressWidth(stats: any) {
    if (stats.total === 0) return "0%";
    const completed = stats.completed || 0;
    return `${(completed / stats.total) * 100}%`;
  }

  if (loading) {
    return <div className="fac-loading">Loading accepted cases...</div>;
  }

  return (
    <div className="fac-container">
      <div className="fac-header">
        <div>
          <h3>✅ Accepted Forensic Cases</h3>
          <p>Cases currently under forensic analysis</p>
        </div>
        <span className="fac-badge">{acceptedCases.length} Active Cases</span>
      </div>

      {acceptedCases.length === 0 ? (
        <div className="fac-empty">
          <div className="fac-empty-icon">📭</div>
          <h4>No Accepted Cases</h4>
          <p>Cases you accept will appear here</p>
        </div>
      ) : (
        <div className="fac-list">
          {acceptedCases.map((caseItem) => (
            <div key={caseItem.case_id} className="fac-case-card">
              <div className="fac-case-header">
                <div className="fac-case-info">
                  <div className="fac-case-icon">✅</div>
                  <div>
                    <div className="fac-case-number">{caseItem.case_number}</div>
                    <div className="fac-case-title">{caseItem.title}</div>
                  </div>
                </div>
                <div className="fac-case-badges">
                  <span className="fac-priority" style={{ background: `${getPriorityColor(caseItem.priority)}20`, color: getPriorityColor(caseItem.priority) }}>
                    {caseItem.priority}
                  </span>
                  <span className="fac-date">Accepted: {caseItem.accepted_at ? new Date(caseItem.accepted_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>

              <div className="fac-case-details">
                <div className="fac-detail-item">
                  <span className="fac-detail-label">👤 Complainant</span>
                  <span className="fac-detail-value">{caseItem.fir?.complainant_name || "N/A"}</span>
                </div>
                <div className="fac-detail-item">
                  <span className="fac-detail-label">👮 Investigator</span>
                  <span className="fac-detail-value">{caseItem.investigator?.name || "Not Assigned"}</span>
                </div>
                <div className="fac-detail-item">
                  <span className="fac-detail-label">📊 Progress</span>
                  <div className="fac-progress-bar">
                    <div className="fac-progress-fill" style={{ width: getProgressWidth(caseItem.evidence_stats) }}></div>
                  </div>
                  <span className="fac-progress-text">{caseItem.evidence_stats?.completed || 0}/{caseItem.evidence_stats?.total || 0} completed</span>
                </div>
              </div>

              <div className="fac-evidence-stats">
                <div className="fac-stat">
                  <span className="fac-stat-value">{caseItem.evidence_stats?.total || 0}</span>
                  <span className="fac-stat-label">Total Evidence</span>
                </div>
                <div className="fac-stat">
                  <span className="fac-stat-value" style={{ color: "#10b981" }}>{caseItem.evidence_stats?.accepted || 0}</span>
                  <span className="fac-stat-label">Accepted</span>
                </div>
                <div className="fac-stat">
                  <span className="fac-stat-value" style={{ color: "#3b82f6" }}>{caseItem.evidence_stats?.completed || 0}</span>
                  <span className="fac-stat-label">Completed</span>
                </div>
                <div className="fac-stat">
                  <span className="fac-stat-value" style={{ color: "#f59e0b" }}>{caseItem.evidence_stats?.pending || 0}</span>
                  <span className="fac-stat-label">Pending</span>
                </div>
              </div>

              <div className="fac-case-actions">
                <button className="fac-btn-view" onClick={() => viewCaseDetails(caseItem.case_id)}>
                  👁️ View & Update Case
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Details Modal - Same as pending cases */}
      {showModal && selectedCase && (
        <div className="fac-modal-overlay" onClick={() => { setShowModal(false); setSelectedCase(null); }}>
          <div className="fac-modal fac-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="fac-modal-header">
              <h3>📋 Case Details: {selectedCase.case_number}</h3>
              <button className="fac-modal-close" onClick={() => { setShowModal(false); setSelectedCase(null); }}>✕</button>
            </div>
            <div className="fac-modal-body">
              {/* FIR Information */}
              <div className="fac-section">
                <h4>📝 FIR Information</h4>
                <div className="fac-info-grid">
                  <div><strong>FIR Number:</strong> {selectedCase.fir?.fir_number || "N/A"}</div>
                  <div><strong>Filed On:</strong> {selectedCase.fir?.filed_at ? new Date(selectedCase.fir.filed_at).toLocaleString() : "N/A"}</div>
                  <div><strong>Complainant:</strong> {selectedCase.fir?.complainant?.name || selectedCase.fir?.complainant_name || "N/A"}</div>
                  <div className="full-width"><strong>Complaint:</strong> {selectedCase.fir?.complaint_text || "N/A"}</div>
                </div>
              </div>

              {/* Investigator Information */}
              <div className="fac-section">
                <h4>👮 Investigator Information</h4>
                <div className="fac-info-grid">
                  <div><strong>Name:</strong> {selectedCase.investigator?.name || "Not Assigned"}</div>
                  <div><strong>Email:</strong> {selectedCase.investigator?.email || "N/A"}</div>
                  <div><strong>Badge Number:</strong> {selectedCase.investigator?.badge_number || "N/A"}</div>
                </div>
              </div>

              {/* Evidence List */}
              <div className="fac-section">
                <h4>📦 Evidence ({selectedCase.evidence?.length || 0})</h4>
                {selectedCase.evidence?.length === 0 ? (
                  <div className="fac-empty-small">No evidence found</div>
                ) : (
                  <div className="fac-evidence-grid">
                    {selectedCase.evidence?.map((ev: any, idx: number) => (
                      <div key={idx} className="fac-evidence-card">
                        <div className="fac-evidence-header">
                          <strong>{ev.title}</strong>
                          <span className={`fac-status-badge ${ev.analysis_status?.toLowerCase()}`}>
                            {ev.analysis_status || "PENDING"}
                          </span>
                        </div>
                        <p className="fac-evidence-desc">{ev.description}</p>
                        <div className="fac-evidence-actions">
                          {ev.ipfs_cid && (
                            <button className="fac-evidence-btn" onClick={() => window.open(`https://dweb.link/ipfs/${ev.ipfs_cid}`, "_blank")}>
                              📄 View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Timeline */}
              <div className="fac-section">
                <h4>📅 Case Timeline ({selectedCase.timeline?.length || 0} events)</h4>
                <div className="fac-timeline">
                  {selectedCase.timeline?.map((item: any, idx: number) => (
                    <div key={idx} className="fac-timeline-item">
                      <div className="fac-timeline-dot"></div>
                      <div className="fac-timeline-content">
                        <div className="fac-timeline-header">
                          <span className="fac-timeline-icon">{item.icon}</span>
                          <strong>{item.event}</strong>
                          <span className="fac-timeline-date">{item.date ? new Date(item.date).toLocaleString() : "N/A"}</span>
                        </div>
                        <p>{item.description}</p>
                        <div className="fac-timeline-by">By: {item.by || "System"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="fac-modal-footer">
              <button className="fac-btn-cancel" onClick={() => { setShowModal(false); setSelectedCase(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`fac-toast ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style>{`
        .fac-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .fac-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.05)); border-radius: 16px; border: 1px solid rgba(99,102,241,0.2); }
        .fac-header h3 { font-size: 1.3rem; font-weight: 600; color: #e8ecf8; margin: 0 0 4px 0; }
        .fac-header p { font-size: 0.8rem; color: #7a849c; margin: 0; }
        .fac-badge { background: #10b981; color: white; padding: 6px 16px; border-radius: 30px; font-size: 0.8rem; font-weight: 600; }
        .fac-case-card { background: rgba(12, 15, 26, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(99,102,241,0.15); border-radius: 16px; padding: 20px; margin-bottom: 16px; transition: all 0.3s; }
        .fac-case-card:hover { border-color: rgba(99,102,241,0.35); transform: translateY(-2px); }
        .fac-case-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; margin-bottom: 16px; }
        .fac-case-info { display: flex; gap: 16px; }
        .fac-case-icon { font-size: 2rem; background: linear-gradient(135deg, #10b981, #059669); width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 14px; }
        .fac-case-number { font-size: 1rem; font-weight: 700; color: #818cf8; background: rgba(99,102,241,0.15); padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 8px; }
        .fac-case-title { font-size: 1.1rem; font-weight: 500; color: #e8ecf8; }
        .fac-case-badges { display: flex; gap: 10px; align-items: center; }
        .fac-priority { padding: 5px 14px; border-radius: 30px; font-size: 0.7rem; font-weight: 600; }
        .fac-date { padding: 5px 14px; background: rgba(30, 41, 59, 0.8); border-radius: 30px; font-size: 0.7rem; color: #94a3b8; }
        .fac-case-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 16px 0; margin: 12px 0; border-top: 1px solid rgba(99,102,241,0.1); border-bottom: 1px solid rgba(99,102,241,0.1); }
        .fac-detail-item { display: flex; flex-direction: column; gap: 4px; }
        .fac-detail-label { font-size: 0.7rem; color: #7a849c; text-transform: uppercase; }
        .fac-detail-value { font-size: 0.9rem; color: #e8ecf8; font-weight: 500; }
        .fac-progress-bar { height: 6px; background: rgba(99,102,241,0.2); border-radius: 3px; overflow: hidden; margin: 8px 0 4px; }
        .fac-progress-fill { height: 100%; background: #10b981; border-radius: 3px; transition: width 0.3s; }
        .fac-progress-text { font-size: 0.65rem; color: #7a849c; }
        .fac-evidence-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 12px 0; margin-bottom: 16px; }
        .fac-stat { text-align: center; }
        .fac-stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: #e8ecf8; }
        .fac-stat-label { font-size: 0.65rem; color: #7a849c; }
        .fac-case-actions { display: flex; justify-content: flex-end; }
        .fac-btn-view, .fac-btn-cancel { padding: 10px 24px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
        .fac-btn-view { background: rgba(30, 41, 59, 0.8); color: #94a3b8; border: 1px solid rgba(99,102,241,0.2); }
        .fac-btn-view:hover { background: #1e293b; color: #e8ecf8; }
        .fac-btn-cancel { background: #334155; color: #94a3b8; }
        .fac-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(6, 8, 15, 0.95); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .fac-modal { background: linear-gradient(135deg, #0c0f1a, #07090e); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column; }
        .fac-modal-large { max-width: 1000px; }
        .fac-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .fac-modal-header h3 { font-size: 1.2rem; color: #818cf8; margin: 0; }
        .fac-modal-close { background: rgba(99,102,241,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #7a849c; font-size: 1.1rem; cursor: pointer; }
        .fac-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .fac-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(99,102,241,0.1); }
        .fac-section { margin-bottom: 28px; }
        .fac-section h4 { font-size: 0.95rem; font-weight: 600; color: #818cf8; margin-bottom: 16px; }
        .fac-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: rgba(7, 9, 14, 0.5); padding: 16px; border-radius: 12px; }
        .fac-info-grid .full-width { grid-column: span 2; }
        .fac-info-grid div { font-size: 0.8rem; color: #7a849c; }
        .fac-info-grid strong { color: #e8ecf8; margin-right: 8px; }
        .fac-evidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .fac-evidence-card { background: rgba(7, 9, 14, 0.5); border: 1px solid rgba(99,102,241,0.1); border-radius: 12px; padding: 14px; }
        .fac-evidence-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .fac-status-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 500; }
        .fac-status-badge.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .fac-status-badge.accepted { background: rgba(16,185,129,0.15); color: #10b981; }
        .fac-status-badge.completed { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .fac-evidence-desc { font-size: 0.75rem; color: #7a849c; margin-bottom: 12px; }
        .fac-evidence-actions { display: flex; gap: 8px; }
        .fac-evidence-btn { padding: 6px 12px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 6px; color: #818cf8; font-size: 0.7rem; cursor: pointer; }
        .fac-timeline { position: relative; padding-left: 30px; }
        .fac-timeline-item { position: relative; padding-bottom: 20px; }
        .fac-timeline-dot { position: absolute; left: -22px; top: 4px; width: 10px; height: 10px; background: #6366f1; border-radius: 50%; border: 2px solid #818cf8; }
        .fac-timeline-item::before { content: ''; position: absolute; left: -18px; top: 14px; width: 2px; height: calc(100% - 10px); background: rgba(99,102,241,0.2); }
        .fac-timeline-item:last-child::before { display: none; }
        .fac-timeline-content { background: rgba(7, 9, 14, 0.5); padding: 14px; border-radius: 12px; }
        .fac-timeline-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
        .fac-timeline-icon { font-size: 1.1rem; }
        .fac-timeline-header strong { font-size: 0.85rem; color: #e8ecf8; }
        .fac-timeline-date { font-size: 0.7rem; color: #3d4459; margin-left: auto; }
        .fac-timeline-content p { font-size: 0.75rem; color: #7a849c; margin: 6px 0; }
        .fac-timeline-by { font-size: 0.65rem; color: #3d4459; }
        .fac-empty { text-align: center; padding: 60px 20px; background: rgba(12, 15, 26, 0.6); border-radius: 16px; }
        .fac-empty-icon { font-size: 3.5rem; margin-bottom: 16px; }
        .fac-empty-small { text-align: center; padding: 40px; background: rgba(7, 9, 14, 0.5); border-radius: 12px; color: #7a849c; }
        .fac-toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; z-index: 1100; animation: slideIn 0.3s ease; }
        .fac-toast.success { background: #10b981; color: white; }
        .fac-toast.error { background: #ef4444; color: white; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 768px) {
          .fac-container { padding: 16px; }
          .fac-case-details { grid-template-columns: 1fr; }
          .fac-evidence-stats { grid-template-columns: repeat(2, 1fr); }
          .fac-info-grid { grid-template-columns: 1fr; }
          .fac-info-grid .full-width { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}