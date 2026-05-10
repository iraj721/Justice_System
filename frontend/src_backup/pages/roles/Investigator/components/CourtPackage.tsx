// frontend/src/pages/roles/Investigator/components/CourtPackage.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type CourtPackage = {
  package_id: string;
  case_id: string;
  case_number: string;
  prepared_by: string;
  prepared_by_name: string;
  prepared_at: string;
  submitted_to_court: string;
  submission_notes: string;
  contents: any;
  summary: {
    total_evidence: number;
    verified_evidence: number;
    total_suspects: number;
    total_witnesses: number;
    case_duration_days: number;
  };
  ipfs_cid?: string;
  status?: string;
};

export function CourtPackage({ token, cases, caseId }: { token: string; cases: any[]; caseId?: string }) {
  const [selectedCase, setSelectedCase] = useState(caseId || "");
  const [packages, setPackages] = useState<CourtPackage[]>([]);
  const [courtEmail, setCourtEmail] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [courtUsers, setCourtUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    if (selectedCase) {
      loadPackages();
    }
    loadCourtUsers();
  }, [selectedCase]);

  async function loadCourtUsers() {
    try {
      const users = await apiRequest<any[]>("/admin/users/by-role/COURT", { token });
      setCourtUsers(users);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPackages() {
    try {
      const data = await apiRequest<CourtPackage[]>(`/investigator/court/packages/${selectedCase}`, { token });
      setPackages(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function preparePackage() {
    if (!selectedCase || !courtEmail) {
      setMessage("❌ Please select case and court officer");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<CourtPackage>("/investigator/court/prepare-package", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          court_email: courtEmail,
          submission_notes: submissionNotes
        }
      });
      setMessage(`✅ Package prepared! Package ID: ${result.package_id}`);
      loadPackages();
      setActiveTab("packages");
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to prepare package");
    } finally {
      setLoading(false);
    }
  }

  async function submitPackage(packageId: string) {
    setLoading(true);
    try {
      await apiRequest(`/investigator/court/submit/${packageId}`, { method: "POST", token });
      setMessage("✅ Package submitted to court!");
      loadPackages();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Submission failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadPackage(pkg: CourtPackage) {
    const dataStr = JSON.stringify(pkg, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `court_package_${pkg.package_id}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  return (
    <div>
      {/* Case Selector */}
      <div className="card">
        <label>Select Case</label>
        <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "8px" }}>
          <option value="">-- Select a Case --</option>
          {cases.map((c: any) => (
            <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
          ))}
        </select>
      </div>

      {selectedCase && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
            <button onClick={() => setActiveTab("create")} style={{ background: activeTab === "create" ? "#3b82f6" : "transparent", color: activeTab === "create" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              📦 Create Package
            </button>
            <button onClick={() => setActiveTab("packages")} style={{ background: activeTab === "packages" ? "#3b82f6" : "transparent", color: activeTab === "packages" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              📋 Existing Packages ({packages.length})
            </button>
          </div>

          {/* Create Package Form */}
          {activeTab === "create" && (
            <div className="card">
              <h3>📦 Prepare Court Submission Package</h3>
              {message && <p style={{ color: message.includes("✅") ? "#10b981" : "#ef4444" }}>{message}</p>}
              <div className="form-grid">
                <label>Select Court Officer *</label>
                <select value={courtEmail} onChange={(e) => setCourtEmail(e.target.value)}>
                  <option value="">-- Select Court Officer --</option>
                  {courtUsers.map((user) => (
                    <option key={user.email} value={user.email}>{user.full_name} ({user.email})</option>
                  ))}
                </select>

                <label>Submission Notes</label>
                <textarea value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)} rows={3} placeholder="Any additional information for the court..." />

                <button onClick={preparePackage} disabled={loading} style={{ background: "#8b5cf6", cursor: "pointer" }}>
                  {loading ? "Preparing..." : "📦 Prepare & Submit Package"}
                </button>
              </div>

              <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                <h4>📋 What's included in the package?</h4>
                <ul style={{ fontSize: "13px", margin: 0 }}>
                  <li>✓ Complete FIR details</li>
                  <li>✓ Case investigation summary</li>
                  <li>✓ All evidence with IPFS CIDs and hashes</li>
                  <li>✓ Evidence verification status</li>
                  <li>✓ Suspect and witness information</li>
                  <li>✓ Investigation timeline</li>
                  <li>✓ Investigator notes</li>
                </ul>
              </div>
            </div>
          )}

          {/* Existing Packages */}
          {activeTab === "packages" && (
            <div className="card">
              <h3>📋 Court Packages</h3>
              {packages.length === 0 ? (
                <p>No packages prepared yet for this case.</p>
              ) : (
                packages.map((pkg) => (
                  <div key={pkg.package_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{pkg.package_id}</strong>
                      <span style={{ background: pkg.status === "SUBMITTED" ? "#10b981" : "#f59e0b", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
                        {pkg.status || "PREPARED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
                      <div>Prepared: {new Date(pkg.prepared_at).toLocaleString()} by {pkg.prepared_by_name}</div>
                      <div>Court Officer: {pkg.submitted_to_court}</div>
                      {pkg.submission_notes && <div>Notes: {pkg.submission_notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                      <button onClick={() => downloadPackage(pkg)} style={{ background: "#3b82f6", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>📥 Download Package</button>
                      {pkg.status !== "SUBMITTED" && (
                        <button onClick={() => submitPackage(pkg.package_id)} style={{ background: "#10b981", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>📤 Submit to Court</button>
                      )}
                    </div>
                    <details style={{ marginTop: "12px" }}>
                      <summary style={{ cursor: "pointer", fontSize: "12px", color: "#3b82f6" }}>Package Summary</summary>
                      <div style={{ marginTop: "8px", fontSize: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                        <div>📦 Evidence: {pkg.summary.total_evidence}</div>
                        <div>✅ Verified: {pkg.summary.verified_evidence}</div>
                        <div>👤 Suspects: {pkg.summary.total_suspects}</div>
                        <div>👥 Witnesses: {pkg.summary.total_witnesses}</div>
                        <div>⏱️ Duration: {pkg.summary.case_duration_days} days</div>
                      </div>
                    </details>
                    {pkg.ipfs_cid && (
                      <div style={{ fontSize: "10px", color: "#999", marginTop: "8px", wordBreak: "break-all" }}>
                        IPFS CID: {pkg.ipfs_cid}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}