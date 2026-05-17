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
  storage_cid?: string;  // Changed from ipfs_cid to storage_cid (MongoDB reference)
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
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);

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
      setTimeout(() => setMessage(""), 3000);
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
      setTimeout(() => setMessage(""), 3000);
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
      setTimeout(() => setMessage(""), 3000);
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
    setMessage("✅ Package downloaded!");
    setTimeout(() => setMessage(""), 2000);
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string; icon: string }> = {
      PREPARED: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", icon: "📦" },
      SUBMITTED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", icon: "✅" },
      RECEIVED: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", icon: "📥" },
      PROCESSING: { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", icon: "🔄" },
      COMPLETED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", icon: "🎉" }
    };
    const style = colors[status] || { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", icon: "📋" };
    return (
      <span className="cp-status-badge" style={{ background: style.bg, color: style.color }}>
        <span className="cp-status-icon">{style.icon}</span>
        {status}
      </span>
    );
  }

  return (
    <div className="cpkg-dashboard">
      {/* Case Selector Card */}
      <div className="cpkg-card cpkg-fade-up">
        <div className="cpkg-card-header">
          <div className="cpkg-card-icon">📋</div>
          <div>
            <h3>Select Case</h3>
            <p>Choose a case to prepare court submission package</p>
          </div>
        </div>
        <div className="cpkg-select-wrapper">
          <select 
            value={selectedCase} 
            onChange={(e) => setSelectedCase(e.target.value)}
            className="cpkg-case-select"
          >
            <option value="">-- Select a Case --</option>
            {cases.map((c: any) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
          <span className="cpkg-select-icon">⚖️</span>
        </div>
      </div>

      {selectedCase && (
        <>
          {/* Tabs */}
          <div className="cpkg-tabs-container">
            <div className="cpkg-tabs">
              <button
                className={`cpkg-tab ${activeTab === "create" ? "active" : ""}`}
                onClick={() => setActiveTab("create")}
              >
                <span className="cpkg-tab-icon">📦</span>
                <span>Create Package</span>
              </button>
              <button
                className={`cpkg-tab ${activeTab === "packages" ? "active" : ""}`}
                onClick={() => setActiveTab("packages")}
              >
                <span className="cpkg-tab-icon">📋</span>
                <span>Existing Packages</span>
                {packages.length > 0 && <span className="cpkg-tab-badge">{packages.length}</span>}
              </button>
            </div>
          </div>

          {/* Message Toast */}
          {message && (
            <div className={`cpkg-toast ${message.includes("✅") ? "cpkg-toast-success" : "cpkg-toast-error"}`}>
              <span>{message}</span>
            </div>
          )}

          {/* Create Package Tab */}
          {activeTab === "create" && (
            <div className="cpkg-card cpkg-fade-up">
              <div className="cpkg-card-header">
                <div className="cpkg-card-icon">📦</div>
                <div>
                  <h3>Prepare Court Submission Package</h3>
                  <p>Compile all case details into a comprehensive court package</p>
                </div>
              </div>

              <div className="cpkg-form">
                <div className="cpkg-form-group">
                  <label>⚖️ Select Court Officer <span className="cpkg-required">*</span></label>
                  <div className="cpkg-select-wrapper">
                    <select 
                      value={courtEmail} 
                      onChange={(e) => setCourtEmail(e.target.value)}
                      className="cpkg-court-select"
                    >
                      <option value="">-- Select Court Officer --</option>
                      {courtUsers.map((user) => (
                        <option key={user.email} value={user.email}>
                          {user.full_name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <span className="cpkg-select-icon">👨‍⚖️</span>
                  </div>
                </div>

                <div className="cpkg-form-group">
                  <label>📝 Submission Notes</label>
                  <div className="cpkg-textarea-wrapper">
                    <span className="cpkg-textarea-icon">📄</span>
                    <textarea 
                      value={submissionNotes} 
                      onChange={(e) => setSubmissionNotes(e.target.value)} 
                      rows={4} 
                      placeholder="Any additional information for the court..."
                    />
                  </div>
                </div>

                <div className="cpkg-form-actions">
                  <button className="cpkg-btn cpkg-btn-primary" onClick={preparePackage} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="cpkg-spinner-small"></span>
                        Preparing...
                      </>
                    ) : (
                      "📦 Prepare Package"
                    )}
                  </button>
                </div>
              </div>

              {/* Package Contents Info - Updated */}
              <div className="cpkg-info-box">
                <div className="cpkg-info-header">
                  <span className="cpkg-info-icon">📋</span>
                  <strong>What's included in the package?</strong>
                </div>
                <div className="cpkg-info-grid">
                  <div className="cpkg-info-item">✓ Complete FIR details</div>
                  <div className="cpkg-info-item">✓ Case investigation summary</div>
                  <div className="cpkg-info-item">✓ All evidence with Cloudinary URLs and verification hashes</div>
                  <div className="cpkg-info-item">✓ Evidence verification status</div>
                  <div className="cpkg-info-item">✓ Suspect and witness information</div>
                  <div className="cpkg-info-item">✓ Investigation timeline</div>
                  <div className="cpkg-info-item">✓ Investigator notes</div>
                  <div className="cpkg-info-item">✓ Document verification proofs</div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Packages Tab */}
          {activeTab === "packages" && (
            <div className="cpkg-card cpkg-fade-up">
              <div className="cpkg-card-header">
                <div className="cpkg-card-icon">📋</div>
                <div>
                  <h3>Court Packages</h3>
                  <p>{packages.length} package{packages.length !== 1 ? 's' : ''} prepared for this case</p>
                </div>
              </div>

              {packages.length === 0 ? (
                <div className="cpkg-empty">
                  <div className="cpkg-empty-icon">📭</div>
                  <h4>No Packages Created</h4>
                  <p>Prepare your first court submission package</p>
                  <button className="cpkg-link-btn" onClick={() => setActiveTab("create")}>
                    Create Package →
                  </button>
                </div>
              ) : (
                <div className="cpkg-packages-list">
                  {packages.map((pkg, idx) => (
                    <div 
                      key={pkg.package_id} 
                      className={`cpkg-package-card ${hoveredPackage === pkg.package_id ? "hovered" : ""} ${expandedPackage === pkg.package_id ? "expanded" : ""}`}
                      onMouseEnter={() => setHoveredPackage(pkg.package_id)}
                      onMouseLeave={() => setHoveredPackage(null)}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="cpkg-package-header">
                        <div className="cpkg-package-info">
                          <span className="cpkg-package-icon">📦</span>
                          <div>
                            <strong className="cpkg-package-id">{pkg.package_id}</strong>
                            <div className="cpkg-package-meta">
                              <span>Prepared: {new Date(pkg.prepared_at).toLocaleDateString()}</span>
                              <span>By: {pkg.prepared_by_name}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(pkg.status || "PREPARED")}
                      </div>

                      <div className="cpkg-package-details">
                        <div className="cpkg-detail-row">
                          <span className="cpkg-detail-icon">👨‍⚖️</span>
                          <span><strong>Court Officer:</strong> {pkg.submitted_to_court}</span>
                        </div>
                        {pkg.submission_notes && (
                          <div className="cpkg-detail-row">
                            <span className="cpkg-detail-icon">📝</span>
                            <span><strong>Notes:</strong> {pkg.submission_notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Summary Stats */}
                      <div className="cpkg-summary-stats">
                        <div className="cpkg-stat">
                          <span className="cpkg-stat-icon">📦</span>
                          <span>{pkg.summary.total_evidence}</span>
                          <label>Evidence</label>
                        </div>
                        <div className="cpkg-stat">
                          <span className="cpkg-stat-icon">✅</span>
                          <span>{pkg.summary.verified_evidence}</span>
                          <label>Verified</label>
                        </div>
                        <div className="cpkg-stat">
                          <span className="cpkg-stat-icon">👤</span>
                          <span>{pkg.summary.total_suspects}</span>
                          <label>Suspects</label>
                        </div>
                        <div className="cpkg-stat">
                          <span className="cpkg-stat-icon">👥</span>
                          <span>{pkg.summary.total_witnesses}</span>
                          <label>Witnesses</label>
                        </div>
                        <div className="cpkg-stat">
                          <span className="cpkg-stat-icon">⏱️</span>
                          <span>{pkg.summary.case_duration_days}</span>
                          <label>Days</label>
                        </div>
                      </div>

                      <div className="cpkg-package-actions">
                        <button className="cpkg-btn cpkg-btn-secondary" onClick={() => downloadPackage(pkg)}>
                          📥 Download Package
                        </button>
                        {pkg.status !== "SUBMITTED" && (
                          <button className="cpkg-btn cpkg-btn-success" onClick={() => submitPackage(pkg.package_id)} disabled={loading}>
                            📤 Submit to Court
                          </button>
                        )}
                        <button 
                          className="cpkg-expand-btn"
                          onClick={() => setExpandedPackage(expandedPackage === pkg.package_id ? null : pkg.package_id)}
                        >
                          {expandedPackage === pkg.package_id ? "▲ Less Details" : "▼ More Details"}
                        </button>
                      </div>

                      {expandedPackage === pkg.package_id && (
                        <div className="cpkg-package-expanded">
                          {/* Changed from ipfs_cid to storage_cid */}
                          {pkg.storage_cid && (
                            <div className="cpkg-expanded-section">
                              <strong>🔗 Package Storage Reference:</strong>
                              <code className="cpkg-cid">{pkg.storage_cid}</code>
                              <div className="cpkg-storage-note">Stored securely in MongoDB database</div>
                            </div>
                          )}
                          <div className="cpkg-expanded-section">
                            <strong>📋 Package Contents:</strong>
                            <div className="cpkg-contents-list">
                              {pkg.contents?.evidence?.length > 0 && (
                                <div>• {pkg.contents.evidence.length} Evidence items (Cloudinary)</div>
                              )}
                              {pkg.contents?.suspects?.length > 0 && (
                                <div>• {pkg.contents.suspects.length} Suspects identified</div>
                              )}
                              {pkg.contents?.witnesses?.length > 0 && (
                                <div>• {pkg.contents.witnesses.length} Witnesses recorded</div>
                              )}
                              <div>• Complete investigation timeline</div>
                              <div>• Digital verification records</div>
                            </div>
                          </div>
                          <div className="cpkg-expanded-section">
                            <strong>📅 Timeline:</strong>
                            <div>Prepared: {new Date(pkg.prepared_at).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        /* Court Package Styles - Indigo Theme */
        .cpkg-dashboard {
          animation: cpkg-fadeIn 0.4s ease-out;
        }

        @keyframes cpkg-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cpkg-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cpkg-fade-up {
          animation: cpkg-slideUp 0.5s ease-out backwards;
        }

        /* Cards */
        .cpkg-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .cpkg-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .cpkg-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .cpkg-card-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .cpkg-card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .cpkg-card-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        /* Select Wrapper */
        .cpkg-select-wrapper {
          position: relative;
        }

        .cpkg-case-select, .cpkg-court-select {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          color: #e8ecf8;
          font-size: 0.9rem;
          appearance: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cpkg-case-select:focus, .cpkg-court-select:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cpkg-select-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        /* Tabs */
        .cpkg-tabs-container {
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 24px;
        }

        .cpkg-tabs {
          display: flex;
          gap: 8px;
        }

        .cpkg-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          border-radius: 8px 8px 0 0;
        }

        .cpkg-tab::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #6366f1;
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .cpkg-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .cpkg-tab.active {
          color: #818cf8;
        }

        .cpkg-tab.active::after {
          transform: scaleX(1);
        }

        .cpkg-tab-icon {
          font-size: 1rem;
        }

        .cpkg-tab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #818cf8;
        }

        /* Toast */
        .cpkg-toast {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: cpkg-toastIn 0.3s ease-out;
        }

        @keyframes cpkg-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .cpkg-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .cpkg-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Form */
        .cpkg-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cpkg-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cpkg-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #7a849c;
        }

        .cpkg-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .cpkg-textarea-wrapper {
          position: relative;
        }

        .cpkg-textarea-icon {
          position: absolute;
          left: 14px;
          top: 16px;
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .cpkg-textarea-wrapper textarea {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          color: #e8ecf8;
          font-size: 0.85rem;
          resize: vertical;
        }

        .cpkg-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cpkg-textarea-wrapper textarea::placeholder {
          color: #3d4459;
        }

        .cpkg-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        /* Buttons */
        .cpkg-btn {
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cpkg-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .cpkg-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .cpkg-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .cpkg-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
          transform: translateY(-2px);
        }

        .cpkg-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .cpkg-btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .cpkg-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cpkg-link-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .cpkg-link-btn:hover {
          color: #a5b4fc;
          transform: translateX(4px);
        }

        .cpkg-expand-btn {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          padding: 8px 16px;
          border-radius: 8px;
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cpkg-expand-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
        }

        /* Info Box */
        .cpkg-info-box {
          margin-top: 24px;
          padding: 20px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
        }

        .cpkg-info-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .cpkg-info-icon {
          font-size: 1.2rem;
        }

        .cpkg-info-header strong {
          font-size: 0.9rem;
          color: #e8ecf8;
        }

        .cpkg-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .cpkg-info-item {
          font-size: 0.8rem;
          color: #7a849c;
          padding: 6px 0;
        }

        /* Packages List */
        .cpkg-packages-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cpkg-package-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cpkg-slideIn 0.3s ease-out backwards;
        }

        @keyframes cpkg-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .cpkg-package-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .cpkg-package-card.expanded {
          border-color: rgba(99, 102, 241, 0.35);
          background: rgba(12, 15, 26, 0.85);
        }

        .cpkg-package-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }

        .cpkg-package-info {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .cpkg-package-icon {
          font-size: 1.5rem;
        }

        .cpkg-package-id {
          font-size: 0.85rem;
          font-weight: 700;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .cpkg-package-meta {
          display: flex;
          gap: 16px;
          margin-top: 6px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .cpkg-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .cpkg-status-icon {
          font-size: 0.8rem;
        }

        .cpkg-package-details {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        }

        .cpkg-detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: #7a849c;
          margin-bottom: 8px;
        }

        .cpkg-detail-icon {
          font-size: 0.85rem;
        }

        /* Summary Stats */
        .cpkg-summary-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding: 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .cpkg-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 60px;
        }

        .cpkg-stat-icon {
          font-size: 1.2rem;
          margin-bottom: 4px;
        }

        .cpkg-stat span {
          font-size: 1.2rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .cpkg-stat label {
          font-size: 0.65rem;
          color: #7a849c;
          margin-top: 2px;
        }

        .cpkg-package-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        /* Expanded Section */
        .cpkg-package-expanded {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .cpkg-expanded-section {
          margin-bottom: 16px;
        }

        .cpkg-expanded-section:last-child {
          margin-bottom: 0;
        }

        .cpkg-expanded-section strong {
          font-size: 0.75rem;
          color: #818cf8;
          display: block;
          margin-bottom: 8px;
        }

        .cpkg-cid {
          font-size: 0.7rem;
          font-family: monospace;
          color: #7a849c;
          word-break: break-all;
          background: rgba(7, 9, 14, 0.5);
          padding: 8px;
          border-radius: 8px;
          display: block;
        }

        .cpkg-storage-note {
          font-size: 0.65rem;
          color: #3d4459;
          margin-top: 4px;
        }

        .cpkg-contents-list {
          font-size: 0.75rem;
          color: #7a849c;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 8px;
        }

        /* Spinner */
        .cpkg-spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: cpkg-spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes cpkg-spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .cpkg-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .cpkg-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .cpkg-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .cpkg-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cpkg-card {
            padding: 20px;
          }

          .cpkg-tab {
            padding: 10px 16px;
            font-size: 0.8rem;
          }

          .cpkg-package-header {
            flex-direction: column;
          }

          .cpkg-summary-stats {
            gap: 12px;
          }

          .cpkg-stat {
            min-width: 50px;
          }

          .cpkg-package-actions {
            flex-direction: column;
          }

          .cpkg-btn {
            width: 100%;
            text-align: center;
          }

          .cpkg-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}