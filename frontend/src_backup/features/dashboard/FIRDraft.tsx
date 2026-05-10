// frontend/src/features/dashboard/FIRDraft.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

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
      setLoading(false);
    }
  }

  async function handleDeleteDraft(draftId: string) {
    if (!confirm("Delete this draft?")) return;
    
    try {
      await apiRequest(`/fir/draft/${draftId}`, { method: "DELETE", token });
      setMessage("✅ Draft deleted");
      setTimeout(() => setMessage(""), 3000);
      loadDrafts();
    } catch (err) {
      setMessage("❌ Failed to delete");
    }
  }

  function handleLoadDraft(draft: Draft) {
    if (onLoadDraft) {
      onLoadDraft(draft.data);
    }
  }

  if (loading) {
    return <div className="card">Loading drafts...</div>;
  }

  return (
    <div className="card">
      <h3>💾 Saved Drafts ({drafts.length})</h3>
      
      {message && (
        <div style={{ padding: "12px", background: message.includes("✅") ? "#d1fae5" : "#fee2e2", borderRadius: "8px", marginBottom: "16px" }}>
          {message}
        </div>
      )}
      
      {drafts.length === 0 ? (
        <p>No saved drafts. Start filing an FIR and save as draft.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {drafts.map((draft) => (
            <div key={draft.draft_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: "16px" }}>{draft.data.incident_title || "Untitled Draft"}</strong>
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                    {draft.data.incident_location || "Location not set"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
                    Last updated: {new Date(draft.updated_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleLoadDraft(draft)}
                    style={{ background: "#3b82f6", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                  >
                    📝 Load & Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteDraft(draft.draft_id)}
                    style={{ background: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "12px", color: "#3b82f6" }}>Preview Details</summary>
                <div style={{ marginTop: "8px", fontSize: "13px", padding: "8px", background: "#f8fafc", borderRadius: "8px" }}>
                  <p><strong>Description:</strong> {draft.data.incident_description?.substring(0, 100)}...</p>
                  <p><strong>Complainant:</strong> {draft.data.complainant_name} ({draft.data.complainant_contact})</p>
                  {draft.data.accused_person && <p><strong>Accused:</strong> {draft.data.accused_person}</p>}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}