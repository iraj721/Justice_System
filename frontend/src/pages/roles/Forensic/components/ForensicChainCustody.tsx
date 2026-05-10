import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type HistoryItem = {
  type: string;
  timestamp: string;
  action: string;
  description: string;
  by?: string;
  by_name?: string;
  from?: string;
  from_name?: string;
  to?: string;
  to_name?: string;
  reason?: string;
  result?: boolean;
  details?: any;
};

type EvidenceHistory = {
  evidence_id: string;
  evidence_title: string;
  evidence_description: string;
  current_status: string;
  current_analysis_status: string;
  current_custodian: string;
  current_custodian_name: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  history: HistoryItem[];
  verification_count: number;
  view_count: number;
  transfer_count: number;
  last_verified_at: string | null;
};

type Case = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
};

export function ForensicChainCustody({ token }: { token: string }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceHistory | null>(null);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoadingCases(true);
    try {
      let cases = [];
      try {
        cases = await apiRequest<Case[]>("/cases/list", { token });
      } catch {
        try {
          cases = await apiRequest<Case[]>("/cases", { token });
        } catch {
          cases = await apiRequest<Case[]>("/forensic/cases-list", { token });
        }
      }
      console.log("Cases loaded:", cases);
      setAllCases(cases || []);
    } catch (err) {
      console.error("Error loading cases:", err);
      setMessage("❌ Failed to load cases");
    } finally {
      setLoadingCases(false);
    }
  }

  async function loadEvidenceForCase(caseId: string) {
    if (!caseId) {
      setCaseEvidence([]);
      return;
    }
    setLoadingEvidence(true);
    try {
      let evidence = [];
      try {
        evidence = await apiRequest<any[]>(`/cases/${caseId}/evidence`, { token });
      } catch {
        try {
          const allEvidence = await apiRequest<any[]>("/forensic/forensic-evidence", { token });
          evidence = allEvidence.filter(ev => ev.case_id === caseId);
        } catch {
          evidence = [];
        }
      }
      console.log(`Evidence for case ${caseId}:`, evidence);
      setCaseEvidence(evidence || []);
    } catch (err) {
      console.error("Error loading evidence:", err);
      setCaseEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  }

  async function loadEvidenceHistory() {
    if (!selectedEvidenceId) {
      setEvidenceHistory(null);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await apiRequest<EvidenceHistory>(
        `/forensic/chain/evidence-history/${selectedEvidenceId}`,
        { token },
      );
      console.log("Evidence history:", data);
      setEvidenceHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
      setMessage("❌ Failed to load evidence history");
      setEvidenceHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (selectedCaseId) {
      loadEvidenceForCase(selectedCaseId);
      setSelectedEvidenceId("");
      setEvidenceHistory(null);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedEvidenceId) {
      loadEvidenceHistory();
    }
  }, [selectedEvidenceId]);

  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      CREATION: "📤",
      VERIFICATION: "✅",
      ACCESS: "👁️",
      TRANSFER: "🔄",
      FORENSIC_SUBMISSION: "🔬",
      FORENSIC_ACCEPTANCE: "✅",
      FORENSIC_REJECTION: "❌",
      ANALYSIS_START: "⚙️",
      ANALYSIS_COMPLETE: "📊",
      COURT_SUBMISSION: "🏛️",
    };
    return icons[type] || "📋";
  }

  function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      CREATION: "#10b981",
      VERIFICATION: "#3b82f6",
      ACCESS: "#8b5cf6",
      TRANSFER: "#f59e0b",
      FORENSIC_SUBMISSION: "#ec4899",
      FORENSIC_ACCEPTANCE: "#10b981",
      FORENSIC_REJECTION: "#ef4444",
      ANALYSIS_START: "#06b6d4",
      ANALYSIS_COMPLETE: "#6366f1",
      COURT_SUBMISSION: "#8b5cf6",
    };
    return colors[type] || "#64748b";
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  }

  if (loadingCases) {
    return (
      <div className="fcc-loading">
        <div className="fcc-spinner"></div>
        <p>Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="fcc-container">
      <div className="fcc-header">
        <div>
          <h3>🔗 Complete Chain of Custody</h3>
          <p>Select a case, then choose evidence to view complete history</p>
        </div>
      </div>

      {/* Step 1: Select Case */}
      <div className="fcc-card">
        <div className="fcc-card-header">
          <div className="fcc-card-icon">📁</div>
          <div>
            <h3>Step 1: Select Case</h3>
            <p>Choose a case to see its evidence</p>
          </div>
        </div>
        <div className="fcc-select-section">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="fcc-select-custom"
          >
            <option value="">-- Select Case --</option>
            {allCases.map((caseItem) => (
              <option key={caseItem.case_id} value={caseItem.case_id}>
                {caseItem.case_number} - {caseItem.title}
              </option>
            ))}
          </select>
          <button onClick={loadCases} className="fcc-refresh-btn">
            ⟳ Refresh Cases
          </button>
        </div>
      </div>

      {/* Step 2: Select Evidence (only if case selected) */}
      {selectedCaseId && (
        <div className="fcc-card">
          <div className="fcc-card-header">
            <div className="fcc-card-icon">📦</div>
            <div>
              <h3>Step 2: Select Evidence</h3>
              <p>Choose evidence to view chain of custody</p>
            </div>
          </div>
          <div className="fcc-select-section">
            <select
              value={selectedEvidenceId}
              onChange={(e) => setSelectedEvidenceId(e.target.value)}
              className="fcc-select-custom"
              disabled={loadingEvidence}
            >
              <option value="">-- Select Evidence --</option>
              {loadingEvidence ? (
                <option disabled>Loading evidence...</option>
              ) : caseEvidence.length === 0 ? (
                <option disabled>No evidence found for this case</option>
              ) : (
                caseEvidence.map((ev) => (
                  <option key={ev.evidence_id} value={ev.evidence_id}>
                    {ev.title} - Status: {ev.analysis_status || ev.status || "PENDING"}
                  </option>
                ))
              )}
            </select>
            {selectedCaseId && caseEvidence.length === 0 && !loadingEvidence && (
              <p className="fcc-hint-warning">⚠️ No evidence found for this case</p>
            )}
          </div>
        </div>
      )}

      {loadingHistory && (
        <div className="fcc-loading-state">
          <div className="fcc-spinner-small"></div>
          <p>Loading evidence history...</p>
        </div>
      )}

      {evidenceHistory && !loadingHistory && (
        <>
          {/* Evidence Summary Card */}
          <div className="fcc-card fcc-summary-card">
            <div className="fcc-summary-header">
              <h3>📋 {evidenceHistory.evidence_title}</h3>
              <div className="fcc-summary-badges">
                <span
                  className={`fcc-status-badge ${evidenceHistory.current_analysis_status?.toLowerCase()}`}
                >
                  {evidenceHistory.current_analysis_status || "PENDING"}
                </span>
                <span className="fcc-custodian-badge">
                  Custodian: {evidenceHistory.current_custodian_name || "Not assigned"}
                </span>
              </div>
            </div>
            <p className="fcc-summary-desc">{evidenceHistory.evidence_description}</p>

            <div className="fcc-stats-row">
              <div className="fcc-stat">
                <span className="fcc-stat-value">{evidenceHistory.verification_count}</span>
                <span className="fcc-stat-label">Verifications</span>
              </div>
              <div className="fcc-stat">
                <span className="fcc-stat-value">{evidenceHistory.view_count}</span>
                <span className="fcc-stat-label">Views</span>
              </div>
              <div className="fcc-stat">
                <span className="fcc-stat-value">{evidenceHistory.transfer_count}</span>
                <span className="fcc-stat-label">Transfers</span>
              </div>
              <div className="fcc-stat">
                <span className="fcc-stat-value">{evidenceHistory.history.length}</span>
                <span className="fcc-stat-label">Total Events</span>
              </div>
            </div>

            <div className="fcc-summary-meta">
              <div>
                <strong>Created:</strong> {formatDate(evidenceHistory.created_at)} by{" "}
                {evidenceHistory.created_by_name || evidenceHistory.created_by}
              </div>
              {evidenceHistory.last_verified_at && (
                <div>
                  <strong>Last Verified:</strong> {formatDate(evidenceHistory.last_verified_at)}
                </div>
              )}
            </div>
          </div>

          {/* Complete Timeline */}
          <div className="fcc-card">
            <div className="fcc-card-header">
              <div className="fcc-card-icon">📅</div>
              <div>
                <h3>Complete Evidence Timeline</h3>
                <p>All actions from creation to current state ({evidenceHistory.history.length} events)</p>
              </div>
            </div>

            {evidenceHistory.history.length === 0 ? (
              <div className="fcc-empty">
                <div className="fcc-empty-icon">📭</div>
                <h4>No History Found</h4>
                <p>No actions have been recorded for this evidence yet</p>
              </div>
            ) : (
              <div className="fcc-timeline-complete">
                {evidenceHistory.history.map((item, idx) => (
                  <div key={idx} className="fcc-timeline-item-complete">
                    <div
                      className="fcc-timeline-marker"
                      style={{ background: getTypeColor(item.type) }}
                    >
                      <span className="fcc-timeline-icon">{getTypeIcon(item.type)}</span>
                    </div>
                    <div className="fcc-timeline-content-complete">
                      <div className="fcc-timeline-header-complete">
                        <strong>{item.action}</strong>
                        <span className="fcc-timeline-type">{item.type.replace(/_/g, " ")}</span>
                        <span className="fcc-timeline-date">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="fcc-timeline-desc">{item.description}</p>
                      <div className="fcc-timeline-by">
                        By: <strong>{item.by_name || item.by || "System"}</strong>
                      </div>

                      {item.type === "TRANSFER" && (
                        <div className="fcc-transfer-details">
                          <span className="fcc-transfer-from">From: {item.from_name}</span>
                          <span className="fcc-transfer-arrow">→</span>
                          <span className="fcc-transfer-to">To: {item.to_name}</span>
                          {item.reason && <div className="fcc-transfer-reason">Reason: {item.reason}</div>}
                        </div>
                      )}

                      {item.type === "VERIFICATION" && (
                        <div className={`fcc-verification-result ${item.result ? "success" : "failed"}`}>
                          {item.result ? "✅ Verification Passed" : "❌ Verification Failed"}
                        </div>
                      )}

                      {item.type === "ANALYSIS_COMPLETE" && item.details && (
                        <details className="fcc-report-details">
                          <summary>View Forensic Report</summary>
                          <div className="fcc-report-preview">
                            <p><strong>Report Number:</strong> {item.details.report_number}</p>
                            <p><strong>Findings:</strong> {item.details.findings?.substring(0, 200)}...</p>
                            <p><strong>Conclusion:</strong> {item.details.conclusion?.substring(0, 200)}...</p>
                          </div>
                        </details>
                      )}

                      {item.details && Object.keys(item.details).length > 0 && item.type !== "ANALYSIS_COMPLETE" && (
                        <button className="fcc-expand-btn" onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}>
                          {expandedItem === idx ? "▼ Hide Details" : "▶ View Details"}
                        </button>
                      )}

                      {expandedItem === idx && item.details && (
                        <div className="fcc-details-preview">
                          <pre>{JSON.stringify(item.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedEvidenceId && !evidenceHistory && !loadingHistory && (
        <div className="fcc-card">
          <div className="fcc-empty">
            <div className="fcc-empty-icon">🔍</div>
            <h4>No Data Found</h4>
            <p>No history records found for this evidence</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`fcc-toast ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style>{`
        .fcc-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .fcc-header {
          margin-bottom: 24px;
        }
        
        .fcc-header h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 8px 0;
        }
        
        .fcc-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }
        
        .fcc-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .fcc-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99,102,241,0.1);
        }
        
        .fcc-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }
        
        .fcc-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0;
        }
        
        .fcc-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 4px 0 0 0;
        }
        
        .fcc-select-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .fcc-select-custom {
          width: 100%;
          padding: 12px 16px;
          background: rgba(7, 9, 14, 0.8);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 12px;
          color: #e8ecf8;
          font-size: 0.85rem;
          cursor: pointer;
        }
        
        .fcc-select-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .fcc-refresh-btn {
          padding: 12px 24px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 12px;
          color: #818cf8;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        
        .fcc-refresh-btn:hover {
          background: rgba(99,102,241,0.25);
        }
        
        .fcc-hint-warning {
          font-size: 0.7rem;
          color: #f59e0b;
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(245,158,11,0.08);
          border-radius: 8px;
        }
        
        /* Loading Spinner */
        .fcc-loading {
          text-align: center;
          padding: 60px 20px;
        }
        
        .fcc-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }
        
        .fcc-spinner-small {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Summary Card */
        .fcc-summary-card {
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04));
          border-left: 3px solid #6366f1;
        }
        
        .fcc-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        
        .fcc-summary-header h3 {
          font-size: 1.2rem;
          color: #e8ecf8;
        }
        
        .fcc-summary-badges {
          display: flex;
          gap: 8px;
        }
        
        .fcc-status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        
        .fcc-status-badge.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .fcc-status-badge.accepted { background: rgba(16,185,129,0.15); color: #10b981; }
        .fcc-status-badge.completed { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .fcc-status-badge.rejected { background: rgba(239,68,68,0.15); color: #ef4444; }
        
        .fcc-custodian-badge {
          padding: 4px 12px;
          background: rgba(99,102,241,0.15);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #818cf8;
        }
        
        .fcc-summary-desc {
          color: #7a849c;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }
        
        .fcc-stats-row {
          display: flex;
          gap: 24px;
          padding: 16px 0;
          border-top: 1px solid rgba(99,102,241,0.1);
          border-bottom: 1px solid rgba(99,102,241,0.1);
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        
        .fcc-stat {
          text-align: center;
          min-width: 70px;
        }
        
        .fcc-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8ecf8;
        }
        
        .fcc-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
        }
        
        .fcc-summary-meta {
          display: flex;
          gap: 24px;
          font-size: 0.75rem;
          color: #7a849c;
          flex-wrap: wrap;
        }
        
        .fcc-summary-meta strong {
          color: #e8ecf8;
        }
        
        /* Timeline */
        .fcc-timeline-complete {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        
        .fcc-timeline-item-complete {
          display: flex;
          gap: 20px;
          padding: 20px 0;
          position: relative;
        }
        
        .fcc-timeline-item-complete:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 22px;
          top: 60px;
          width: 2px;
          height: calc(100% - 40px);
          background: rgba(99,102,241,0.15);
        }
        
        .fcc-timeline-marker {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .fcc-timeline-icon {
          font-size: 1.2rem;
        }
        
        .fcc-timeline-content-complete {
          flex: 1;
          background: rgba(7, 9, 14, 0.5);
          padding: 16px;
          border-radius: 12px;
        }
        
        .fcc-timeline-header-complete {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        
        .fcc-timeline-header-complete strong {
          font-size: 0.9rem;
          color: #e8ecf8;
        }
        
        .fcc-timeline-type {
          font-size: 0.65rem;
          padding: 2px 8px;
          background: rgba(99,102,241,0.15);
          border-radius: 20px;
          color: #818cf8;
        }
        
        .fcc-timeline-date {
          font-size: 0.7rem;
          color: #3d4459;
          margin-left: auto;
        }
        
        .fcc-timeline-desc {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 8px 0;
        }
        
        .fcc-timeline-by {
          font-size: 0.7rem;
          color: #3d4459;
        }
        
        .fcc-transfer-details {
          margin-top: 12px;
          padding: 10px;
          background: rgba(245,158,11,0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.75rem;
        }
        
        .fcc-transfer-from { color: #f59e0b; }
        .fcc-transfer-arrow { color: #818cf8; }
        .fcc-transfer-to { color: #10b981; }
        .fcc-transfer-reason { width: 100%; color: #7a849c; margin-top: 4px; }
        
        .fcc-verification-result {
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
        }
        
        .fcc-verification-result.success {
          background: rgba(16,185,129,0.1);
          color: #10b981;
        }
        
        .fcc-verification-result.failed {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }
        
        .fcc-expand-btn {
          margin-top: 12px;
          background: transparent;
          border: none;
          color: #818cf8;
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        .fcc-details-preview {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .fcc-details-preview pre {
          font-size: 0.65rem;
          color: #7a849c;
          margin: 0;
          white-space: pre-wrap;
        }
        
        .fcc-report-details {
          margin-top: 12px;
        }
        
        .fcc-report-details summary {
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .fcc-report-preview {
          margin-top: 8px;
          padding: 12px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          font-size: 0.75rem;
        }
        
        .fcc-empty {
          text-align: center;
          padding: 60px 20px;
        }
        
        .fcc-empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }
        
        .fcc-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }
        
        .fcc-empty p {
          color: #7a849c;
        }
        
        .fcc-loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
        }
        
        .fcc-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.85rem;
          z-index: 1100;
          animation: slideIn 0.3s ease;
        }
        
        .fcc-toast.success { background: #10b981; color: white; }
        .fcc-toast.error { background: #ef4444; color: white; }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @media (max-width: 768px) {
          .fcc-container { padding: 16px; }
          .fcc-stats-row { gap: 12px; }
          .fcc-summary-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .fcc-timeline-item-complete { flex-direction: column; gap: 12px; }
          .fcc-timeline-item-complete:not(:last-child)::before { display: none; }
        }
      `}</style>
    </div>
  );
}