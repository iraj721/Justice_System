// frontend/src/pages/roles/PublicUser/PublicUserView.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/services/apiClient";

type FIR = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  incident_description: string;
  status: string;
  created_at: string;
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

export function PublicUserView({ token, initialDraft, onDraftSaved, showMyFirsOnly = false }: PublicUserViewProps) {
  const [myFirs, setMyFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [selectedFir, setSelectedFir] = useState<FIR | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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

  // Load draft if provided
  useEffect(() => {
    if (initialDraft) {
      setForm({
        incident_title: initialDraft.incident_title || "",
        incident_description: initialDraft.incident_description || "",
        incident_location: initialDraft.incident_location || "",
        incident_datetime: initialDraft.incident_datetime || new Date().toISOString().slice(0, 16),
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
      setLoading(false);
    }
  }

  function getStatusConfig(status: string) {
    const config: Record<string, { color: string; bg: string; icon: string; label: string }> = {
      "SUBMITTED": { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: "📋", label: "Submitted" },
      "UNDER_REVIEW": { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: "🔍", label: "Under Review" },
      "ACCEPTED": { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: "✅", label: "Accepted" },
      "REJECTED": { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: "❌", label: "Rejected" },
      "UNDER_INVESTIGATION": { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", icon: "🔬", label: "Investigation" },
      "CLOSED": { color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)", icon: "🏁", label: "Closed" }
    };
    return config[status] || { color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)", icon: "📌", label: status };
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
        incident_datetime: new Date(form.incident_datetime).toISOString()
      };
      
      await apiRequest("/fir/", {
        method: "POST",
        token,
        body: requestData
      });
      
      setSuccess("✅ FIR submitted successfully! An investigator will review it.");
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

  // If showMyFirsOnly is true, only show the FIR listing
  if (showMyFirsOnly) {
    return (
      <div className="public-view-simple">
        <div className="public-view-header">
          <h2>📋 My FIRs</h2>
          <p className="muted">Track all your filed complaints</p>
        </div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your FIRs...</p>
          </div>
        ) : myFirs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No FIRs Found</h3>
            <p>You haven't filed any complaints yet.</p>
          </div>
        ) : (
          <div className="firs-list">
            {myFirs.map((item) => {
              const statusConfig = getStatusConfig(item.status);
              return (
                <div key={item.fir_id} className="fir-card" onClick={() => openFirDetails(item)}>
                  <div className="fir-card-header">
                    <div>
                      <span className="fir-number">{item.fir_number}</span>
                      <span className="fir-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="status-badge" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                  <h4 className="fir-title">{item.incident_title}</h4>
                  <p className="fir-description">{item.incident_description?.substring(0, 100)}...</p>
                  <div className="fir-card-footer">
                    <span className="view-details">View Details →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedFir && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>FIR Details</h3>
                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">FIR Number:</span>
                  <span className="detail-value">{selectedFir.fir_number}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="status-badge" style={{ background: getStatusConfig(selectedFir.status).bg, color: getStatusConfig(selectedFir.status).color }}>
                    {getStatusConfig(selectedFir.status).icon} {getStatusConfig(selectedFir.status).label}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Title:</span>
                  <span className="detail-value">{selectedFir.incident_title}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{selectedFir.incident_description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Filed On:</span>
                  <span className="detail-value">{new Date(selectedFir.created_at).toLocaleString()}</span>
                </div>
                
                {selectedFir.status_history && selectedFir.status_history.length > 0 && (
                  <>
                    <div className="detail-divider"></div>
                    <h4>Status History</h4>
                    <div className="timeline">
                      {selectedFir.status_history.map((history, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <strong>{history.status.replace(/_/g, " ")}</strong>
                              <span>{new Date(history.timestamp).toLocaleString()}</span>
                            </div>
                            {history.remarks && <p className="timeline-remarks">{history.remarks}</p>}
                            {history.changed_by && <p className="timeline-by">By: {history.changed_by}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="public-view">
      {/* Modern Tabs */}
      <div className="tabs-modern">
        <button
          className={`tab-btn-modern ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
        >
          <span className="tab-icon">📝</span>
          <span>File New FIR</span>
        </button>
        <button
          className={`tab-btn-modern ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <span className="tab-icon">📋</span>
          <span>My FIRs</span>
          {myFirs.length > 0 && <span className="tab-badge">{myFirs.length}</span>}
        </button>
      </div>

      {/* FIR Form Tab */}
      {activeTab === "form" && (
        <div className="form-card">
          <div className="form-header">
            <h2>File New FIR</h2>
            <p className="muted">Please provide accurate information for proper investigation</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Complainant Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">👤</span>
                Complainant Information
              </h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={form.complainant_name}
                    onChange={(e) => setForm({ ...form, complainant_name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    value={form.complainant_contact}
                    onChange={(e) => setForm({ ...form, complainant_contact: e.target.value })}
                    placeholder="0300-1234567"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={form.complainant_address}
                  onChange={(e) => setForm({ ...form, complainant_address: e.target.value })}
                  placeholder="Your complete address"
                  required
                />
              </div>
            </div>

            {/* Incident Details */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📌</span>
                Incident Details
              </h3>
              <div className="form-group">
                <label>Incident Title *</label>
                <input
                  type="text"
                  value={form.incident_title}
                  onChange={(e) => setForm({ ...form, incident_title: e.target.value })}
                  placeholder="e.g., Theft at residence"
                  required
                />
              </div>
              <div className="form-group">
                <label>Incident Description *</label>
                <textarea
                  value={form.incident_description}
                  onChange={(e) => setForm({ ...form, incident_description: e.target.value })}
                  rows={4}
                  placeholder="Detailed description of what happened..."
                  required
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Incident Location *</label>
                  <input
                    type="text"
                    value={form.incident_location}
                    onChange={(e) => setForm({ ...form, incident_location: e.target.value })}
                    placeholder="Where did this happen?"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.incident_datetime}
                    onChange={(e) => setForm({ ...form, incident_datetime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Suspect Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">👮</span>
                Suspect Information (Optional)
              </h3>
              <div className="form-group">
                <label>Suspected Person Name</label>
                <input
                  type="text"
                  value={form.accused_person}
                  onChange={(e) => setForm({ ...form, accused_person: e.target.value })}
                  placeholder="Name of accused (if known)"
                />
              </div>
              <div className="form-group">
                <label>Suspect Description</label>
                <textarea
                  value={form.accused_description}
                  onChange={(e) => setForm({ ...form, accused_description: e.target.value })}
                  rows={2}
                  placeholder="Physical description, known details, etc."
                />
              </div>
            </div>

            {/* Witness Information */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">👥</span>
                Witness Information (Optional)
              </h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Witness Names</label>
                  <input
                    type="text"
                    value={form.witness_names}
                    onChange={(e) => setForm({ ...form, witness_names: e.target.value })}
                    placeholder="Names of witnesses (comma separated)"
                  />
                </div>
                <div className="form-group">
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

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="form-actions">
              <button type="button" className="btn-outline" onClick={() => setActiveTab("list")}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Submitting...
                  </>
                ) : (
                  "✅ Submit FIR"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FIR List Tab */}
      {activeTab === "list" && (
        <div className="list-card">
          <div className="list-header">
            <h2>My FIRs</h2>
            <p className="muted">All your filed complaints at a glance</p>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your FIRs...</p>
            </div>
          ) : myFirs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No FIRs Found</h3>
              <p>You haven't filed any complaints yet.</p>
              <button className="btn-primary" onClick={() => setActiveTab("form")}>
                File Your First FIR
              </button>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card-mini">
                  <span className="stat-value">{myFirs.length}</span>
                  <span className="stat-label">Total FIRs</span>
                </div>
                <div className="stat-card-mini">
                  <span className="stat-value">{myFirs.filter(f => f.status === "CLOSED").length}</span>
                  <span className="stat-label">Closed</span>
                </div>
                <div className="stat-card-mini">
                  <span className="stat-value">{myFirs.filter(f => f.status === "UNDER_REVIEW" || f.status === "UNDER_INVESTIGATION").length}</span>
                  <span className="stat-label">Active</span>
                </div>
              </div>
              
              <div className="firs-list">
                {myFirs.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  return (
                    <div key={item.fir_id} className="fir-card" onClick={() => openFirDetails(item)}>
                      <div className="fir-card-header">
                        <div>
                          <span className="fir-number">{item.fir_number}</span>
                          <span className="fir-date">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="status-badge" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>
                      <h4 className="fir-title">{item.incident_title}</h4>
                      <p className="fir-description">{item.incident_description?.substring(0, 120)}...</p>
                      <div className="fir-card-footer">
                        <span className="view-details">View Full Details →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedFir && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>FIR Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">FIR Number:</span>
                <span className="detail-value">{selectedFir.fir_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="status-badge" style={{ background: getStatusConfig(selectedFir.status).bg, color: getStatusConfig(selectedFir.status).color }}>
                  {getStatusConfig(selectedFir.status).icon} {getStatusConfig(selectedFir.status).label}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Title:</span>
                <span className="detail-value">{selectedFir.incident_title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedFir.incident_description}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Filed On:</span>
                <span className="detail-value">{new Date(selectedFir.created_at).toLocaleString()}</span>
              </div>
              
              {selectedFir.status_history && selectedFir.status_history.length > 0 && (
                <>
                  <div className="detail-divider"></div>
                  <h4>Status Timeline</h4>
                  <div className="timeline">
                    {selectedFir.status_history.map((history, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <strong>{history.status.replace(/_/g, " ")}</strong>
                            <span>{new Date(history.timestamp).toLocaleString()}</span>
                          </div>
                          {history.remarks && <p className="timeline-remarks">{history.remarks}</p>}
                          {history.changed_by && <p className="timeline-by">By: {history.changed_by}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .public-view {
          padding: 24px;
          background: rgba(17, 19, 24, 0.6);
          border-radius: 28px;
          backdrop-filter: blur(10px);
        }

        /* Modern Tabs */
        .tabs-modern {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px;
          border-radius: 60px;
          width: fit-content;
        }

        .tab-btn-modern {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          background: transparent;
          border: none;
          border-radius: 40px;
          color: #8e9cc4;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab-btn-modern:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-btn-modern.active {
          background: linear-gradient(135deg, #f3c66a, #ffd98d);
          color: #111;
          box-shadow: 0 4px 15px rgba(243, 198, 106, 0.3);
        }

        .tab-icon {
          font-size: 1.1rem;
        }

        .tab-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 6px;
        }

        .tab-btn-modern.active .tab-badge {
          background: rgba(0, 0, 0, 0.15);
        }

        /* Cards */
        .form-card, .list-card {
          background: rgba(17, 19, 24, 0.8);
          border: 1px solid rgba(243, 198, 106, 0.12);
          border-radius: 24px;
          padding: 28px;
          backdrop-filter: blur(20px);
        }

        .form-header, .list-header {
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-header h2, .list-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #fff, #f3c66a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .muted {
          color: #8e9cc4;
          font-size: 0.85rem;
        }

        /* Form Sections */
        .form-section {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: #f3c66a;
        }

        .section-icon {
          font-size: 1.2rem;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #8e9cc4;
        }

        .form-group input,
        .form-group textarea {
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #f3c66a;
          background: rgba(243, 198, 106, 0.05);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #49587a;
        }

        /* Alerts */
        .alert {
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.85rem;
        }

        .alert.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .btn-primary, .btn-outline {
          padding: 12px 28px;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f3c66a, #ffd98d);
          border: none;
          color: #111;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(243, 198, 106, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .btn-outline:hover {
          border-color: #f3c66a;
          color: #f3c66a;
        }

        .btn-secondary {
          padding: 10px 24px;
          border-radius: 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card-mini {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(243, 198, 106, 0.1);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 800;
          color: #f3c66a;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #8e9cc4;
        }

        /* FIR List */
        .firs-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fir-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .fir-card:hover {
          border-color: rgba(243, 198, 106, 0.3);
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.05);
        }

        .fir-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .fir-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: #f3c66a;
          background: rgba(243, 198, 106, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .fir-date {
          font-size: 0.75rem;
          color: #8e9cc4;
          margin-left: 8px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .fir-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fff;
        }

        .fir-description {
          font-size: 0.85rem;
          color: #8e9cc4;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .fir-card-footer {
          text-align: right;
        }

        .view-details {
          font-size: 0.8rem;
          color: #f3c66a;
          transition: all 0.3s;
        }

        .fir-card:hover .view-details {
          transform: translateX(4px);
          display: inline-block;
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(243, 198, 106, 0.1);
          border-top-color: #f3c66a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #111;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #8e9cc4;
          margin-bottom: 20px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #111318;
          border: 1px solid rgba(243, 198, 106, 0.2);
          border-radius: 28px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h3 {
          font-size: 1.2rem;
          color: #f3c66a;
        }

        .modal-close {
          background: none;
          border: none;
          color: #8e9cc4;
          font-size: 1.2rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #fff;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(85vh - 140px);
        }

        .detail-row {
          display: flex;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .detail-label {
          width: 120px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #8e9cc4;
        }

        .detail-value {
          flex: 1;
          font-size: 0.9rem;
          color: #fff;
          line-height: 1.5;
          word-break: break-word;
        }

        .detail-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 20px 0;
        }

        .modal-body h4 {
          font-size: 0.95rem;
          margin-bottom: 16px;
          color: #f3c66a;
        }

        .timeline {
          position: relative;
          padding-left: 20px;
        }

        .timeline-item {
          position: relative;
          padding-bottom: 20px;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -20px;
          top: 4px;
          width: 10px;
          height: 10px;
          background: #f3c66a;
          border-radius: 50%;
          border: 2px solid rgba(243, 198, 106, 0.3);
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 14px;
          width: 2px;
          height: calc(100% - 10px);
          background: rgba(243, 198, 106, 0.2);
        }

        .timeline-item:last-child::before {
          display: none;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .timeline-header strong {
          font-size: 0.85rem;
          color: #fff;
        }

        .timeline-header span {
          font-size: 0.7rem;
          color: #8e9cc4;
        }

        .timeline-remarks {
          font-size: 0.8rem;
          color: #8e9cc4;
          margin: 4px 0;
        }

        .timeline-by {
          font-size: 0.7rem;
          color: #49587a;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: flex-end;
        }

        /* Simple View */
        .public-view-simple {
          padding: 20px;
        }

        .public-view-header {
          margin-bottom: 24px;
        }

        .public-view-header h2 {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .public-view {
            padding: 16px;
          }
          
          .tabs-modern {
            width: 100%;
            justify-content: center;
          }
          
          .tab-btn-modern {
            padding: 10px 20px;
            font-size: 0.85rem;
          }
          
          .form-card, .list-card {
            padding: 20px;
          }
          
          .form-row-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            width: 95%;
          }
          
          .detail-label {
            width: 100%;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
}
