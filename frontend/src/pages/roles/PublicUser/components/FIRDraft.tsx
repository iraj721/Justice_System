// frontend/src/pages/roles/PublicUser/components/FIRDraft.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Draft = {
  draft_id: string;
  data: {
    incident_title: string;
    incident_description: string;
    incident_location: string;
    complainant_name: string;
    complainant_contact: string;
    complainant_address: string;
    accused_person?: string;
    witness_names?: string;
  };
  created_at: string;
  updated_at: string;
};

export function FIRDraft({ token, onLoadDraft }: { token: string; onLoadDraft?: (draft: any) => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      const data = await apiRequest<Draft[]>("/fir/draft/my-drafts", { token });
      setDrafts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function handleDeleteDraft(draftId: string) {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    setDeletingId(draftId);
    try {
      await apiRequest(`/fir/draft/${draftId}`, { method: "DELETE", token });
      setMessage("✅ Draft deleted successfully");
      setTimeout(() => setMessage(""), 3000);
      loadDrafts();
    } catch (err) {
      setMessage("❌ Failed to delete draft");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setDeletingId(null);
    }
  }

  function handleLoadDraft(draft: Draft) {
    if (onLoadDraft) {
      onLoadDraft(draft.data);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="fd-loading">
        <div className="fd-shimmer-card">
          <div className="fd-shimmer"></div>
        </div>
        <div className="fd-shimmer-card">
          <div className="fd-shimmer"></div>
        </div>
        <div className="fd-shimmer-card">
          <div className="fd-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fd-dashboard">
      <div className="fd-header">
        <div className="fd-header-content">
          <div className="fd-header-icon">💾</div>
          <div>
            <h2 className="fd-title">Saved Drafts</h2>
            <p className="fd-subtitle">Continue working on your incomplete FIR applications</p>
          </div>
          <div className="fd-header-badge">{drafts.length} Draft{drafts.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {message && (
        <div className={`fd-message ${message.includes("✅") ? "fd-message-success" : "fd-message-error"}`}>
          <span>{message}</span>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="fd-empty">
          <div className="fd-empty-icon">📭</div>
          <h3>No Saved Drafts</h3>
          <p>You don't have any saved drafts. Start filing an FIR and save it as draft to continue later.</p>
          <div className="fd-empty-tip">
            <span className="fd-empty-tip-icon">💡</span>
            <span>Tip: While filing an FIR, you can save as draft to complete it later</span>
          </div>
        </div>
      ) : (
        <div className="fd-drafts-list">
          {drafts.map((draft, idx) => (
            <div 
              key={draft.draft_id} 
              className={`fd-draft-card ${expandedDraft === draft.draft_id ? "expanded" : ""}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="fd-draft-header">
                <div className="fd-draft-info">
                  <div className="fd-draft-icon">📝</div>
                  <div className="fd-draft-meta">
                    <h3 className="fd-draft-title">
                      {draft.data.incident_title || "Untitled Draft"}
                    </h3>
                    <div className="fd-draft-location">
                      <span className="fd-location-icon">📍</span>
                      {draft.data.incident_location || "Location not set"}
                    </div>
                  </div>
                </div>
                <div className="fd-draft-actions">
                  <button 
                    className="fd-load-btn"
                    onClick={() => handleLoadDraft(draft)}
                  >
                    📝 Load Draft
                  </button>
                  <button 
                    className="fd-delete-btn"
                    onClick={() => handleDeleteDraft(draft.draft_id)}
                    disabled={deletingId === draft.draft_id}
                  >
                    {deletingId === draft.draft_id ? (
                      <span className="fd-spinner-small"></span>
                    ) : (
                      "🗑️ Delete"
                    )}
                  </button>
                  <button 
                    className="fd-expand-btn"
                    onClick={() => setExpandedDraft(expandedDraft === draft.draft_id ? null : draft.draft_id)}
                  >
                    {expandedDraft === draft.draft_id ? "▲" : "▼"}
                  </button>
                </div>
              </div>
              
              <div className="fd-draft-footer">
                <div className="fd-draft-date">
                  <span className="fd-date-icon">🕐</span>
                  Last updated: {formatDate(draft.updated_at)}
                </div>
                <div className="fd-draft-date">
                  <span className="fd-date-icon">📅</span>
                  Created: {new Date(draft.created_at).toLocaleDateString()}
                </div>
              </div>

              {expandedDraft === draft.draft_id && (
                <div className="fd-draft-preview fd-fade-up">
                  <div className="fd-preview-section">
                    <h4 className="fd-preview-title">Incident Details</h4>
                    <div className="fd-preview-grid">
                      <div className="fd-preview-item">
                        <span className="fd-preview-label">Description</span>
                        <p className="fd-preview-value">{draft.data.incident_description || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="fd-preview-section">
                    <h4 className="fd-preview-title">Complainant Information</h4>
                    <div className="fd-preview-grid">
                      <div className="fd-preview-item">
                        <span className="fd-preview-label">Name</span>
                        <p className="fd-preview-value">{draft.data.complainant_name || "Not provided"}</p>
                      </div>
                      <div className="fd-preview-item">
                        <span className="fd-preview-label">Contact</span>
                        <p className="fd-preview-value">{draft.data.complainant_contact || "Not provided"}</p>
                      </div>
                      <div className="fd-preview-item">
                        <span className="fd-preview-label">Address</span>
                        <p className="fd-preview-value">{draft.data.complainant_address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {(draft.data.accused_person || draft.data.witness_names) && (
                    <div className="fd-preview-section">
                      <h4 className="fd-preview-title">Additional Information</h4>
                      <div className="fd-preview-grid">
                        {draft.data.accused_person && (
                          <div className="fd-preview-item">
                            <span className="fd-preview-label">Suspected Person</span>
                            <p className="fd-preview-value">{draft.data.accused_person}</p>
                          </div>
                        )}
                        {draft.data.witness_names && (
                          <div className="fd-preview-item">
                            <span className="fd-preview-label">Witnesses</span>
                            <p className="fd-preview-value">{draft.data.witness_names}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        /* Indigo Theme Styles */
        .fd-dashboard {
          padding: 24px;
          animation: fd-fadeIn 0.4s ease-out;
        }

        @keyframes fd-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fd-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fd-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fd-fade-up {
          animation: fd-slideUp 0.3s ease-out backwards;
        }

        /* Shimmer Loading */
        .fd-loading {
          padding: 24px;
        }

        .fd-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .fd-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: fd-shimmer 1.5s infinite;
        }

        @keyframes fd-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Header */
        .fd-header {
          margin-bottom: 28px;
        }

        .fd-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .fd-header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .fd-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .fd-subtitle {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        .fd-header-badge {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 6px 16px;
          border-radius: 40px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
        }

        /* Message */
        .fd-message {
          padding: 14px 18px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          animation: fd-messageIn 0.3s ease-out;
        }

        @keyframes fd-messageIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fd-message-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .fd-message-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Empty State */
        .fd-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
        }

        .fd-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .fd-empty h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .fd-empty p {
          color: #7a849c;
          margin-bottom: 24px;
        }

        .fd-empty-tip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 40px;
          font-size: 0.8rem;
          color: #818cf8;
        }

        .fd-empty-tip-icon {
          font-size: 1rem;
        }

        /* Drafts List */
        .fd-drafts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fd-draft-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fd-slideIn 0.3s ease-out backwards;
        }

        .fd-draft-card:hover {
          border-color: rgba(99, 102, 241, 0.25);
          background: rgba(12, 15, 26, 0.8);
        }

        .fd-draft-card.expanded {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(12, 15, 26, 0.8);
        }

        .fd-draft-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .fd-draft-info {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .fd-draft-icon {
          width: 44px;
          height: 44px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .fd-draft-meta {
          flex: 1;
        }

        .fd-draft-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 6px 0;
        }

        .fd-draft-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #3d4459;
        }

        .fd-location-icon {
          font-size: 0.7rem;
        }

        .fd-draft-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .fd-load-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fd-load-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .fd-delete-btn {
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #f87171;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fd-delete-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        .fd-delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fd-expand-btn {
          width: 34px;
          height: 34px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 6px;
          font-size: 0.8rem;
          color: #7a849c;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fd-expand-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
          color: #818cf8;
        }

        .fd-draft-footer {
          display: flex;
          gap: 24px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .fd-draft-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .fd-date-icon {
          font-size: 0.7rem;
        }

        /* Preview Section */
        .fd-draft-preview {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .fd-preview-section {
          margin-bottom: 16px;
        }

        .fd-preview-section:last-child {
          margin-bottom: 0;
        }

        .fd-preview-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #818cf8;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fd-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .fd-preview-item {
          background: rgba(7, 9, 14, 0.5);
          padding: 10px 12px;
          border-radius: 8px;
        }

        .fd-preview-label {
          display: block;
          font-size: 0.65rem;
          color: #3d4459;
          margin-bottom: 4px;
        }

        .fd-preview-value {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
          word-break: break-word;
        }

        .fd-spinner-small {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: fd-spin 0.6s linear infinite;
        }

        @keyframes fd-spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .fd-dashboard {
            padding: 16px;
          }

          .fd-header-content {
            flex-direction: column;
            text-align: center;
          }

          .fd-header-icon {
            margin: 0 auto;
          }

          .fd-header-badge {
            margin: 0 auto;
          }

          .fd-draft-header {
            flex-direction: column;
          }

          .fd-draft-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .fd-draft-footer {
            flex-direction: column;
            gap: 8px;
          }

          .fd-preview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}