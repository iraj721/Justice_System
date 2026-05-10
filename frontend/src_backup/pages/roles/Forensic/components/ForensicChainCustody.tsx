// frontend/src/pages/roles/Forensic/components/ForensicChainCustody.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Activity = {
  type: string;
  timestamp: string;
  by?: string;
  by_name?: string;
  from?: string;
  from_name?: string;
  to?: string;
  to_name?: string;
  reason?: string;
  action?: string;
  details?: string;
};

type CustodyData = {
  evidence_id: string;
  evidence_title: string;
  current_custodian: string;
  current_custodian_name: string;
  created_at: string;
  created_by: string;
  last_accessed: string;
  last_accessed_by: string;
  last_transferred_at: string;
  activities: Activity[];
  access_log: any[];
  transfer_log: any[];
};

export function ForensicChainCustody({ token }: { token: string }) {
  const [evidenceId, setEvidenceId] = useState("");
  const [custodyData, setCustodyData] = useState<CustodyData | null>(null);
  const [allEvidence, setAllEvidence] = useState<any[]>([]);
  const [loadingCustody, setLoadingCustody] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [message, setMessage] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [accessNote, setAccessNote] = useState("");
  const [selectedAction, setSelectedAction] = useState("VIEW");

  useEffect(() => {
    loadEvidence();
    loadUsers();
  }, []);

  async function loadEvidence() {
    setLoadingEvidence(true);
    try {
      const data = await apiRequest<any[]>("/forensic/chain/forensic-evidence", { token });
      console.log("Loaded evidence:", data);
      setAllEvidence(data || []);
    } catch (err) {
      console.error("Error loading evidence:", err);
      setMessage("❌ Failed to load evidence list");
      setAllEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  }

  async function loadUsers() {
    try {
      const forensicUsers = await apiRequest<any[]>("/admin/users/by-role/FORENSIC_ANALYST", { token });
      setUsers(forensicUsers || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  }

  async function loadCustodyLog() {
    if (!evidenceId) return;
    setLoadingCustody(true);
    try {
      const data = await apiRequest<CustodyData>(`/forensic/chain/custody-log/${evidenceId}`, { token });
      console.log("Custody data:", data);
      setCustodyData(data);
    } catch (err) {
      console.error("Error loading custody log:", err);
      setMessage("❌ Failed to load custody log");
      setCustodyData(null);
    } finally {
      setLoadingCustody(false);
    }
  }

  async function trackAccess() {
    if (!evidenceId) {
      setMessage("❌ Please select evidence");
      return;
    }
    try {
      await apiRequest("/forensic/chain/track-access", {
        method: "POST",
        token,
        body: {
          evidence_id: evidenceId,
          action: selectedAction,
          notes: accessNote || `${selectedAction} performed on evidence`
        }
      });
      setMessage("✅ Access logged successfully");
      setAccessNote("");
      loadCustodyLog();
      loadEvidence();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error logging access:", err);
      setMessage("❌ Failed to log access");
    }
  }

  async function transferCustody() {
    if (!evidenceId || !transferTo) {
      setMessage("❌ Please select evidence and target analyst");
      return;
    }
    try {
      await apiRequest("/forensic/chain/transfer-custody", {
        method: "POST",
        token,
        body: {
          evidence_id: evidenceId,
          to_analyst_email: transferTo,
          reason: transferReason || "Transfer for further analysis"
        }
      });
      setMessage("✅ Evidence transferred successfully");
      setTransferTo("");
      setTransferReason("");
      loadCustodyLog();
      loadEvidence();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error transferring:", err);
      setMessage("❌ Transfer failed");
    }
  }

  async function transferIn() {
    if (!evidenceId) {
      setMessage("❌ Please select evidence");
      return;
    }
    try {
      await apiRequest(`/forensic/chain/transfer-in?evidence_id=${evidenceId}`, {
        method: "POST",
        token
      });
      setMessage("✅ Evidence received successfully");
      loadCustodyLog();
      loadEvidence();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error receiving evidence:", err);
      setMessage("❌ Failed to receive evidence");
    }
  }

  function getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      "VIEW": "👁️",
      "ANALYZE": "🔬",
      "DOWNLOAD": "📥",
      "TRANSFER_OUT": "📤",
      "TRANSFER_IN": "📥",
      "CREATION": "✨"
    };
    return icons[action] || "📋";
  }

  if (loadingEvidence) {
    return <div className="card">Loading evidence list...</div>;
  }

  return (
    <div>
      {/* Select Evidence */}
      <div className="card">
        <label style={{ fontWeight: "bold" }}>Select Evidence to Track</label>
        <select 
          value={evidenceId} 
          onChange={(e) => {
            setEvidenceId(e.target.value);
            setCustodyData(null);
            setTimeout(() => loadCustodyLog(), 100);
          }}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "8px" }}
        >
          <option value="">-- Select Evidence --</option>
          {allEvidence.map((ev) => (
            <option key={ev.evidence_id} value={ev.evidence_id}>
              {ev.title} - Case: {ev.case_id} | Custodian: {ev.current_custodian_name || "Not assigned"}
            </option>
          ))}
        </select>
      </div>

      {loadingCustody && (
        <div className="card">Loading custody log...</div>
      )}

      {evidenceId && custodyData && !loadingCustody && (
        <>
          {/* Current Status Card */}
          <div className="card" style={{ background: "#f0fdf4", border: "1px solid #10b981" }}>
            <h3>🔐 Current Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <strong>Evidence:</strong> {custodyData.evidence_title}
              </div>
              <div>
                <strong>Current Custodian:</strong> 
                <span style={{ color: "#10b981", fontWeight: "bold", marginLeft: "8px" }}>
                  {custodyData.current_custodian_name || "Not assigned"}
                </span>
              </div>
              <div>
                <strong>Created:</strong> {new Date(custodyData.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Created By:</strong> {custodyData.created_by}
              </div>
              {custodyData.last_accessed && (
                <div>
                  <strong>Last Accessed:</strong> {new Date(custodyData.last_accessed).toLocaleString()}
                </div>
              )}
              {custodyData.last_accessed_by && (
                <div>
                  <strong>Last Accessed By:</strong> {custodyData.last_accessed_by}
                </div>
              )}
              {custodyData.last_transferred_at && (
                <div>
                  <strong>Last Transfer:</strong> {new Date(custodyData.last_transferred_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="card">
            <h3>📝 Log Evidence Action</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label>Action Type</label>
                <select 
                  value={selectedAction} 
                  onChange={(e) => setSelectedAction(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
                >
                  <option value="VIEW">👁️ View Evidence</option>
                  <option value="ANALYZE">🔬 Start Analysis</option>
                  <option value="DOWNLOAD">📥 Download Evidence</option>
                </select>
              </div>
              <div>
                <label>Notes (Optional)</label>
                <input 
                  value={accessNote} 
                  onChange={(e) => setAccessNote(e.target.value)} 
                  placeholder="Add notes about this action"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
                />
              </div>
            </div>
            <button onClick={trackAccess} style={{ marginTop: "12px", background: "#3b82f6", cursor: "pointer", width: "100%" }}>
              📋 Log This Action
            </button>
          </div>

          {/* Transfer Panel */}
          <div className="card">
            <h3>🔄 Transfer Evidence to Another Analyst</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label>Transfer To</label>
                <select 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
                >
                  <option value="">-- Select Analyst --</option>
                  {users.map((user) => (
                    <option key={user.email} value={user.email}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Reason for Transfer</label>
                <input 
                  value={transferReason} 
                  onChange={(e) => setTransferReason(e.target.value)} 
                  placeholder="e.g., Specialist required"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={transferCustody} style={{ background: "#f59e0b", cursor: "pointer", flex: 1 }}>
                📤 Transfer Out
              </button>
              <button onClick={transferIn} style={{ background: "#10b981", cursor: "pointer", flex: 1 }}>
                📥 Receive Evidence
              </button>
            </div>
          </div>

          {/* Complete Activity Log */}
          <div className="card">
            <h3>📋 Complete Chain of Custody Log</h3>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
              Showing all activities for this evidence in chronological order (newest first)
            </p>
            
            {custodyData.activities.length === 0 ? (
              <p>No activities recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {custodyData.activities.map((activity, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      borderLeft: `3px solid ${activity.type === "TRANSFER" ? "#f59e0b" : activity.type === "CREATION" ? "#10b981" : "#3b82f6"}`,
                      paddingLeft: "12px",
                      paddingBottom: "12px",
                      borderBottom: idx !== custodyData.activities.length - 1 ? "1px solid #e2e8f0" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "20px" }}>{getActionIcon(activity.action || activity.type)}</span>
                      <strong>
                        {activity.type === "TRANSFER" ? "Evidence Transferred" : 
                         activity.type === "CREATION" ? "Evidence Created" : 
                         `Evidence ${activity.action || "Accessed"}`}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#999" }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {activity.type === "TRANSFER" ? (
                      <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                        From: <strong>{activity.from_name}</strong> → To: <strong>{activity.to_name}</strong>
                        {activity.reason && <div>Reason: {activity.reason}</div>}
                      </div>
                    ) : activity.type === "CREATION" ? (
                      <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                        Created by: {activity.by_name || activity.by}
                        <div>{activity.details}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                        By: <strong>{activity.by_name || activity.by}</strong>
                        {activity.details && <div>Details: {activity.details}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transfer History Summary */}
          {custodyData.transfer_log.length > 0 && (
            <div className="card">
              <h3>🔄 Transfer History</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>From</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>To</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {custodyData.transfer_log.map((transfer, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px" }}>{new Date(transfer.transferred_at).toLocaleString()}</td>
                      <td style={{ padding: "8px" }}>{transfer.transferred_from_name}</td>
                      <td style={{ padding: "8px" }}>{transfer.transferred_to_name}</td>
                      <td style={{ padding: "8px" }}>{transfer.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Access Log Summary */}
          {custodyData.access_log.length > 0 && (
            <div className="card">
              <h3>📋 Access Log Summary</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Date/Time</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Accessed By</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {custodyData.access_log.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px" }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: "8px" }}>{log.accessed_by_name} ({log.accessed_by})</td>
                      <td style={{ padding: "8px" }}>{log.action}</td>
                      <td style={{ padding: "8px" }}>{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {evidenceId && !custodyData && !loadingCustody && (
        <div className="card">
          <p>No custody data found for this evidence. Try logging some actions first.</p>
        </div>
      )}

      {message && (
        <div className="card" style={{ background: message.includes("✅") ? "#d1fae5" : "#fee2e2", marginTop: "16px" }}>
          <p style={{ color: message.includes("✅") ? "#065f46" : "#991b1b", margin: 0 }}>{message}</p>
        </div>
      )}
    </div>
  );
}