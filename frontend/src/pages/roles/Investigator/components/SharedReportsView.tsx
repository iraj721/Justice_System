import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../../shared/env";

export function SharedReportsView({ token }: { token: string }) {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [sharedReports, setSharedReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCases();
  }, []);

  async function loadMyCases() {
    setLoading(true);
    setError(null);
    try {
      // Try /cases/my-cases endpoint
      let myCases = [];
      try {
        myCases = await apiRequest<any[]>("/cases/my-cases", { token });
        console.log("Cases from /cases/my-cases:", myCases);
      } catch (err) {
        console.log("/cases/my-cases failed, trying /cases/investigator...");
        try {
          myCases = await apiRequest<any[]>("/cases/investigator", { token });
          console.log("Cases from /cases/investigator:", myCases);
        } catch (err2) {
          console.log("/cases/investigator failed, trying fallback...");
        }
      }

      setCases(myCases || []);
      if (myCases.length === 0) {
        setError("No cases found assigned to you.");
      }
    } catch (err) {
      console.error("Error loading cases:", err);
      setError("Failed to load cases. Please refresh.");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSharedReports(caseId: string) {
    if (!caseId) {
      setSharedReports([]);
      return;
    }
    try {
      const reports = await apiRequest<any[]>(
        `/forensic/report/shared/${caseId}`,
        { token },
      );
      console.log(`Shared reports for case ${caseId}:`, reports);
      setSharedReports(reports || []);
      if (reports.length === 0) {
        setError("No shared reports found for this case.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error loading shared reports:", err);
      setSharedReports([]);
      setError("Failed to load shared reports.");
    }
  }

  // Load reports when case is selected
  useEffect(() => {
    if (selectedCase) {
      loadSharedReports(selectedCase);
    } else {
      setSharedReports([]);
    }
  }, [selectedCase]);

  if (loading) {
    return (
      <div className="sr-loading">
        <div className="sr-spinner"></div>
        <p>Loading your cases...</p>
      </div>
    );
  }

  return (
    <div className="sr-container">
      <div className="sr-header">
        <h3>📄 Shared Forensic Reports</h3>
        <p>Reports shared with you by forensic analysts</p>
      </div>

      <div className="sr-card">
        <div className="sr-form-group">
          <label>Select Case</label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="sr-select"
          >
            <option value="">-- Select Case --</option>
            {cases.length === 0 ? (
              <option disabled>No cases available</option>
            ) : (
              cases.map((caseItem) => (
                <option key={caseItem.case_id} value={caseItem.case_id}>
                  {caseItem.case_number} - {caseItem.title}
                </option>
              ))
            )}
          </select>
        </div>

        {error && (
          <div className="sr-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {selectedCase && sharedReports.length === 0 && !error && (
          <div className="sr-empty">
            <div className="sr-empty-icon">📭</div>
            <h4>No Shared Reports</h4>
            <p>
              No forensic reports have been shared with you for this case yet.
            </p>
            <p className="sr-hint">
              Forensic analysts can share reports with you from their dashboard.
            </p>
          </div>
        )}

        <div className="sr-reports-list">
          {sharedReports.map((report, idx) => (
            <div key={idx} className="sr-report-card">
              <div className="sr-report-header">
                <strong>{report.report_number}</strong>
                <span className="sr-badge">{report.analysis_type}</span>
              </div>
              <div className="sr-report-meta">
                <span>Shared by: {report.shared_by || "Forensic Analyst"}</span>
                <span>
                  Shared at:{" "}
                  {report.shared_at
                    ? new Date(report.shared_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="sr-report-actions">
                <button
                  className="sr-btn-view"
                  onClick={() => {
                    setSelectedReport(report);
                    setShowModal(true);
                  }}
                >
                  👁️ View Report
                </button>
                <button
                  className="sr-btn-download"
                  onClick={() =>
                    window.open(
                      `${API_BASE_URL}/forensic/report/download/${report.report_id}?format=pdf`,
                      "_blank",
                    )
                  }
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showModal && selectedReport && (
        <div className="sr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3>📄 Forensic Report: {selectedReport.report_number}</h3>
              <button
                className="sr-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="sr-modal-body">
              <div className="sr-modal-section">
                <strong>Analysis Type:</strong> {selectedReport.analysis_type}
              </div>
              <div className="sr-modal-section">
                <strong>Findings:</strong>
                <div className="sr-content">
                  {selectedReport.findings || "No findings available"}
                </div>
              </div>
              <div className="sr-modal-section">
                <strong>Conclusion:</strong>
                <div className="sr-content">
                  {selectedReport.conclusion || "No conclusion available"}
                </div>
              </div>
              <div className="sr-modal-section">
                <strong>Created:</strong>{" "}
                {selectedReport.created_at
                  ? new Date(selectedReport.created_at).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div className="sr-modal-footer">
              <button
                className="sr-btn-close"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sr-container { padding: 24px; max-width: 900px; margin: 0 auto; }
        .sr-loading { text-align: center; padding: 60px; }
        .sr-spinner { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sr-header { margin-bottom: 24px; }
        .sr-header h3 { font-size: 1.3rem; color: #e8ecf8; margin-bottom: 8px; }
        .sr-header p { color: #7a849c; }
        .sr-card { background: rgba(12,15,26,0.8); border-radius: 16px; padding: 24px; }
        .sr-form-group { margin-bottom: 20px; }
        .sr-form-group label { display: block; margin-bottom: 8px; color: #818cf8; }
        .sr-select { width: 100%; padding: 12px; background: rgba(7,9,14,0.8); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; color: #e8ecf8; }
        .sr-error { display: flex; gap: 12px; padding: 16px; background: rgba(239,68,68,0.1); border-radius: 12px; margin-bottom: 20px; color: #f87171; }
        .sr-report-card { background: rgba(7,9,14,0.5); border: 1px solid rgba(99,102,241,0.1); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .sr-report-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .sr-badge { background: rgba(99,102,241,0.15); color: #818cf8; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; }
        .sr-report-meta { display: flex; gap: 16px; font-size: 0.7rem; color: #7a849c; margin-bottom: 12px; }
        .sr-report-actions { display: flex; gap: 12px; }
        .sr-btn-view, .sr-btn-download { padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; border: none; }
        .sr-btn-view { background: rgba(99,102,241,0.15); color: #818cf8; }
        .sr-btn-download { background: rgba(16,185,129,0.15); color: #10b981; }
        .sr-empty { text-align: center; padding: 60px 20px; }
        .sr-empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
        .sr-empty h4 { font-size: 1rem; margin-bottom: 8px; color: #e8ecf8; }
        .sr-hint { font-size: 0.7rem; color: #7a849c; margin-top: 8px; }
        .sr-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .sr-modal { background: #0f172a; border-radius: 16px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
        .sr-modal-header { display: flex; justify-content: space-between; padding: 20px; border-bottom: 1px solid #1e293b; }
        .sr-modal-close { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
        .sr-modal-body { padding: 20px; }
        .sr-modal-section { margin-bottom: 20px; }
        .sr-modal-section strong { display: block; margin-bottom: 8px; color: #818cf8; }
        .sr-content { background: #1e293b; padding: 12px; border-radius: 8px; color: #94a3b8; line-height: 1.5; white-space: pre-wrap; }
        .sr-modal-footer { padding: 16px 20px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; }
        .sr-btn-close { padding: 8px 20px; background: #334155; border: none; border-radius: 8px; color: #94a3b8; cursor: pointer; }
      `}</style>
    </div>
  );
}
