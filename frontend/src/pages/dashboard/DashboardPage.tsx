// frontend/src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, getToken, getUser, logout } from "../../shared/services/auth";
import { apiRequest } from "../../shared/services/apiClient";
import {
  PublicUserView,
  InvestigatorView,
  ForensicView,
  CourtView,
} from "../../pages/roles";
import { ROLE_INFO, type UserRole } from "../../app/roleConfig";
import { ProfilePage } from "../roles/PublicUser/components/ProfilePage";
import { UserWidgets } from "../roles/PublicUser/components/UserWidgets";
import { FIRDraft } from "../roles/PublicUser/components/FIRDraft";
import { CaseShare } from "../roles/PublicUser/components/CaseShare";
import { EmergencySOS } from "../roles/PublicUser/components/EmergencySOS";
import { Documents } from "../roles/PublicUser/components/Documents";
import { Feedback } from "../roles/PublicUser/components/Feedback";
import { HelpCenter } from "../roles/PublicUser/components/HelpCenter";
import { Link } from "react-router-dom";
import { ReceivedMessages } from "../roles/PublicUser/components/ReceivedMessages";
import { CaseTracker } from "../roles/PublicUser/components/CaseTracker";
import { UserHearings } from "../roles/PublicUser/components/UserHearings";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userCases, setUserCases] = useState<CaseType[]>([]);

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
  const [investigatorEvidence, setInvestigatorEvidence] = useState<
    EvidenceType[]
  >([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Draft State
  const [draftData, setDraftData] = useState<any>(null);

  const loadRoleData = useCallback(async () => {
    if (!token || !role) return;

    try {
      if (role === "INVESTIGATOR") {
        const [firs, cases, evidence] = await Promise.all([
          apiRequest<FirType[]>("/fir/all", { token }).catch(() => []),
          apiRequest<CaseType[]>("/cases/investigator", { token }).catch(
            () => [],
          ),
          apiRequest<EvidenceType[]>("/cases/evidence/investigator", {
            token,
          }).catch(() => []),
        ]);
        setAllFirs(firs);
        setInvestigatorCases(cases);
        setInvestigatorEvidence(evidence);
      }

      if (role === "PUBLIC_USER") {
        try {
          const myFirs = await apiRequest<any[]>("/fir/my", { token }).catch(
            () => [],
          );
          const casesList = myFirs
            .filter((fir: any) => fir.case_id)
            .map((fir: any) => ({
              case_id: fir.case_id,
              case_number: fir.case_number || fir.case_id,
              title: fir.incident_title,
              status: fir.case_status || "UNDER_INVESTIGATION",
              description: fir.incident_description || "",
              fir_id: fir.fir_id,
            }));
          setUserCases(casesList);
          console.log("Loaded user cases:", casesList);
        } catch (err) {
          console.error("Error loading user cases:", err);
        }
      }

      if (role === "FORENSIC_ANALYST") {
        const queue = await apiRequest<ForensicQueueType[]>("/forensic/queue", {
          token,
        }).catch(() => []);
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
    setMessage("Data refreshed successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  async function handleVerifyEvidence() {
    if (!verifyEvidenceId || !verifyHash) {
      setVerifyResult("Please enter both Evidence ID and Hash");
      return;
    }

    try {
      const result = await apiRequest<{ verified: boolean }>(
        "/cases/evidence/verify",
        {
          method: "POST",
          token,
          body: { evidence_id: verifyEvidenceId, provided_hash: verifyHash },
        },
      );
      setVerifyResult(
        result.verified
          ? "✅ Hash verification passed! Evidence is authentic."
          : "❌ Hash verification failed! Evidence may be tampered.",
      );
    } catch (err) {
      setVerifyResult("Error verifying evidence");
    }
  }

  async function handleCreateForensicReport() {
    if (!forensicEvidenceId || !forensicText) {
      setMessage("Please fill all fields");
      setTimeout(() => setMessage(""), 3000);
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
          conclusion: forensicText,
        },
      });
      setMessage("Forensic report generated successfully!");
      setTimeout(() => setMessage(""), 3000);
      setForensicEvidenceId("");
      setForensicText("");
      await loadRoleData();
    } catch (err) {
      setMessage("Failed to generate report");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleTransferReportToCourt() {
    if (!transferReportId) {
      setMessage("Please enter Report ID");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest(`/forensic/transfer-court/${transferReportId}`, {
        method: "POST",
        token,
      });
      setMessage("Report transferred to court successfully!");
      setTimeout(() => setMessage(""), 3000);
      setTransferReportId("");
      await loadRoleData();
    } catch (err) {
      setMessage("Transfer failed");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const handleLoadDraft = (draft: any) => {
    setDraftData(draft);
    setActiveTab("fir");
    setSidebarOpen(false);
  };

  const getRoleIcon = (roleName: string | null) => {
    switch (roleName) {
      case "PUBLIC_USER":
        return "👤";
      case "INVESTIGATOR":
        return "👮";
      case "FORENSIC_ANALYST":
        return "🔬";
      case "COURT":
        return "⚖️";
      default:
        return "👤";
    }
  };

  const publicTabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "fir", label: "File FIR", icon: "📝" },
    { id: "drafts", label: "Drafts", icon: "💾" },
    { id: "my-firs", label: "My FIRs", icon: "📋" },
    { id: "track", label: "Track Case", icon: "🔍" },
    { id: "messages", label: "Messages", icon: "📬" },
    { id: "hearings", label: "Hearings", icon: "🎙️", badge: null },
    { id: "documents", label: "Documents", icon: "📎" },
    { id: "share", label: "Share Case", icon: "👥" },
    { id: "emergency", label: "SOS", icon: "🚨" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "help", label: "Help", icon: "❓" },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const roleInfo = role ? ROLE_INFO[role as UserRole] : null;
  const isPublicUser = role === "PUBLIC_USER";

  return (
    <div className="dashboard-page">
      {/* Background Effects */}
      <div className="dashboard-bg" />
      <div className="dashboard-grid" />
      <div className="dashboard-aura dashboard-aura-1" />
      <div className="dashboard-aura dashboard-aura-2" />
      <div className="dashboard-aura dashboard-aura-3" />

      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-left">
          <Link to="/" className="dashboard-logo">
            <div className="dashboard-logo-mark">⚖</div>
            <span className="dashboard-logo-text">Decentralized Justice</span>
          </Link>
        </div>
        <div className="dashboard-nav-links">
          <Link to="/" className="dashboard-nav-link">
            Home
          </Link>
          <Link to="/login" className="dashboard-nav-link">
            Login
          </Link>
          <Link to="/register" className="dashboard-nav-link">
            Register
          </Link>
          <Link to="/dashboard" className="dashboard-nav-link active">
            Dashboard
          </Link>
          <Link to="/explorer" className="dashboard-nav-link">
            Explorer
          </Link>
        </div>
        <div className="dashboard-nav-right">
          {(role === "INVESTIGATOR" || role === "FORENSIC_ANALYST") && (
            <button onClick={handleRefresh} className="dashboard-refresh-btn">
              ⟳ Refresh
            </button>
          )}
          <button onClick={handleLogout} className="dashboard-logout-btn">
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div className="dashboard-main-layout">
        {/* Left Sidebar - Only for Public User (Desktop) */}
        {isPublicUser && (
          <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="dashboard-sidebar-header">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="dashboard-user-details">
                  <span className="dashboard-user-name">
                    {user?.full_name || "User"}
                  </span>
                  <span className="dashboard-user-role">Public User</span>
                </div>
              </div>
            </div>

            <nav className="dashboard-sidebar-nav">
              {publicTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`dashboard-sidebar-item ${activeTab === tab.id ? "active" : ""} ${tab.id === "emergency" ? "emergency" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="sidebar-icon">{tab.icon}</span>
                  <span className="sidebar-label">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="dashboard-sidebar-footer">
              <div className="dashboard-sidebar-tip">
                <span>💡</span>
                <span>Need help?</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          className={`dashboard-main-content ${!isPublicUser ? "full-width" : ""}`}
        >
          {/* Mobile Bottom Navigation Bar - Only for Public User on Mobile */}
          {isPublicUser && (
            <div className="mobile-bottom-nav">
              <div className="mobile-bottom-nav-container">
                {publicTabs.slice(0, 5).map((tab) => (
                  <button
                    key={tab.id}
                    className={`mobile-nav-item ${activeTab === tab.id ? "active" : ""} ${tab.id === "emergency" ? "emergency" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="mobile-nav-icon">{tab.icon}</span>
                    <span className="mobile-nav-label">{tab.label}</span>
                  </button>
                ))}
                <button
                  className="mobile-nav-item more-btn"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <span className="mobile-nav-icon">📋</span>
                  <span className="mobile-nav-label">More</span>
                </button>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <div className="dashboard-welcome">
                <h1>
                  Welcome back,{" "}
                  <span>{user?.full_name || context?.full_name || "User"}</span>
                </h1>
                <p>
                  Manage your cases, track investigations, and access justice
                  services.
                </p>
              </div>
              <div className="dashboard-header-stats">
                <div className="header-stat">
                  <span className="header-stat-value">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="header-stat-label">Today</span>
                </div>
                <div className="header-stat">
                  <span className="header-stat-value">
                    {getRoleIcon(role)}{" "}
                    {roleInfo?.name || role?.replace(/_/g, " ")}
                  </span>
                  <span className="header-stat-label">Role</span>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="dashboard-toast">
              <span>✓ {message}</span>
            </div>
          )}

          {/* Role Views */}
          {role === "INVESTIGATOR" && (
            <div className="dashboard-role-container">
              <InvestigatorView
                token={token!}
                allFirs={allFirs}
                cases={investigatorCases}
                evidence={investigatorEvidence}
                onRefresh={handleRefresh}
              />
            </div>
          )}

          {role === "FORENSIC_ANALYST" && (
            <div className="dashboard-role-container">
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
            </div>
          )}

          {role === "COURT" && (
            <div className="dashboard-role-container">
              <CourtView token={token!} />
            </div>
          )}

          {role === "PUBLIC_USER" && (
            <div className="dashboard-content">
              {activeTab === "dashboard" && (
                <UserWidgets token={token!} onTabChange={setActiveTab} />
              )}
              {activeTab === "fir" && (
                <PublicUserView
                  token={token!}
                  initialDraft={draftData}
                  onDraftSaved={() => setDraftData(null)}
                />
              )}
              {activeTab === "drafts" && (
                <FIRDraft token={token!} onLoadDraft={handleLoadDraft} />
              )}
              {activeTab === "my-firs" && (
                <PublicUserView token={token!} showMyFirsOnly={true} />
              )}
              {activeTab === "messages" && <ReceivedMessages token={token!} />}
              {activeTab === "documents" && <Documents token={token!} />}
              {activeTab === "hearings" && <UserHearings token={token!} />}
              {activeTab === "share" && (
                <CaseShare token={token!} cases={investigatorCases} />
              )}
              {activeTab === "track" && (
                <CaseTracker token={token!} caseId={selectedCaseId} />
              )}
              {activeTab === "emergency" && (
                <EmergencySOS
                  token={token!}
                  cases={role === "PUBLIC_USER" ? userCases : investigatorCases}
                />
              )}
              {activeTab === "feedback" && <Feedback token={token!} />}
              {activeTab === "profile" && (
                <ProfilePage onTabChange={setActiveTab} />
              )}
              {activeTab === "help" && <HelpCenter />}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar (Slide from bottom) */}
      {isPublicUser && (
        <>
          <div className={`mobile-menu-panel ${sidebarOpen ? "open" : ""}`}>
            <div className="mobile-menu-header">
              <div className="mobile-menu-user">
                <div className="mobile-menu-avatar">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="mobile-menu-name">
                    {user?.full_name || "User"}
                  </div>
                  <div className="mobile-menu-role">Public User</div>
                </div>
              </div>
              <button
                className="mobile-menu-close"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-menu-items">
              {publicTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`mobile-menu-item ${activeTab === tab.id ? "active" : ""} ${tab.id === "emergency" ? "emergency" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="mobile-menu-icon">{tab.icon}</span>
                  <span className="mobile-menu-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          {sidebarOpen && (
            <div
              className="mobile-menu-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      <style>{`
        /* Dashboard Styles */
        .dashboard-page {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --border-light: rgba(255, 255, 255, 0.06);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          --sidebar-width: 280px;
          
          min-height: 100vh;
          background: var(--bg-deep);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text);
          position: relative;
        }

        /* Background Effects */
        .dashboard-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-aura-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: floatA 12s ease-in-out infinite;
        }

        .dashboard-aura-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: floatB 15s ease-in-out infinite reverse;
        }

        .dashboard-aura-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: -8%;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08), transparent);
          animation: floatC 18s ease-in-out infinite;
        }

        @keyframes floatA {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
        }
        @keyframes floatB {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.6; }
        }

        /* Top Navigation */
        .dashboard-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 72px;
          background: rgba(7, 9, 14, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-light);
        }

        .dashboard-nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dashboard-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.3s;
        }

        .dashboard-logo:hover {
          transform: translateY(-1px);
        }

        .dashboard-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          border-radius: 6px;
        }

        .dashboard-logo-text {
          font-family: 'Syne', sans-serif;
          background: linear-gradient(135deg, #e8ecf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.3px;
        }

        .dashboard-nav-links {
          display: flex;
          gap: 2rem;
        }

        .dashboard-nav-link {
          text-decoration: none;
          color: #7a849c;
          font-size: 0.83rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .dashboard-nav-link:hover,
        .dashboard-nav-link.active {
          color: #e8ecf8;
        }

        .dashboard-nav-right {
          display: flex;
          gap: 8px;
        }

        .dashboard-refresh-btn {
          padding: 8px 16px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .dashboard-refresh-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          transform: translateY(-1px);
        }

        .dashboard-logout-btn {
          padding: 8px 18px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.82rem;
          font-weight: 500;
        }

        .dashboard-logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        /* Main Layout */
        .dashboard-main-layout {
          display: flex;
          min-height: calc(100vh - 72px);
          position: relative;
          z-index: 10;
        }

        /* Desktop Sidebar */
        .dashboard-sidebar {
          width: var(--sidebar-width);
          background: rgba(12, 15, 26, 0.8);
          backdrop-filter: blur(16px);
          border-right: 1px solid rgba(99, 102, 241, 0.12);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 72px;
          height: calc(100vh - 72px);
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            display: none;
          }
        }

        .dashboard-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .dashboard-sidebar::-webkit-scrollbar-track {
          background: rgba(99, 102, 241, 0.1);
        }

        .dashboard-sidebar::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 3px;
        }

        .dashboard-sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .dashboard-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-user-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
        }

        .dashboard-user-details {
          display: flex;
          flex-direction: column;
        }

        .dashboard-user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .dashboard-user-role {
          font-size: 0.7rem;
          color: #818cf8;
        }

        .dashboard-sidebar-nav {
          flex: 1;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dashboard-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #7a849c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .dashboard-sidebar-item:hover {
          background: rgba(99, 102, 241, 0.08);
          color: #e8ecf8;
          transform: translateX(4px);
        }

        .dashboard-sidebar-item.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          color: #818cf8;
        }

        .dashboard-sidebar-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: #6366f1;
          border-radius: 0 3px 3px 0;
        }

        .sidebar-icon {
          font-size: 1.2rem;
          width: 28px;
        }

        .sidebar-label {
          flex: 1;
        }

        .dashboard-sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .dashboard-sidebar-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 10px;
          font-size: 0.75rem;
          color: #7a849c;
        }

        /* Main Content */
        .dashboard-main-content {
          flex: 1;
          overflow-x: hidden;
          transition: all 0.3s;
          padding-bottom: 80px; /* Space for mobile bottom nav */
        }

        @media (min-width: 769px) {
          .dashboard-main-content {
            padding-bottom: 0;
          }
        }

        .dashboard-main-content.full-width {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Mobile Bottom Navigation */
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 90;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(99, 102, 241, 0.2);
          padding: 8px 16px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        .mobile-bottom-nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 8px;
        }

        .mobile-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          padding: 8px 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #7a849c;
        }

        .mobile-nav-item.active {
          color: #818cf8;
          background: rgba(99, 102, 241, 0.1);
        }

        .mobile-nav-item.emergency {
          color: #f87171;
        }

        .mobile-nav-item.emergency.active {
          background: rgba(239, 68, 68, 0.1);
        }

        .mobile-nav-icon {
          font-size: 1.3rem;
        }

        .mobile-nav-label {
          font-size: 0.7rem;
          font-weight: 500;
        }

        .more-btn {
          position: relative;
        }

        /* Mobile Menu Panel (Slide from bottom) */
        .mobile-menu-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(12, 15, 26, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 200;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.5);
        }

        .mobile-menu-panel.open {
          transform: translateY(0);
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .mobile-menu-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-menu-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
        }

        .mobile-menu-name {
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .mobile-menu-role {
          font-size: 0.75rem;
          color: #818cf8;
        }

        .mobile-menu-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .mobile-menu-close:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #e8ecf8;
        }

        .mobile-menu-items {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: #7a849c;
        }

        .mobile-menu-item.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
          color: #818cf8;
        }

        .mobile-menu-item.emergency {
          color: #f87171;
        }

        .mobile-menu-item.emergency.active {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .mobile-menu-icon {
          font-size: 1.2rem;
        }

        .mobile-menu-label {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 199;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Header */
        .dashboard-header {
          padding: 2rem 2rem 0 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem 1rem 0 1rem;
          }
        }

        .dashboard-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-light);
        }

        @media (max-width: 768px) {
          .dashboard-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }

        .dashboard-welcome h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        @media (max-width: 768px) {
          .dashboard-welcome h1 {
            font-size: 1.4rem;
          }
        }

        .dashboard-welcome h1 span {
          background: linear-gradient(135deg, #6366f1, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-welcome p {
          color: #7a849c;
          font-size: 0.88rem;
        }

        .dashboard-auto-refresh {
          color: #818cf8;
          font-size: 0.72rem;
          margin-top: 6px;
        }

        .dashboard-header-stats {
          display: flex;
          gap: 12px;
        }

        .header-stat {
          background: rgba(12, 15, 26, 0.6);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 18px;
          text-align: center;
          transition: all 0.3s;
        }

        @media (max-width: 480px) {
          .header-stat {
            padding: 6px 12px;
          }
        }

        .header-stat:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
        }

        .header-stat-value {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
        }

        .header-stat-label {
          font-size: 0.68rem;
          color: #3d4459;
        }

        /* Content Area */
        .dashboard-content {
          padding: 0 2rem 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 0 1rem 1rem;
          }
        }

        .dashboard-role-container {
          padding: 0 2rem 2rem;
        }

        @media (max-width: 768px) {
          .dashboard-role-container {
            padding: 1rem;
          }
        }

        /* Toast */
        .dashboard-toast {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 8px;
          color: #10b981;
          font-size: 0.85rem;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Loading */
        .dashboard-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep);
          gap: 16px;
        }

        .dashboard-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-nav-links {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .dashboard-nav {
            padding: 0 1rem;
            height: 64px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-nav-right {
            gap: 4px;
          }

          .dashboard-logout-btn, 
          .dashboard-refresh-btn {
            padding: 6px 10px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
