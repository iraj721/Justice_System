// frontend/src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, getToken, getUser, logout } from "../../shared/services/auth";
import { apiRequest } from "../../shared/services/apiClient";
import { PublicUserView, InvestigatorView, ForensicView, CourtView, PublicAuditorView } from "../roles";
import { ROLE_INFO, type UserRole } from "../../app/roleConfig";
import { ProfilePage } from "../../features/dashboard/ProfilePage";
import { UserWidgets } from "../../features/dashboard/UserWidgets";
import { FIRDraft } from "../../features/dashboard/FIRDraft";
import { CaseShare } from "../../features/dashboard/CaseShare";
import { EmergencySOS } from "../../features/dashboard/EmergencySOS";
import { Documents } from "../../features/dashboard/Documents";
import { Feedback } from "../../features/dashboard/Feedback";
import { HelpCenter } from "../../features/dashboard/HelpCenter";

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
      // Silent fail
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

  const handleLoadDraft = (draft: any) => {
    setDraftData(draft);
    setActiveTab("fir");
  };

  if (loading) {
    return (
      <main className="container dashboard-page">
        <div className="card card-center">
          <h2>Loading dashboard...</h2>
        </div>
      </main>
    );
  }

  const roleInfo = role ? ROLE_INFO[role as UserRole] : null;

  return (
    <main className="container dashboard-page">
      <section className="dashboard-header">
        <div>
          <h1>🏛️ Justice Dashboard</h1>
          {user && <p className="dashboard-welcome">Welcome back, <strong>{user.full_name}</strong>!</p>}
          {(role === "INVESTIGATOR" || role === "FORENSIC_ANALYST") && (
            <p className="dashboard-meta">
              🔄 Auto-refreshing every {role === "INVESTIGATOR" ? "5" : "10"} seconds
            </p>
          )}
        </div>
        <div className="dashboard-actions">
          {(role === "INVESTIGATOR" || role === "FORENSIC_ANALYST") && (
            <button onClick={handleRefresh} className="btn btn-secondary">
              🔄 Refresh Now
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-danger">
            🚪 Logout
          </button>
        </div>
      </section>

      {message && (
        <div className="card alert alert-success">
          <p>{message}</p>
        </div>
      )}

      {roleInfo && (
        <div className="card dashboard-role-card">
          <p>
            <strong>🎭 Role:</strong> {roleInfo.name}
            <span className="dashboard-role-description">{roleInfo.description}</span>
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
      
      {/* PUBLIC USER VIEW */}
      {role === "PUBLIC_USER" && (
        <>
          <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
            <button className={activeTab === "dashboard" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("dashboard")} role="tab" aria-selected={activeTab === "dashboard"}>
              📊 Dashboard
            </button>
            <button className={activeTab === "fir" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("fir")} role="tab" aria-selected={activeTab === "fir"}>
              📝 File FIR
            </button>
            <button className={activeTab === "drafts" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("drafts")} role="tab" aria-selected={activeTab === "drafts"}>
              💾 Drafts
            </button>
            <button className={activeTab === "my-firs" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("my-firs")} role="tab" aria-selected={activeTab === "my-firs"}>
              📋 My FIRs
            </button>
            <button className={activeTab === "documents" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("documents")} role="tab" aria-selected={activeTab === "documents"}>
              📎 Documents
            </button>
            <button className={activeTab === "share" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("share")} role="tab" aria-selected={activeTab === "share"}>
              👥 Share Case
            </button>
            <button className={activeTab === "emergency" ? "dashboard-tab dashboard-tab-emergency" : "dashboard-tab"} onClick={() => setActiveTab("emergency")} role="tab" aria-selected={activeTab === "emergency"}>
              🚨 SOS
            </button>
            <button className={activeTab === "feedback" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("feedback")} role="tab" aria-selected={activeTab === "feedback"}>
              💬 Feedback
            </button>
            <button className={activeTab === "profile" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("profile")} role="tab" aria-selected={activeTab === "profile"}>
              👤 Profile
            </button>
            <button className={activeTab === "help" ? "dashboard-tab dashboard-tab-active" : "dashboard-tab"} onClick={() => setActiveTab("help")} role="tab" aria-selected={activeTab === "help"}>
              ❓ Help
            </button>
          </div>
          
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