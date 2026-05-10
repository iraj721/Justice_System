// frontend/src/pages/roles/PublicAuditor/PublicAuditorView.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/services/apiClient";

type SystemStats = {
  total_users: number;
  total_firs: number;
  total_cases: number;
  total_evidence: number;
  total_forensic_reports: number;
  total_judgments: number;
  system_status: string;
  blockchain_ready: boolean;
};

type AuditTrail = {
  firs: any[];
  cases: any[];
  forensic_reports: any[];
  judgments: any[];
};

export function PublicAuditorView({ token }: { token: string }) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrail | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyEvidenceId, setVerifyEvidenceId] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState("");
  const [activeTab, setActiveTab] = useState("stats");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, auditData] = await Promise.all([
        apiRequest<SystemStats>("/admin/stats", { token }),
        apiRequest<AuditTrail>("/admin/audit-trail", { token })
      ]);
      setStats(statsData);
      setAuditTrail(auditData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEvidence() {
    if (!verifyEvidenceId || !verifyHash) {
      setVerifyResult("❌ Please enter both Evidence ID and Hash");
      return;
    }
    
    try {
      const result = await apiRequest<{ verified: boolean }>("/cases/evidence/verify", {
        method: "POST",
        token,
        body: { evidence_id: verifyEvidenceId, provided_hash: verifyHash }
      });
      setVerifyResult(result.verified ? "✅ Hash verification passed! Evidence is authentic and untampered." : "❌ Hash verification failed! Evidence may have been tampered with.");
    } catch (err) {
      setVerifyResult("❌ Error verifying evidence");
    }
  }

  if (loading) {
    return <div className="card"><p>Loading public audit data...</p></div>;
  }

  return (
    <div>
      {/* System Stats Dashboard */}
      <div className="card">
        <h2>📊 System Transparency Dashboard</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats?.total_users || 0}</div>
            <div style={{ fontSize: "14px", color: "#666" }}>Total Users</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{stats?.total_firs || 0}</div>
            <div style={{ fontSize: "14px", color: "#666" }}>FIRs Filed</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>{stats?.total_cases || 0}</div>
            <div style={{ fontSize: "14px", color: "#666" }}>Active Cases</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{stats?.total_judgments || 0}</div>
            <div style={{ fontSize: "14px", color: "#666" }}>Judgments</div>
          </div>
        </div>
        <div style={{ marginTop: "16px", padding: "12px", background: stats?.system_status === "operational" ? "#d1fae5" : "#fee2e2", borderRadius: "8px" }}>
          <p><strong>System Status:</strong> {stats?.system_status === "operational" ? "🟢 Operational" : "🔴 Degraded"}</p>
          <p><strong>Blockchain Ready:</strong> {stats?.blockchain_ready ? "✅ Yes (Smart Contract Integration Ready)" : "⏳ Pending"}</p>
        </div>
      </div>

      {/* Verification Tool */}
      <div className="card">
        <h2>🔐 Public Evidence Verification</h2>
        <p>Anyone can verify evidence authenticity using its hash.</p>
        <div className="form-grid">
          <label>Evidence ID</label>
          <input 
            value={verifyEvidenceId} 
            onChange={(e) => setVerifyEvidenceId(e.target.value)} 
            placeholder="E.g., EVD-XXXXX"
          />
          <label>Evidence Hash (SHA-256)</label>
          <input 
            value={verifyHash} 
            onChange={(e) => setVerifyHash(e.target.value)} 
            placeholder="64-character hex hash"
          />
          <button onClick={handleVerifyEvidence}>Verify Authenticity</button>
          {verifyResult && <p>{verifyResult}</p>}
        </div>
      </div>

      {/* Tabs for Audit Trail */}
      <div className="card">
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
          <button 
            onClick={() => setActiveTab("stats")} 
            style={{ background: activeTab === "stats" ? "#3b82f6" : "transparent", color: activeTab === "stats" ? "white" : "#3b82f6" }}
          >
            📈 Statistics
          </button>
          <button 
            onClick={() => setActiveTab("firs")} 
            style={{ background: activeTab === "firs" ? "#3b82f6" : "transparent", color: activeTab === "firs" ? "white" : "#3b82f6" }}
          >
            📋 FIRs
          </button>
          <button 
            onClick={() => setActiveTab("cases")} 
            style={{ background: activeTab === "cases" ? "#3b82f6" : "transparent", color: activeTab === "cases" ? "white" : "#3b82f6" }}
          >
            ⚖️ Cases
          </button>
          <button 
            onClick={() => setActiveTab("reports")} 
            style={{ background: activeTab === "reports" ? "#3b82f6" : "transparent", color: activeTab === "reports" ? "white" : "#3b82f6" }}
          >
            🔬 Reports
          </button>
          <button 
            onClick={() => setActiveTab("judgments")} 
            style={{ background: activeTab === "judgments" ? "#3b82f6" : "transparent", color: activeTab === "judgments" ? "white" : "#3b82f6" }}
          >
            📜 Judgments
          </button>
        </div>

        {activeTab === "stats" && stats && (
          <div>
            <h3>System Health</h3>
            <ul>
              <li>Total Registered Users: {stats.total_users}</li>
              <li>Total FIRs Filed: {stats.total_firs}</li>
              <li>Total Cases Registered: {stats.total_cases}</li>
              <li>Total Evidence Items: {stats.total_evidence}</li>
              <li>Total Forensic Reports: {stats.total_forensic_reports}</li>
              <li>Total Judgments Delivered: {stats.total_judgments}</li>
            </ul>
          </div>
        )}

        {activeTab === "firs" && auditTrail && (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {auditTrail.firs.length === 0 ? (
              <p>No FIRs found.</p>
            ) : (
              auditTrail.firs.map((fir) => (
                <div key={fir.fir_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <strong>{fir.fir_number}</strong>
                  <p>{fir.incident_title}</p>
                  <p style={{ fontSize: "12px", color: "#666" }}>Status: {fir.status}</p>
                  <details>
                    <summary>View Details</summary>
                    <pre style={{ fontSize: "11px", overflow: "auto" }}>{JSON.stringify(fir, null, 2)}</pre>
                  </details>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "cases" && auditTrail && (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {auditTrail.cases.length === 0 ? (
              <p>No cases found.</p>
            ) : (
              auditTrail.cases.map((caseItem) => (
                <div key={caseItem.case_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <strong>{caseItem.case_number}</strong>
                  <p>{caseItem.title}</p>
                  <p style={{ fontSize: "12px", color: "#666" }}>Status: {caseItem.status}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "reports" && auditTrail && (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {auditTrail.forensic_reports.length === 0 ? (
              <p>No forensic reports found.</p>
            ) : (
              auditTrail.forensic_reports.map((report) => (
                <div key={report.report_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <strong>{report.report_number}</strong>
                  <p>Case: {report.case_id}</p>
                  <p style={{ fontSize: "12px", color: "#666" }}>Status: {report.status}</p>
                  <details>
                    <summary>View Hash</summary>
                    <code style={{ fontSize: "11px", wordBreak: "break-all" }}>{report.hash}</code>
                  </details>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "judgments" && auditTrail && (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {auditTrail.judgments.length === 0 ? (
              <p>No judgments found.</p>
            ) : (
              auditTrail.judgments.map((judgment) => (
                <div key={judgment.judgment_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
                  <strong>{judgment.judgment_number}</strong>
                  <p>Case: {judgment.case_id}</p>
                  <p>Verdict: <strong>{judgment.verdict}</strong></p>
                  <details>
                    <summary>View Hash</summary>
                    <code style={{ fontSize: "11px", wordBreak: "break-all" }}>{judgment.hash}</code>
                  </details>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Blockchain Info */}
      <div className="card">
        <h2>⛓️ Blockchain Integration Status</h2>
        <p>This system is ready for smart contract integration. All hashes can be anchored to blockchain for immutable proof.</p>
        <ul>
          <li>✓ Evidence hashes can be stored on-chain</li>
          <li>✓ Report hashes can be anchored to blockchain</li>
          <li>✓ Judgment hashes can be notarized on blockchain</li>
          <li>✓ Complete audit trail available</li>
        </ul>
        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px" }}>
          <p>Next Phase: Smart Contract Integration with Ganache</p>
          <p>Each evidence upload can trigger: <code>storeEvidenceHash(evidenceId, hash, timestamp)</code></p>
        </div>
      </div>
    </div>
  );
}
