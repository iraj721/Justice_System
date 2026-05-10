// frontend/src/features/dashboard/CaseShare.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

type Case = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
};

type ShareWithMe = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
  shared_by: string;
  shared_by_name: string;
  permission: string;
  shared_at: string;
};

type MyShare = {
  case_id: string;
  case_number: string;
  shared_with: string;
  shared_with_name: string;
  permission: string;
  shared_at: string;
};

export function CaseShare({ token, cases }: { token: string; cases: Case[] }) {
  const [shareEmail, setShareEmail] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [permission, setPermission] = useState("VIEW");
  const [sharedWithMe, setSharedWithMe] = useState<ShareWithMe[]>([]);
  const [myShares, setMyShares] = useState<MyShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadShares();
  }, []);

  async function loadShares() {
    try {
      const [shared, my] = await Promise.all([
        apiRequest<ShareWithMe[]>("/case-share/shared-with-me", { token }).catch(() => []),
        apiRequest<MyShare[]>("/case-share/my-shares", { token }).catch(() => [])
      ]);
      setSharedWithMe(shared);
      setMyShares(my);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleShareCase() {
    if (!selectedCase) {
      setMessage("❌ Please select a case");
      return;
    }
    if (!shareEmail) {
      setMessage("❌ Please enter email to share with");
      return;
    }

    try {
      await apiRequest("/case-share/share", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          share_with_email: shareEmail,
          permission: permission
        }
      });
      setMessage(`✅ Case shared with ${shareEmail}`);
      setShareEmail("");
      setSelectedCase("");
      loadShares();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to share case");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      "UNDER_INVESTIGATION": "#f59e0b",
      "SUBMITTED_TO_COURT": "#8b5cf6",
      "DECIDED": "#10b981"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>{status.replace(/_/g, " ")}</span>;
  }

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div>
      {/* Share Form */}
      <div className="card">
        <h3>👥 Share Case with Family / Lawyer</h3>
        {message && (
          <div style={{ padding: "12px", background: message.includes("✅") ? "#d1fae5" : "#fee2e2", borderRadius: "8px", marginBottom: "16px" }}>
            {message}
          </div>
        )}
        
        <div className="form-grid">
          <label>Select Case *</label>
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}>
            <option value="">-- Select Case --</option>
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
          
          <label>Share With (Email) *</label>
          <input 
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="family@example.com or lawyer@example.com"
          />
          
          <label>Permission Level</label>
          <select value={permission} onChange={(e) => setPermission(e.target.value)}>
            <option value="VIEW">👁️ View Only</option>
            <option value="COMMENT">💬 View & Comment</option>
          </select>
          
          <button onClick={handleShareCase} style={{ background: "#8b5cf6", cursor: "pointer" }}>
            📤 Share Case
          </button>
        </div>
      </div>

      {/* Cases Shared With Me */}
      <div className="card">
        <h3>📂 Cases Shared With Me</h3>
        {sharedWithMe.length === 0 ? (
          <p>No cases shared with you yet.</p>
        ) : (
          sharedWithMe.map((share) => (
            <div key={share.case_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <strong>{share.case_number}</strong>
                {getStatusBadge(share.status)}
              </div>
              <h4 style={{ margin: "8px 0" }}>{share.title}</h4>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Shared by: {share.shared_by_name} ({share.shared_by})
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Permission: {share.permission === "VIEW" ? "👁️ View Only" : "💬 Can Comment"}
              </div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                Shared on: {new Date(share.shared_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cases I Shared */}
      <div className="card">
        <h3>📤 Cases I've Shared</h3>
        {myShares.length === 0 ? (
          <p>You haven't shared any cases yet.</p>
        ) : (
          myShares.map((share) => (
            <div key={share.case_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <strong>{share.case_number}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Shared with: {share.shared_with_name} ({share.shared_with})
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Permission: {share.permission === "VIEW" ? "👁️ View Only" : "💬 Can Comment"}
              </div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                Shared on: {new Date(share.shared_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}