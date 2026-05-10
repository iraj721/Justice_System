import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/services/apiClient";


type FIR = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  incident_description: string;
  incident_location: string;
  complainant_name: string;
  complainant_contact: string;
  complainant_address?: string;
  status: string;
  created_at: string;
  case_id?: string;
  case_number?: string;
  status_history?: Array<{
    status: string;
    timestamp: string;
    remarks: string;
    changed_by?: string;
  }>;
};

type FIRCreateInput = {
  incident_title: string;
  incident_description: string;
  incident_location: string;
  incident_datetime: string;
  complainant_contact: string;
  complainant_name: string;
  complainant_address: string;
  accused_person?: string;
  accused_description?: string;
  witness_names?: string;
  witness_contact?: string;
};

type PublicUserViewProps = {
  token: string;
  initialDraft?: FIRCreateInput | null;
  onDraftSaved?: () => void;
  showMyFirsOnly?: boolean;
};

export function PublicUserView({
  token,
  initialDraft,
  onDraftSaved,
  showMyFirsOnly = false,
}: PublicUserViewProps) {
  const [myFirs, setMyFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [selectedFir, setSelectedFir] = useState<FIR | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [form, setForm] = useState<FIRCreateInput>({
    incident_title: "",
    incident_description: "",
    incident_location: "",
    incident_datetime: new Date().toISOString().slice(0, 16),
    complainant_contact: "",
    complainant_name: "",
    complainant_address: "",
    accused_person: "",
    accused_description: "",
    witness_names: "",
    witness_contact: "",
  });

  useEffect(() => {
    if (initialDraft) {
      setForm({
        incident_title: initialDraft.incident_title || "",
        incident_description: initialDraft.incident_description || "",
        incident_location: initialDraft.incident_location || "",
        incident_datetime:
          initialDraft.incident_datetime ||
          new Date().toISOString().slice(0, 16),
        complainant_contact: initialDraft.complainant_contact || "",
        complainant_name: initialDraft.complainant_name || "",
        complainant_address: initialDraft.complainant_address || "",
        accused_person: initialDraft.accused_person || "",
        accused_description: initialDraft.accused_description || "",
        witness_names: initialDraft.witness_names || "",
        witness_contact: initialDraft.witness_contact || "",
      });
      setActiveTab("form");
      if (onDraftSaved) onDraftSaved();
    }
  }, [initialDraft]);

  useEffect(() => {
    loadMyFirs();
  }, []);

  async function loadMyFirs() {
    try {
      const data = await apiRequest<FIR[]>("/fir/my", { token });
      setMyFirs(data);
    } catch (err) {
      console.error("Error loading FIRs:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  function getStatusConfig(status: string) {
    const config: Record<
      string,
      { color: string; bg: string; icon: string; label: string }
    > = {
      SUBMITTED: {
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.08)",
        icon: "📋",
        label: "Submitted",
      },
      UNDER_REVIEW: {
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.08)",
        icon: "🔍",
        label: "Under Review",
      },
      ACCEPTED: {
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.08)",
        icon: "✅",
        label: "Accepted",
      },
      REJECTED: {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.08)",
        icon: "❌",
        label: "Rejected",
      },
      UNDER_INVESTIGATION: {
        color: "#a855f7",
        bg: "rgba(168, 85, 247, 0.08)",
        icon: "🔬",
        label: "Investigation",
      },
      CLOSED: {
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        icon: "🏁",
        label: "Closed",
      },
    };
    return (
      config[status] || {
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        icon: "📌",
        label: status,
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!form.complainant_name) {
      setError("Please enter your name");
      setSubmitting(false);
      return;
    }
    if (!form.complainant_contact) {
      setError("Please enter your contact number");
      setSubmitting(false);
      return;
    }
    if (!form.incident_title) {
      setError("Please enter incident title");
      setSubmitting(false);
      return;
    }
    if (!form.incident_description) {
      setError("Please enter incident description");
      setSubmitting(false);
      return;
    }
    if (!form.incident_location) {
      setError("Please enter incident location");
      setSubmitting(false);
      return;
    }

    try {
      const requestData = {
        ...form,
        incident_datetime: new Date(form.incident_datetime).toISOString(),
      };

      await apiRequest("/fir/", {
        method: "POST",
        token,
        body: requestData,
      });

      setSuccess(
        "✓ FIR submitted successfully! An investigator will review it.",
      );
      setForm({
        incident_title: "",
        incident_description: "",
        incident_location: "",
        incident_datetime: new Date().toISOString().slice(0, 16),
        complainant_contact: "",
        complainant_name: "",
        complainant_address: "",
        accused_person: "",
        accused_description: "",
        witness_names: "",
        witness_contact: "",
      });
      setActiveTab("list");
      await loadMyFirs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function openFirDetails(fir: FIR) {
    setSelectedFir(fir);
    setShowDetailsModal(true);
  }

  if (showMyFirsOnly) {
    return (
      <div className="puv-simple">
        <div className="puv-simple-header">
          <div className="puv-simple-icon">📋</div>
          <h2>My FIRs</h2>
          <p>Track all your filed complaints</p>
        </div>
        {loading ? (
          <div className="puv-loading">
            <div className="puv-shimmer-card"><div className="puv-shimmer"></div></div>
            <div className="puv-shimmer-card"><div className="puv-shimmer"></div></div>
          </div>
        ) : myFirs.length === 0 ? (
          <div className="puv-empty">
            <div className="puv-empty-icon">📭</div>
            <h3>No FIRs Found</h3>
            <p>You haven't filed any complaints yet.</p>
          </div>
        ) : (
          <div className="puv-list">
            {myFirs.map((item, idx) => {
              const statusConfig = getStatusConfig(item.status);
              return (
                <div
                  key={item.fir_id}
                  className={`puv-card ${hoveredCard === item.fir_id ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredCard(item.fir_id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="puv-card-header">
                    <div>
                      <span className="puv-card-number">{item.fir_number}</span>
                      <span className="puv-card-date">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className="puv-status"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                  <h4 className="puv-card-title">{item.incident_title}</h4>
                  <p className="puv-card-desc">
                    {item.incident_description?.substring(0, 100)}
                  </p>
                  <button 
                    className="puv-view-details-btn"
                    onClick={() => openFirDetails(item)}
                  >
                    View Details →
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {showDetailsModal && selectedFir && (
          <PUVModal
            fir={selectedFir}
            onClose={() => setShowDetailsModal(false)}
            getStatusConfig={getStatusConfig}
          />
        )}
      </div>
    );
  }

  return (
    <div className="puv-dashboard">
      {/* Stats Cards - Fixed */}
      <div className="puv-stats">
        <div className="puv-stat-card">
          <div className="puv-stat-icon">📝</div>
          <div className="puv-stat-info">
            <div className="puv-stat-value">{myFirs.length}</div>
            <div className="puv-stat-label">Total FIRs</div>
          </div>
        </div>
        <div className="puv-stat-card">
          <div className="puv-stat-icon">✅</div>
          <div className="puv-stat-info">
            <div className="puv-stat-value">
              {myFirs.filter((f) => f.status === "CLOSED").length}
            </div>
            <div className="puv-stat-label">Closed</div>
          </div>
        </div>
        <div className="puv-stat-card">
          <div className="puv-stat-icon">🔄</div>
          <div className="puv-stat-info">
            <div className="puv-stat-value">
              {
                myFirs.filter(
                  (f) =>
                    f.status === "UNDER_REVIEW" ||
                    f.status === "UNDER_INVESTIGATION",
                ).length
              }
            </div>
            <div className="puv-stat-label">Active</div>
          </div>
        </div>
        <div className="puv-stat-card">
          <div className="puv-stat-icon">⚖️</div>
          <div className="puv-stat-info">
            <div className="puv-stat-value">24/7</div>
            <div className="puv-stat-label">Support</div>
          </div>
        </div>
      </div>

      {/* Tab Buttons - ONLY 2 tabs */}
      <div className="puv-tabs-container">
        <div className="puv-tabs">
          <button
            className={`puv-tab ${activeTab === "form" ? "active" : ""}`}
            onClick={() => setActiveTab("form")}
          >
            <span className="puv-tab-icon">📝</span>
            <span className="puv-tab-text">File FIR</span>
          </button>
          <button
            className={`puv-tab ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <span className="puv-tab-icon">📋</span>
            <span className="puv-tab-text">My FIRs</span>
            {myFirs.length > 0 && (
              <span className="puv-tab-badge">{myFirs.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Form Tab */}
      {activeTab === "form" && (
        <div className="puv-form-container puv-fade-up">
          <div className="puv-form-header">
            <h2>File New FIR</h2>
            <p>Please provide accurate information for proper investigation</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="puv-section">
              <div className="puv-section-title">
                <span className="puv-section-icon">👤</span>
                <h3>Complainant Information</h3>
              </div>
              <div className="puv-grid-2">
                <div className="puv-input">
                  <label>Full Name <span className="puv-required">*</span></label>
                  <input
                    type="text"
                    value={form.complainant_name}
                    onChange={(e) => setForm({ ...form, complainant_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="puv-input">
                  <label>Contact Number <span className="puv-required">*</span></label>
                  <input
                    type="tel"
                    value={form.complainant_contact}
                    onChange={(e) => setForm({ ...form, complainant_contact: e.target.value })}
                    placeholder="0300-1234567"
                  />
                </div>
              </div>
              <div className="puv-input">
                <label>Address <span className="puv-required">*</span></label>
                <input
                  type="text"
                  value={form.complainant_address}
                  onChange={(e) => setForm({ ...form, complainant_address: e.target.value })}
                  placeholder="Your complete address"
                />
              </div>
            </div>

            <div className="puv-section">
              <div className="puv-section-title">
                <span className="puv-section-icon">📌</span>
                <h3>Incident Details</h3>
              </div>
              <div className="puv-input">
                <label>Incident Title <span className="puv-required">*</span></label>
                <input
                  type="text"
                  value={form.incident_title}
                  onChange={(e) => setForm({ ...form, incident_title: e.target.value })}
                  placeholder="e.g., Theft at residence"
                />
              </div>
              <div className="puv-input">
                <label>Incident Description <span className="puv-required">*</span></label>
                <textarea
                  value={form.incident_description}
                  onChange={(e) => setForm({ ...form, incident_description: e.target.value })}
                  rows={4}
                  placeholder="Detailed description of what happened..."
                />
              </div>
              <div className="puv-grid-2">
                <div className="puv-input">
                  <label>Incident Location <span className="puv-required">*</span></label>
                  <input
                    type="text"
                    value={form.incident_location}
                    onChange={(e) => setForm({ ...form, incident_location: e.target.value })}
                    placeholder="Where did this happen?"
                  />
                </div>
                <div className="puv-input">
                  <label>Date & Time <span className="puv-required">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.incident_datetime}
                    onChange={(e) => setForm({ ...form, incident_datetime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="puv-section">
              <div className="puv-section-title">
                <span className="puv-section-icon">👮</span>
                <h3>Suspect Information</h3>
                <span className="puv-optional-badge">Optional</span>
              </div>
              <div className="puv-grid-2">
                <div className="puv-input">
                  <label>Suspected Person Name</label>
                  <input
                    type="text"
                    value={form.accused_person}
                    onChange={(e) => setForm({ ...form, accused_person: e.target.value })}
                    placeholder="Name of accused (if known)"
                  />
                </div>
                <div className="puv-input">
                  <label>Suspect Description</label>
                  <textarea
                    value={form.accused_description}
                    onChange={(e) => setForm({ ...form, accused_description: e.target.value })}
                    rows={2}
                    placeholder="Physical description, known details, etc."
                  />
                </div>
              </div>
            </div>

            <div className="puv-section">
              <div className="puv-section-title">
                <span className="puv-section-icon">👥</span>
                <h3>Witness Information</h3>
                <span className="puv-optional-badge">Optional</span>
              </div>
              <div className="puv-grid-2">
                <div className="puv-input">
                  <label>Witness Names</label>
                  <input
                    type="text"
                    value={form.witness_names}
                    onChange={(e) => setForm({ ...form, witness_names: e.target.value })}
                    placeholder="Names of witnesses (comma separated)"
                  />
                </div>
                <div className="puv-input">
                  <label>Witness Contact</label>
                  <input
                    type="text"
                    value={form.witness_contact}
                    onChange={(e) => setForm({ ...form, witness_contact: e.target.value })}
                    placeholder="Contact numbers"
                  />
                </div>
              </div>
            </div>

            {error && <div className="puv-alert puv-alert-error">{error}</div>}
            {success && <div className="puv-alert puv-alert-success">{success}</div>}

            <div className="puv-actions">
              <button
                type="button"
                className="puv-btn puv-btn-outline"
                onClick={() => setActiveTab("list")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="puv-btn puv-btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="puv-spinner-small"></span>
                    Submitting...
                  </>
                ) : (
                  "✓ Submit FIR"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My FIRs List Tab */}
      {activeTab === "list" && (
        <div className="puv-list-container puv-fade-up">
          <div className="puv-list-header">
            <h2>My FIRs</h2>
            <p>Track all your filed complaints</p>
          </div>
          {myFirs.length === 0 ? (
            <div className="puv-empty">
              <div className="puv-empty-icon">📭</div>
              <h3>No FIRs Found</h3>
              <p>You haven't filed any complaints yet.</p>
            </div>
          ) : (
            <div className="puv-list">
              {myFirs.map((item, idx) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <div
                    key={item.fir_id}
                    className={`puv-list-card ${hoveredCard === item.fir_id ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredCard(item.fir_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="puv-list-card-header">
                      <div className="puv-list-card-info">
                        <span className="puv-list-card-number">{item.fir_number}</span>
                        <span className="puv-list-card-date">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className="puv-list-card-status"
                        style={{
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>
                    <h4 className="puv-list-card-title">{item.incident_title}</h4>
                    <p className="puv-list-card-desc">
                      {item.incident_description?.substring(0, 100)}...
                    </p>
                    <button 
                      className="puv-view-details-btn"
                      onClick={() => openFirDetails(item)}
                    >
                      View Details →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FIR Details Modal */}
      {showDetailsModal && selectedFir && (
        <PUVModal
          fir={selectedFir}
          onClose={() => setShowDetailsModal(false)}
          getStatusConfig={getStatusConfig}
        />
      )}

      <style>{`
        .puv-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 28px;
          animation: puv-fadeIn 0.4s ease-out;
        }

        @keyframes puv-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Stats Cards - Fixed */
        .puv-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        @media (max-width: 900px) {
          .puv-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .puv-stats {
            grid-template-columns: 1fr;
          }
        }

        .puv-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .puv-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(12, 15, 26, 0.8);
        }

        .puv-stat-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }

        .puv-stat-info {
          flex: 1;
        }

        .puv-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
          line-height: 1.2;
        }

        .puv-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Tabs */
        .puv-tabs-container {
          margin-bottom: 28px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
        }

        .puv-tabs {
          display: flex;
          gap: 8px;
        }

        .puv-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          border-radius: 8px 8px 0 0;
        }

        .puv-tab::after {
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

        .puv-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .puv-tab.active {
          color: #818cf8;
        }

        .puv-tab.active::after {
          transform: scaleX(1);
        }

        .puv-tab-icon {
          font-size: 1.1rem;
        }

        .puv-tab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 8px;
          color: #818cf8;
        }

        @media (max-width: 600px) {
          .puv-tabs { gap: 4px; }
          .puv-tab { padding: 10px 16px; font-size: 0.8rem; }
          .puv-tab-icon { font-size: 0.9rem; }
        }

        /* Form Container */
        .puv-form-container, .puv-list-container {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 32px;
        }

        @media (max-width: 768px) {
          .puv-form-container, .puv-list-container { padding: 20px; }
        }

        .puv-form-header, .puv-list-header {
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .puv-form-header h2, .puv-list-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .puv-form-header p, .puv-list-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Sections */
        .puv-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        }

        .puv-section:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .puv-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .puv-section-icon { font-size: 1.3rem; }
        .puv-section-title h3 { font-size: 1rem; font-weight: 600; color: #818cf8; margin: 0; }
        .puv-optional-badge { font-size: 0.7rem; padding: 2px 10px; background: rgba(99,102,241,0.1); border-radius: 20px; color: #7a849c; margin-left: auto; }
        .puv-required { color: #ef4444; margin-left: 2px; }

        /* Grid */
        .puv-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .puv-grid-2 { grid-template-columns: 1fr; gap: 0; }
        }

        /* Inputs */
        .puv-input {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .puv-input label { font-size: 0.8rem; font-weight: 500; color: #7a849c; }

        .puv-input input,
        .puv-input textarea {
          padding: 12px 16px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .puv-input input:focus,
        .puv-input textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        /* Alerts */
        .puv-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 0.85rem;
        }

        .puv-alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
        .puv-alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; }

        /* Buttons */
        .puv-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .puv-btn {
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .puv-btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
        .puv-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
        .puv-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .puv-btn-outline { background: transparent; border: 1px solid rgba(99,102,241,0.2); color: #7a849c; }
        .puv-btn-outline:hover { border-color: #6366f1; color: #818cf8; transform: translateY(-2px); }

        .puv-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: puv-spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes puv-spin { to { transform: rotate(360deg); } }

        /* FIR List Cards */
        .puv-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .puv-list-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 14px;
          padding: 20px 24px;
          transition: all 0.3s;
          animation: puv-slideIn 0.3s ease-out backwards;
        }

        @keyframes puv-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .puv-list-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.7);
        }

        .puv-list-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .puv-list-card-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .puv-list-card-number {
          font-weight: 600;
          font-size: 0.8rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .puv-list-card-date { font-size: 0.7rem; color: #3d4459; }
        .puv-list-card-status { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .puv-list-card-title { font-size: 1rem; font-weight: 600; margin-bottom: 8px; color: #e8ecf8; }
        .puv-list-card-desc { font-size: 0.85rem; color: #7a849c; margin-bottom: 14px; }

        .puv-view-details-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .puv-view-details-btn:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .puv-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .puv-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .puv-empty h3 { font-size: 1.2rem; margin-bottom: 8px; color: #e8ecf8; }
        .puv-empty p { color: #7a849c; margin-bottom: 20px; }

        @media (max-width: 768px) {
          .puv-dashboard { padding: 16px; }
          .puv-stat-card { padding: 16px; }
          .puv-stat-value { font-size: 1.3rem; }
          .puv-stat-icon { width: 44px; height: 44px; font-size: 1.3rem; }
          .puv-list-card { padding: 16px; }
          .puv-list-card-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}

// Modal Component
function PUVModal({
  fir,
  onClose,
  getStatusConfig,
}: {
  fir: FIR;
  onClose: () => void;
  getStatusConfig: (status: string) => {
    color: string;
    bg: string;
    icon: string;
    label: string;
  };
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const statusConfig = getStatusConfig(fir.status);

  return (
    <div className="puv-modal-overlay" onClick={onClose}>
      <div className="puv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="puv-modal-header">
          <div className="puv-modal-header-left">
            <div className="puv-modal-icon">📋</div>
            <div>
              <h3>FIR Details</h3>
              <p>Complete information about your complaint</p>
            </div>
          </div>
          <button className="puv-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="puv-modal-body">
          <div className="puv-modal-row">
            <div className="puv-modal-info-card">
              <span className="puv-modal-info-label">FIR Number</span>
              <span className="puv-modal-info-value">{fir.fir_number}</span>
            </div>
            <div className="puv-modal-info-card">
              <span className="puv-modal-info-label">Status</span>
              <span className="puv-modal-status" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>
            <div className="puv-modal-info-card">
              <span className="puv-modal-info-label">Filed On</span>
              <span className="puv-modal-info-value">
                {new Date(fir.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="puv-modal-section">
            <div className="puv-modal-section-title">
              <span className="puv-modal-section-icon">📌</span>
              <h4>Incident Details</h4>
            </div>
            <div className="puv-modal-detail-card">
              <div className="puv-modal-detail-row">
                <span className="puv-modal-detail-label">Title</span>
                <span className="puv-modal-detail-value">{fir.incident_title}</span>
              </div>
              <div className="puv-modal-detail-row">
                <span className="puv-modal-detail-label">Description</span>
                <span className="puv-modal-detail-value">{fir.incident_description}</span>
              </div>
              <div className="puv-modal-detail-row">
                <span className="puv-modal-detail-label">Location</span>
                <span className="puv-modal-detail-value">{fir.incident_location}</span>
              </div>
            </div>
          </div>

          {fir.status_history && fir.status_history.length > 0 && (
            <div className="puv-modal-section">
              <div className="puv-modal-section-title">
                <span className="puv-modal-section-icon">📅</span>
                <h4>Status Timeline</h4>
              </div>
              <div className="puv-modal-timeline">
                {fir.status_history.map((history, idx) => (
                  <div key={idx} className="puv-modal-timeline-item">
                    <div className="puv-modal-timeline-dot"></div>
                    <div className="puv-modal-timeline-content">
                      <div className="puv-modal-timeline-header">
                        <strong>{history.status.replace(/_/g, " ")}</strong>
                        <span>{new Date(history.timestamp).toLocaleString()}</span>
                      </div>
                      {history.remarks && <p className="puv-modal-timeline-remarks">{history.remarks}</p>}
                      {history.changed_by && <div className="puv-modal-timeline-by">By: {history.changed_by}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="puv-modal-footer">
          <button className="puv-modal-btn puv-modal-btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{`
        .puv-modal-overlay {
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

        .puv-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 650px;
          max-height: 85vh;
          overflow: hidden;
        }

        .puv-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
          background: rgba(7, 9, 14, 0.5);
        }

        .puv-modal-header-left { display: flex; align-items: center; gap: 14px; }
        .puv-modal-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .puv-modal-header-left h3 { font-size: 1.1rem; font-weight: 600; color: #e8ecf8; margin: 0 0 4px 0; }
        .puv-modal-header-left p { font-size: 0.7rem; color: #7a849c; margin: 0; }
        .puv-modal-close { background: rgba(99,102,241,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #7a849c; font-size: 1.1rem; cursor: pointer; }

        .puv-modal-body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 140px); }
        .puv-modal-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .puv-modal-info-card { background: rgba(7,9,14,0.5); border: 1px solid rgba(99,102,241,0.12); border-radius: 12px; padding: 14px; text-align: center; }
        .puv-modal-info-label { display: block; font-size: 0.65rem; color: #7a849c; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .puv-modal-info-value { display: block; font-size: 0.85rem; font-weight: 600; color: #e8ecf8; }
        .puv-modal-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .puv-modal-section { margin-bottom: 24px; }
        .puv-modal-section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .puv-modal-section-icon { font-size: 1rem; }
        .puv-modal-section-title h4 { font-size: 0.85rem; font-weight: 600; color: #818cf8; margin: 0; }
        .puv-modal-detail-card { background: rgba(7,9,14,0.5); border: 1px solid rgba(99,102,241,0.1); border-radius: 12px; padding: 16px; }
        .puv-modal-detail-row { display: flex; margin-bottom: 12px; }
        .puv-modal-detail-label { width: 100px; font-size: 0.7rem; color: #7a849c; flex-shrink: 0; }
        .puv-modal-detail-value { flex: 1; font-size: 0.8rem; color: #e8ecf8; word-break: break-word; }
        .puv-modal-timeline { position: relative; padding-left: 24px; }
        .puv-modal-timeline-item { position: relative; padding-bottom: 20px; }
        .puv-modal-timeline-dot { position: absolute; left: -24px; top: 4px; width: 10px; height: 10px; background: #6366f1; border-radius: 50%; border: 2px solid rgba(99,102,241,0.3); }
        .puv-modal-timeline-item::before { content: ''; position: absolute; left: -20px; top: 14px; width: 2px; height: calc(100% - 10px); background: rgba(99,102,241,0.15); }
        .puv-modal-timeline-item:last-child::before { display: none; }
        .puv-modal-timeline-content { background: rgba(7,9,14,0.5); padding: 12px 16px; border-radius: 10px; }
        .puv-modal-timeline-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
        .puv-modal-timeline-header strong { font-size: 0.8rem; color: #e8ecf8; }
        .puv-modal-timeline-header span { font-size: 0.65rem; color: #3d4459; }
        .puv-modal-timeline-remarks { font-size: 0.75rem; color: #7a849c; margin: 6px 0 4px; }
        .puv-modal-timeline-by { font-size: 0.65rem; color: #3d4459; }
        .puv-modal-footer { display: flex; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(99,102,241,0.12); background: rgba(7,9,14,0.5); }
        .puv-modal-btn { padding: 10px 24px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: none; }
        .puv-modal-btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }

        @media (max-width: 600px) {
          .puv-modal-row { grid-template-columns: 1fr; gap: 12px; }
          .puv-modal-detail-row { flex-direction: column; }
          .puv-modal-detail-label { width: auto; margin-bottom: 4px; }
          .puv-modal-timeline-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}