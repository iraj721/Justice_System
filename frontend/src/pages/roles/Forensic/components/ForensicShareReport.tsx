import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

export function ForensicShareReport({ token }: { token: string }) {
  const [myReports, setMyReports] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [caseReports, setCaseReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [investigatorInfo, setInvestigatorInfo] = useState<any>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reports, casesData] = await Promise.all([
        apiRequest<any[]>("/forensic/reports", { token }),
        apiRequest<any[]>("/forensic/cases-list", { token }),
      ]);
      setMyReports(reports || []);
      setCases(casesData || []);
      console.log("Cases loaded:", casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCaseReports(caseId: string) {
    if (!caseId) {
      setCaseReports([]);
      setSelectedReport(null);
      setInvestigatorInfo(null);
      return;
    }

    const reportsForCase = myReports.filter((r) => r.case_id === caseId);
    setCaseReports(reportsForCase);
    setSelectedReport(null);

    // Get investigator who submitted the evidence
    try {
      const investigator = await apiRequest<any>(
        `/forensic/case-investigator/${caseId}`,
        { token },
      );

      if (investigator && investigator.email) {
        setInvestigatorInfo({
          name: investigator.name || "Investigator",
          email: investigator.email,
        });
        console.log("Investigator found:", investigator);
      } else {
        console.log("No investigator found for this case");
        setInvestigatorInfo(null);
      }
    } catch (err) {
      console.error("Error fetching investigator:", err);
      setInvestigatorInfo(null);
    }
  }

  async function handleShare() {
    const shareEmail = useManual ? manualEmail : investigatorInfo?.email;

    if (!selectedReport || !selectedCase) {
      setMessage("❌ Please select case and report");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (!shareEmail) {
      setMessage(
        "❌ Please enter investigator email or wait for auto-detection",
      );
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSharing(true);
    try {
      await apiRequest("/forensic/report/share", {
        method: "POST",
        token,
        body: {
          report_id: selectedReport.report_id,
          share_with_email: shareEmail,
          share_with_role: "INVESTIGATOR",
        },
      });
      setMessage(`✅ Report shared with ${shareEmail}`);
      setSelectedReport(null);
      setSelectedCase("");
      setCaseReports([]);
      setManualEmail("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Share error:", err);
      setMessage("❌ Failed to share report");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
    );
  }

  return (
    <div className="fsr-container">
      <div className="fsr-header">
        <h3>📤 Share Forensic Report</h3>
        <p>Share reports with the investigator who submitted the case</p>
      </div>

      <div className="fsr-card">
        {/* Step 1: Select Case */}
        <div className="fsr-form-group">
          <label>📁 Step 1: Select Case</label>
          <select
            value={selectedCase}
            onChange={(e) => {
              setSelectedCase(e.target.value);
              loadCaseReports(e.target.value);
            }}
            className="fsr-select"
          >
            <option value="">-- Select Case --</option>
            {cases.map((caseItem) => (
              <option key={caseItem.case_id} value={caseItem.case_id}>
                {caseItem.case_number} - {caseItem.title}
                {caseItem.has_forensic_submission && " 🔬"}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Report */}
        {selectedCase && (
          <div className="fsr-form-group">
            <label>📄 Step 2: Select Report</label>
            <select
              value={selectedReport?.report_id || ""}
              onChange={(e) => {
                const report = caseReports.find(
                  (r) => r.report_id === e.target.value,
                );
                setSelectedReport(report);
              }}
              className="fsr-select"
              disabled={caseReports.length === 0}
            >
              <option value="">-- Select Report --</option>
              {caseReports.length === 0 ? (
                <option disabled>No reports found for this case</option>
              ) : (
                caseReports.map((report) => (
                  <option key={report.report_id} value={report.report_id}>
                    {report.report_number} - {report.analysis_type}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Toggle between auto and manual */}
        {selectedCase && (
          <div className="fsr-form-group">
            <label>👮 Share With</label>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setUseManual(false)}
                className={`fsr-toggle ${!useManual ? "active" : ""}`}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: !useManual ? "#6366f1" : "rgba(99,102,241,0.1)",
                  color: !useManual ? "white" : "#818cf8",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                👮 Auto (Case Investigator)
              </button>
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className={`fsr-toggle ${useManual ? "active" : ""}`}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: useManual ? "#6366f1" : "rgba(99,102,241,0.1)",
                  color: useManual ? "white" : "#818cf8",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ✍️ Manual Entry
              </button>
            </div>
          </div>
        )}

        {/* Auto Investigator Info */}
        {selectedCase && !useManual && investigatorInfo && (
          <div className="fsr-investigator-info">
            <div className="fsr-info-icon">👮</div>
            <div>
              <strong>Sharing with:</strong>
              <br />
              {investigatorInfo.name} ({investigatorInfo.email})
              <br />
              <small style={{ fontSize: "0.7rem", color: "#10b981" }}>
                ✅ Investigator who submitted this case to forensic
              </small>
            </div>
          </div>
        )}

        {/* Auto mode but no investigator found */}
        {selectedCase && !useManual && !investigatorInfo && (
          <div
            className="fsr-investigator-info"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <div className="fsr-info-icon">⚠️</div>
            <div>
              <strong>No investigator found</strong>
              <br />
              Please use manual entry mode
            </div>
          </div>
        )}

        {/* Manual Email Input */}
        {selectedCase && useManual && (
          <div className="fsr-form-group">
            <label>✍️ Enter Investigator Email</label>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="investigator@example.com"
              className="fsr-input"
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(7,9,14,0.8)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "10px",
                color: "#e8ecf8",
              }}
            />
          </div>
        )}

        {/* Share Button */}
        <button
          className="fsr-btn-share"
          onClick={handleShare}
          disabled={
            !selectedReport ||
            !selectedCase ||
            sharing ||
            (!useManual && !investigatorInfo) ||
            (useManual && !manualEmail)
          }
        >
          {sharing ? "⏳ Sharing..." : "📤 Share with Investigator"}
        </button>
      </div>

      {message && (
        <div
          className={`fsr-toast ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <style>{`
        .fsr-container { padding: 24px; max-width: 600px; margin: 0 auto; }
        .fsr-header { margin-bottom: 24px; }
        .fsr-header h3 { font-size: 1.3rem; color: #e8ecf8; margin-bottom: 8px; }
        .fsr-header p { color: #7a849c; }
        .fsr-card { background: rgba(12,15,26,0.8); border-radius: 16px; padding: 24px; }
        .fsr-form-group { margin-bottom: 20px; }
        .fsr-form-group label { display: block; margin-bottom: 8px; color: #818cf8; font-size: 0.85rem; }
        .fsr-select { width: 100%; padding: 12px; background: rgba(7,9,14,0.8); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; color: #e8ecf8; }
        .fsr-select:disabled { opacity: 0.5; cursor: not-allowed; }
        .fsr-input { width: 100%; padding: 12px; background: rgba(7,9,14,0.8); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; color: #e8ecf8; }
        .fsr-investigator-info { display: flex; gap: 12px; padding: 12px; background: rgba(99,102,241,0.1); border-radius: 10px; margin-bottom: 20px; }
        .fsr-info-icon { font-size: 1.5rem; }
        .fsr-btn-share { width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 10px; color: white; font-weight: 600; cursor: pointer; }
        .fsr-btn-share:disabled { opacity: 0.6; cursor: not-allowed; }
        .fsr-toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; z-index: 1100; }
        .fsr-toast.success { background: #10b981; color: white; }
        .fsr-toast.error { background: #ef4444; color: white; }
        .fsr-toggle.active { background: #6366f1 !important; color: white !important; }
      `}</style>
    </div>
  );
}
