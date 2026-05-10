// frontend/src/features/dashboard/DashboardPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, getToken, getUser, logout } from "../../shared/services/auth";
import { apiRequest } from "../../shared/services/apiClient";
import { PublicUserView, InvestigatorView, ForensicView, CourtView, PublicAuditorView } from "../../pages/roles";
import { ROLE_INFO, type UserRole } from "../../app/roleConfig";
import { ProfilePage } from "./ProfilePage";
import { UserWidgets } from "./UserWidgets";
import { FIRDraft } from "./FIRDraft";
import { CaseShare } from "./CaseShare";
import { EmergencySOS } from "./EmergencySOS";
import { Documents } from "./Documents";
import { Feedback } from "./Feedback";
import { HelpCenter } from "./HelpCenter";

type DashboardContext = {
  email: string;
  role: string;
  full_name: string;
};

type FirType = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  status: string;
};

type CaseType = {
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  fir_id: string;
};

type EvidenceType = {
  evidence_id: string;
  case_id: string;
  title: string;
  description: string;
  ipfs_cid: string;
  status: string;
  hash: string;
};

type ForensicQueueType = {
  evidence_id: string;
  case_id: string;
  title: string;
  description: string;
  ipfs_cid: string;
  status: string;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState<DashboardContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [message, setMessage] = useState("");
  const token = getToken();
  const role = getRole();
  const user = getUser();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Forensic Analyst State
  const [verifyEvidenceId, setVerifyEvidenceId] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState("");
  const [forensicEvidenceId, setForensicEvidenceId] = useState("");
  const [forensicText, setForensicText] = useState("");
  const [transferReportId, setTransferReportId] = useState("");
  const [forensicQueue, setForensicQueue] = useState<ForensicQueueType[]>([]);

  // Investigator State
  const [allFirs, setAllFirs] = useState<FirType[]>([]);
  const [investigatorCases, setInvestigatorCases] = useState<CaseType[]>([]);
  const [investigatorEvidence, setInvestigatorEvidence] = useState<EvidenceType[]>([]);
  
  // Draft State
  const [draftData, setDraftData] = useState<any>(null);

  // Load data function - no console logs
  const loadRoleData = useCallback(async () => {
    if (!token || !role) return;

    try {
      if (role === "INVESTIGATOR") {
        const [firs, cases, evidence] = await Promise.all([
          apiRequest<FirType[]>("/fir/all", { token }).catch(() => []),
          apiRequest<CaseType[]>("/cases/investigator", { token }).catch(() => []),
          apiRequest<EvidenceType[]>("/cases/evidence/investigator", { token }).catch(() => [])
        ]);
        setAllFirs(firs);
        setInvestigatorCases(cases);
        setInvestigatorEvidence(evidence);
      }
      
      if (role === "FORENSIC_ANALYST") {
        const queue = await apiRequest<ForensicQueueType[]>("/forensic/queue", { token }).catch(() => []);
        setForensicQueue(queue);
      }
    } catch (err) {
      // Silent fail - no console log
    }
  }, [token, role]);

  useEffect(() => {
    if (!token || !role) {
      navigate("/login");
      return;
    }
    
    apiRequest<DashboardContext>("/auth/me", { token })
      .then(setContext)
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
    
    loadRoleData();
    
    // Auto-refresh every 5 seconds - silent
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (role === "INVESTIGATOR") {
      interval = setInterval(() => {
        loadRoleData();
        setLastRefresh(new Date());
      }, 5000);
    }
    
    if (role === "FORENSIC_ANALYST") {
      interval = setInterval(() => {
        loadRoleData();
        setLastRefresh(new Date());
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [navigate, token, role, loadRoleData]);

  const handleRefresh = async () => {
    await loadRoleData();
    setLastRefresh(new Date());
    setMessage("✅ Data refreshed!");
    setTimeout(() => setMessage(""), 2000);
  };

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
      setVerifyResult(result.verified ? "✅ Hash verification passed! Evidence is authentic." : "❌ Hash verification failed! Evidence may be tampered.");
    } catch (err) {
      setVerifyResult("❌ Error verifying evidence");
    }
  }

  async function handleCreateForensicReport() {
    if (!forensicEvidenceId || !forensicText) {
      alert("Please fill all fields");
      return;
    }
    
    try {
      await apiRequest("/forensic/analyze", {
        method: "POST",
        token,
        body: {
          evidence_id: forensicEvidenceId,
          analysis_type: "DIGITAL",
          findings: forensicText,
          conclusion: forensicText
        }
      });
      alert("✅ Forensic report generated successfully!");
      setForensicEvidenceId("");
      setForensicText("");
      await loadRoleData();
    } catch (err) {
      alert("❌ Failed to generate report: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }

  async function handleTransferReportToCourt() {
    if (!transferReportId) {
      alert("Please enter Report ID");
      return;
    }
    
    try {
      await apiRequest(`/forensic/transfer-court/${transferReportId}`, {
        method: "POST",
        token
      });
      alert("✅ Report transferred to court successfully!");
      setTransferReportId("");
      await loadRoleData();
    } catch (err) {
      alert("❌ Transfer failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Handle loading draft from FIRDraft component
  const handleLoadDraft = (draft: any) => {
    setDraftData(draft);
    setActiveTab("fir");
  };

  if (loading) {
    return (
      <main className="container">
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Loading dashboard...</h2>
        </div>
      </main>
    );
  }

  const roleInfo = role ? ROLE_INFO[role as UserRole] : null;

  return (
    <main className="container">
      <div className="space-between" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>🏛️ Justice Dashboard</h1>
          {user && <p>Welcome back, <strong>{user.full_name}</strong>!</p>}
          {(role === "INVESTIGATOR" || role === "FORENSIC_ANALYST") && (
            <p style={{ fontSize: "12px", color: "#666" }}>
              🔄 Auto-refreshing every {role === "INVESTIGATOR" ? "5" : "10"} seconds
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {(role === "INVESTIGATOR" || role === "FORENSIC_ANALYST") && (
            <button onClick={handleRefresh} style={{ background: "#3b82f6" }}>
              🔄 Refresh Now
            </button>
          )}
          <button onClick={handleLogout} style={{ background: "#dc2626", cursor: "pointer" }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="card" style={{ background: "#d1fae5", borderColor: "#10b981" }}>
          <p style={{ color: "#065f46", margin: 0 }}>{message}</p>
        </div>
      )}

      {roleInfo && (
        <div className="card" style={{ background: roleInfo.color + "10", borderLeft: `4px solid ${roleInfo.color}` }}>
          <p>
            <strong>🎭 Role:</strong> {roleInfo.name}
            <span style={{ marginLeft: "12px", fontSize: "14px", color: "#666" }}>{roleInfo.description}</span>
          </p>
          <p><strong>📧 Email:</strong> {context?.email || user?.email}</p>
        </div>
      )}

      {/* INVESTIGATOR VIEW */}
      {role === "INVESTIGATOR" && (
        <InvestigatorView 
          token={token!} 
          allFirs={allFirs}
          cases={investigatorCases}
          evidence={investigatorEvidence}
          onRefresh={handleRefresh}
        />
      )}
      
      {/* FORENSIC ANALYST VIEW */}
      {role === "FORENSIC_ANALYST" && (
        <ForensicView
          verifyEvidenceId={verifyEvidenceId}
          verifyHash={verifyHash}
          verifyResult={verifyResult}
          forensicEvidenceId={forensicEvidenceId}
          forensicText={forensicText}
          transferReportId={transferReportId}
          evidence={forensicQueue}
          setVerifyEvidenceId={setVerifyEvidenceId}
          setVerifyHash={setVerifyHash}
          setForensicEvidenceId={setForensicEvidenceId}
          setForensicText={setForensicText}
          setTransferReportId={setTransferReportId}
          verifyEvidence={handleVerifyEvidence}
          createForensicReport={handleCreateForensicReport}
          transferReportToCourt={handleTransferReportToCourt}
        />
      )}
      
      {/* COURT VIEW */}
      {role === "COURT" && <CourtView token={token!} />}
      
      {/* PUBLIC AUDITOR VIEW */}
      {role === "PUBLIC_AUDITOR" && <PublicAuditorView token={token!} />}
      
      {/* PUBLIC USER VIEW - WITH ALL TABS */}
      {role === "PUBLIC_USER" && (
        <>
          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("dashboard")}
              style={{
                background: activeTab === "dashboard" ? "#3b82f6" : "transparent",
                color: activeTab === "dashboard" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("fir")}
              style={{
                background: activeTab === "fir" ? "#3b82f6" : "transparent",
                color: activeTab === "fir" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              📝 File FIR
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              style={{
                background: activeTab === "drafts" ? "#3b82f6" : "transparent",
                color: activeTab === "drafts" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              💾 Drafts
            </button>
            <button
              onClick={() => setActiveTab("my-firs")}
              style={{
                background: activeTab === "my-firs" ? "#3b82f6" : "transparent",
                color: activeTab === "my-firs" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              📋 My FIRs
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              style={{
                background: activeTab === "documents" ? "#3b82f6" : "transparent",
                color: activeTab === "documents" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              📎 Documents
            </button>
            <button
              onClick={() => setActiveTab("share")}
              style={{
                background: activeTab === "share" ? "#3b82f6" : "transparent",
                color: activeTab === "share" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              👥 Share Case
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              style={{
                background: activeTab === "emergency" ? "#ef4444" : "transparent",
                color: activeTab === "emergency" ? "white" : "#ef4444",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              🚨 SOS
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              style={{
                background: activeTab === "feedback" ? "#3b82f6" : "transparent",
                color: activeTab === "feedback" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              💬 Feedback
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                background: activeTab === "profile" ? "#3b82f6" : "transparent",
                color: activeTab === "profile" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              👤 Profile
            </button>
            <button
              onClick={() => setActiveTab("help")}
              style={{
                background: activeTab === "help" ? "#3b82f6" : "transparent",
                color: activeTab === "help" ? "white" : "#64748b",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              ❓ Help
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === "dashboard" && <UserWidgets token={token!} onTabChange={setActiveTab} />}
          {activeTab === "fir" && <PublicUserView token={token!} initialDraft={draftData} onDraftSaved={() => setDraftData(null)} />}
          {activeTab === "drafts" && <FIRDraft token={token!} onLoadDraft={handleLoadDraft} />}
          {activeTab === "my-firs" && <PublicUserView token={token!} showMyFirsOnly={true} />}
          {activeTab === "documents" && <Documents token={token!} />}
          {activeTab === "share" && <CaseShare token={token!} cases={investigatorCases} />}
          {activeTab === "emergency" && <EmergencySOS token={token!} cases={investigatorCases} />}
          {activeTab === "feedback" && <Feedback token={token!} />}
          {activeTab === "profile" && <ProfilePage onTabChange={setActiveTab} />}
          {activeTab === "help" && <HelpCenter />}
        </>
      )}
    </main>
  );
}