import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

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

export function CaseShare({ token }: { token: string; cases?: Case[] }) {
  const [shareEmail, setShareEmail] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [permission, setPermission] = useState("VIEW");
  const [sharedWithMe, setSharedWithMe] = useState<ShareWithMe[]>([]);
  const [myShares, setMyShares] = useState<MyShare[]>([]);
  const [userCases, setUserCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"share" | "received" | "sent">("share");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadShares();
    loadUserCases();
  }, []);

  async function loadShares() {
    try {
      const [shared, my] = await Promise.all([
        apiRequest<ShareWithMe[]>("/case-share/shared-with-me", { token }).catch(() => []),
        apiRequest<MyShare[]>("/case-share/my-shares", { token }).catch(() => []),
      ]);
      setSharedWithMe(shared);
      setMyShares(my);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function loadUserCases() {
    try {
      // Get FIRs that have associated cases
      const myFirs = await apiRequest<any[]>("/user/my-firs", { token }).catch(() => []);
      
      const casesList = myFirs
        .filter((fir: any) => fir.case_id)
        .map((fir: any) => ({
          case_id: fir.case_id,
          case_number: fir.case_number || fir.case_id,
          title: fir.incident_title,
          status: fir.case_status || "UNDER_INVESTIGATION",
        }));
      
      setUserCases(casesList);
    } catch (err) {
      console.error("Error loading user cases:", err);
    }
  }

  async function handleShareCase() {
    if (!selectedCase) {
      setMessage("❌ Please select a case");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!shareEmail) {
      setMessage("❌ Please enter email to share with");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest("/case-share/share", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          share_with_email: shareEmail,
          permission: permission,
        },
      });
      setMessage(`✅ Case shared with ${shareEmail}`);
      setShareEmail("");
      setSelectedCase("");
      setDropdownOpen(false);
      loadShares();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Share error:", err);
      setMessage("❌ Failed to share case");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function getStatusConfig(status: string) {
    const config: Record<string, { color: string; bg: string; icon: string; label: string }> = {
      UNDER_INVESTIGATION: { color: "#f97316", bg: "rgba(249,115,22,0.08)", icon: "🔬", label: "Investigation" },
      SUBMITTED_TO_COURT: { color: "#818cf8", bg: "rgba(129,140,248,0.08)", icon: "⚖️", label: "In Court" },
      DECIDED: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: "✓", label: "Decided" },
    };
    return config[status] || { color: "#64748b", bg: "rgba(100,116,139,0.08)", icon: "📌", label: status.replace(/_/g, " ") };
  }

  function getPermissionIcon(perm: string) { return perm === "VIEW" ? "👁️" : "💬"; }
  function getPermissionLabel(perm: string) { return perm === "VIEW" ? "View Only" : "Can Comment"; }

  if (loading) {
    return (
      <div className="cs-loading">
        <div className="cs-shimmer-card"><div className="cs-shimmer"></div></div>
        <div className="cs-shimmer-card"><div className="cs-shimmer"></div></div>
      </div>
    );
  }

  return (
    <div className="cs-dashboard">
      <div className="cs-tabs-container">
        <div className="cs-tabs">
          <button className={`cs-tab ${activeTab === "share" ? "active" : ""}`} onClick={() => setActiveTab("share")}>
            <span className="cs-tab-icon">📤</span><span>Share Case</span>
          </button>
          <button className={`cs-tab ${activeTab === "received" ? "active" : ""}`} onClick={() => setActiveTab("received")}>
            <span className="cs-tab-icon">📥</span><span>Received</span>
            {sharedWithMe.length > 0 && <span className="cs-tab-badge">{sharedWithMe.length}</span>}
          </button>
          <button className={`cs-tab ${activeTab === "sent" ? "active" : ""}`} onClick={() => setActiveTab("sent")}>
            <span className="cs-tab-icon">📤</span><span>Sent</span>
            {myShares.length > 0 && <span className="cs-tab-badge">{myShares.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === "share" && (
        <div className="cs-form-container cs-fade-up">
          <div className="cs-form-header">
            <h2>Share Case</h2>
            <p>Share your case with family members or legal representatives</p>
          </div>

          {message && (
            <div className={`cs-message ${message.includes("✅") ? "cs-message-success" : "cs-message-error"}`}>
              <span>{message}</span>
            </div>
          )}

          <div className="cs-form">
            <div className="cs-form-group">
              <label>Select Case <span className="cs-required">*</span></label>
              <div className="cs-custom-select" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="cs-select-trigger">
                  <span className="cs-select-icon">📋</span>
                  <span className="cs-select-text">
                    {selectedCase ? userCases.find(c => c.case_id === selectedCase)?.case_number : "-- Select a case --"}
                  </span>
                  <span className={`cs-select-arrow ${dropdownOpen ? "open" : ""}`}>▼</span>
                </div>
                {dropdownOpen && (
                  <div className="cs-select-dropdown">
                    {userCases.length === 0 ? (
                      <div className="cs-no-options">No cases available. File an FIR first.</div>
                    ) : (
                      userCases.map((c) => (
                        <div
                          key={c.case_id}
                          className={`cs-select-option ${selectedCase === c.case_id ? "selected" : ""}`}
                          onClick={() => { setSelectedCase(c.case_id); setDropdownOpen(false); }}
                        >
                          <span className="cs-option-number">{c.case_number}</span>
                          <span className="cs-option-title">{c.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {userCases.length === 0 && (
                <div className="cs-no-cases">
                  <span>ℹ️</span>
                  <p>You don't have any cases yet. File an FIR first - once accepted, you'll get a case number.</p>
                </div>
              )}
            </div>

            <div className="cs-form-group">
              <label>Share With (Email) <span className="cs-required">*</span></label>
              <div className="cs-input-wrapper">
                <span className="cs-input-icon">✉️</span>
                <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="family@example.com or lawyer@example.com" />
              </div>
            </div>

            <div className="cs-form-group">
              <label>Permission Level</label>
              <div className="cs-permission-options">
                <label className={`cs-permission-option ${permission === "VIEW" ? "active" : ""}`}>
                  <input type="radio" value="VIEW" checked={permission === "VIEW"} onChange={(e) => setPermission(e.target.value)} />
                  <div className="cs-permission-radio">
                    <span className="cs-permission-icon">👁️</span>
                    <div className="cs-permission-info">
                      <strong>View Only</strong>
                      <small>Can see case details and evidence</small>
                    </div>
                  </div>
                </label>
                <label className={`cs-permission-option ${permission === "COMMENT" ? "active" : ""}`}>
                  <input type="radio" value="COMMENT" checked={permission === "COMMENT"} onChange={(e) => setPermission(e.target.value)} />
                  <div className="cs-permission-radio">
                    <span className="cs-permission-icon">💬</span>
                    <div className="cs-permission-info">
                      <strong>View & Comment</strong>
                      <small>Can add comments and suggestions</small>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button className="cs-submit-btn" onClick={handleShareCase}>
              <span>📤 Share Case</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "received" && (
        <div className="cs-list-container cs-fade-up">
          <div className="cs-list-header">
            <h2>Cases Shared With Me</h2>
            <p>Cases that others have shared with you</p>
          </div>
          {sharedWithMe.length === 0 ? (
            <div className="cs-empty"><div className="cs-empty-icon">📭</div><h3>No Shared Cases</h3><p>No one has shared any cases with you yet.</p></div>
          ) : (
            <div className="cs-card-list">
              {sharedWithMe.map((share, idx) => {
                const statusConfig = getStatusConfig(share.status);
                return (
                  <div key={share.case_id} className={`cs-card ${hoveredCard === share.case_id ? "hovered" : ""}`} onMouseEnter={() => setHoveredCard(share.case_id)} onMouseLeave={() => setHoveredCard(null)} style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="cs-card-header">
                      <div className="cs-card-info"><span className="cs-card-number">{share.case_number}</span></div>
                      <span className="cs-status" style={{ background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.icon} {statusConfig.label}</span>
                    </div>
                    <h4 className="cs-card-title">{share.title}</h4>
                    <div className="cs-card-details">
                      <div className="cs-detail"><span className="cs-detail-icon">👤</span><span>Shared by: <strong>{share.shared_by_name}</strong></span></div>
                      <div className="cs-detail"><span className="cs-detail-icon">{getPermissionIcon(share.permission)}</span><span>Permission: <strong>{getPermissionLabel(share.permission)}</strong></span></div>
                      <div className="cs-detail"><span className="cs-detail-icon">📅</span><span>Shared on: {new Date(share.shared_at).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "sent" && (
        <div className="cs-list-container cs-fade-up">
          <div className="cs-list-header"><h2>Cases I've Shared</h2><p>Cases you have shared with others</p></div>
          {myShares.length === 0 ? (
            <div className="cs-empty"><div className="cs-empty-icon">📤</div><h3>No Shared Cases</h3><p>You haven't shared any cases yet.</p></div>
          ) : (
            <div className="cs-card-list">
              {myShares.map((share, idx) => (
                <div key={share.case_id} className="cs-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="cs-card-header"><div className="cs-card-info"><span className="cs-card-number">{share.case_number}</span></div></div>
                  <div className="cs-card-details">
                    <div className="cs-detail"><span className="cs-detail-icon">👤</span><span>Shared with: <strong>{share.shared_with_name}</strong></span></div>
                    <div className="cs-detail"><span className="cs-detail-icon">{getPermissionIcon(share.permission)}</span><span>Permission: <strong>{getPermissionLabel(share.permission)}</strong></span></div>
                    <div className="cs-detail"><span className="cs-detail-icon">📅</span><span>Shared on: {new Date(share.shared_at).toLocaleDateString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .cs-dashboard { padding: 24px; animation: cs-fadeIn 0.4s ease-out; }
        @keyframes cs-fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .cs-fade-up { animation: cs-slideUp 0.5s ease-out backwards; }
        @keyframes cs-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .cs-loading { padding: 24px; }
        .cs-shimmer-card { background: rgba(12,15,26,0.5); border-radius: 12px; height: 120px; margin-bottom: 16px; position: relative; overflow: hidden; }
        .cs-shimmer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent); animation: cs-shimmer 1.5s infinite; }
        @keyframes cs-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .cs-tabs-container { border-bottom: 1px solid rgba(99,102,241,0.15); margin-bottom: 28px; }
        .cs-tabs { display: flex; gap: 8px; }
        .cs-tab { display: flex; align-items: center; gap: 10px; padding: 14px 28px; background: transparent; border: none; color: #7a849c; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.3s; position: relative; border-radius: 8px 8px 0 0; }
        .cs-tab::after { content: ""; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #6366f1; transform: scaleX(0); transition: transform 0.3s ease; }
        .cs-tab:hover { color: #e8ecf8; background: rgba(99,102,241,0.05); }
        .cs-tab.active { color: #818cf8; }
        .cs-tab.active::after { transform: scaleX(1); }
        .cs-tab-icon { font-size: 1.1rem; }
        .cs-tab-badge { background: rgba(99,102,241,0.2); padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; margin-left: 8px; color: #818cf8; }
        
        .cs-form-container, .cs-list-container { background: rgba(12,15,26,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(99,102,241,0.12); border-radius: 16px; padding: 32px; }
        .cs-form-header, .cs-list-header { margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .cs-form-header h2, .cs-list-header h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 6px; color: #e8ecf8; }
        .cs-form-header p, .cs-list-header p { color: #7a849c; font-size: 0.85rem; }
        
        .cs-form { display: flex; flex-direction: column; gap: 24px; }
        .cs-form-group { display: flex; flex-direction: column; gap: 8px; }
        .cs-form-group label { font-size: 0.8rem; font-weight: 600; color: #7a849c; }
        .cs-required { color: #ef4444; margin-left: 2px; }
        
        /* Custom Select Dropdown */
        .cs-custom-select { position: relative; width: 100%; cursor: pointer; }
        .cs-select-trigger { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(7,9,14,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; color: #e8ecf8; transition: all 0.3s; }
        .cs-select-trigger:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }
        .cs-select-icon { font-size: 1rem; color: #3d4459; }
        .cs-select-text { flex: 1; font-size: 0.9rem; }
        .cs-select-arrow { font-size: 0.7rem; color: #3d4459; transition: transform 0.3s; }
        .cs-select-arrow.open { transform: rotate(180deg); }
        
        .cs-select-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #0c0f1a; border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; max-height: 250px; overflow-y: auto; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
        .cs-select-option { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .cs-select-option:hover { background: rgba(99,102,241,0.1); }
        .cs-select-option.selected { background: rgba(99,102,241,0.15); color: #818cf8; }
        .cs-option-number { font-weight: 600; font-size: 0.8rem; color: #818cf8; background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 20px; }
        .cs-option-title { font-size: 0.85rem; color: #e8ecf8; }
        .cs-no-options { padding: 20px; text-align: center; color: #7a849c; font-size: 0.8rem; }
        
        .cs-input-wrapper { position: relative; }
        .cs-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #3d4459; }
        .cs-input-wrapper input { width: 100%; padding: 12px 16px 12px 44px; background: rgba(7,9,14,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; color: #e8ecf8; font-size: 0.9rem; }
        .cs-input-wrapper input:focus { outline: none; border-color: #6366f1; background: rgba(99,102,241,0.05); }
        
        .cs-no-cases { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 12px; background: rgba(249,115,22,0.08); border-radius: 10px; font-size: 0.75rem; color: #f97316; }
        
        .cs-permission-options { display: flex; gap: 16px; flex-wrap: wrap; }
        .cs-permission-option { flex: 1; cursor: pointer; }
        .cs-permission-option input { display: none; }
        .cs-permission-radio { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; background: rgba(7,9,14,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; transition: all 0.3s; }
        .cs-permission-option:hover .cs-permission-radio { border-color: #6366f1; background: rgba(99,102,241,0.05); }
        .cs-permission-option.active .cs-permission-radio { border-color: #6366f1; background: rgba(99,102,241,0.08); }
        .cs-permission-icon { font-size: 1.5rem; }
        .cs-permission-info strong { display: block; font-size: 0.85rem; color: #e8ecf8; margin-bottom: 4px; }
        .cs-permission-info small { font-size: 0.7rem; color: #7a849c; }
        
        .cs-submit-btn { background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; padding: 14px 28px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #fff; cursor: pointer; transition: all 0.3s; margin-top: 8px; }
        .cs-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
        
        .cs-card-list { display: flex; flex-direction: column; gap: 16px; }
        .cs-card { background: rgba(7,9,14,0.5); border: 1px solid rgba(99,102,241,0.12); border-radius: 14px; padding: 20px 24px; transition: all 0.3s; animation: cs-slideIn 0.3s ease-out backwards; }
        @keyframes cs-slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .cs-card.hovered { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); background: rgba(12,15,26,0.8); }
        .cs-card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
        .cs-card-number { font-weight: 600; font-size: 0.8rem; color: #818cf8; background: rgba(99,102,241,0.12); padding: 4px 12px; border-radius: 20px; }
        .cs-status { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .cs-card-title { font-size: 1rem; font-weight: 600; margin-bottom: 14px; color: #e8ecf8; }
        .cs-card-details { display: flex; flex-direction: column; gap: 10px; }
        .cs-detail { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: #7a849c; }
        .cs-detail-icon { font-size: 0.9rem; width: 24px; text-align: center; }
        
        .cs-message { padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-size: 0.85rem; animation: cs-messageIn 0.3s ease-out; }
        @keyframes cs-messageIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .cs-message-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; }
        .cs-message-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
        
        .cs-empty { text-align: center; padding: 60px 20px; }
        .cs-empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.4; }
        .cs-empty h3 { font-size: 1.2rem; margin-bottom: 8px; color: #e8ecf8; }
        .cs-empty p { color: #7a849c; }
        
        @media (max-width: 768px) { .cs-dashboard { padding: 16px; } .cs-tab { padding: 12px 20px; font-size: 0.85rem; } .cs-form-container, .cs-list-container { padding: 20px; } .cs-permission-options { flex-direction: column; } .cs-card { padding: 16px; } }
      `}</style>
    </div>
  );
}