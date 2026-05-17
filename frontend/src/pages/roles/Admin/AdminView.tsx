// frontend/src/pages/roles/Admin/AdminView.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/services/apiClient";

// ============ TYPE DEFINITIONS ============
type User = {
  email: string;
  full_name: string;
  user_id?: string;
  role?: string;
  phone_number?: string;
  created_at?: string;
};

type FIR = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  incident_description: string;
  incident_location: string;
  complainant_name: string;
  complainant_contact: string;
  complainant_email: string;
  status: string;
  created_at: string;
  case_id?: string;
  case_number?: string;
};

type Case = {
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  investigator_name: string;
  investigator_email: string;
  created_at: string;
  evidence_count?: number;
};

type Evidence = {
  evidence_id: string;
  title: string;
  description: string;
  case_id: string;
  hash: string;
  cloudinary_url: string;
  status: string;
  created_at: string;
  created_by: string;
};

type Judgment = {
  judgment_id: string;
  judgment_number: string;
  case_id: string;
  case_number: string;
  case_title: string;
  verdict: string;
  sentence: string;
  judge_name: string;
  created_at: string;
};

type Feedback = {
  feedback_id: string;
  user_email: string;
  user_name: string;
  category: string;
  subject: string;
  message: string;
  rating: number;
  created_at: string;
};

type SystemStats = {
  total_users: number;
  total_firs: number;
  total_cases: number;
  total_evidence: number;
  total_judgments: number;
  total_feedback: number;
  users_by_role: Record<string, number>;
  firs_by_status: Record<string, number>;
  cases_by_status: Record<string, number>;
};

type FIRDetailResponse = {
  fir: FIR;
  case: Case | null;
  evidence: Evidence[];
};

// ============ COMPONENT ============
export function AdminView({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newRole, setNewRole] = useState("");

  // FIRs
  const [firs, setFirs] = useState<FIR[]>([]);
  const [selectedFir, setSelectedFir] = useState<FIRDetailResponse | null>(
    null,
  );
  const [showFirModal, setShowFirModal] = useState(false);
  const [firStatus, setFirStatus] = useState("");
  const [firRemarks, setFirRemarks] = useState("");

  // Cases
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseStatus, setCaseStatus] = useState("");

  // Evidence
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null,
  );
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Judgments
  const [judgments, setJudgments] = useState<Judgment[]>([]);

  // Feedback
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal for Delete Confirmation
  const [deleteModal, setDeleteModal] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [
        statsData,
        usersData,
        firsData,
        casesData,
        evidenceData,
        judgmentsData,
        feedbackData,
      ] = await Promise.all([
        apiRequest<SystemStats>("/admin/stats", { token }).catch(() => null),
        apiRequest<User[]>("/admin/users", { token }).catch(() => []),
        apiRequest<FIR[]>("/admin/firs", { token }).catch(() => []),
        apiRequest<Case[]>("/admin/cases", { token }).catch(() => []),
        apiRequest<Evidence[]>("/admin/evidence", { token }).catch(() => []),
        apiRequest<Judgment[]>("/admin/judgments", { token }).catch(() => []),
        apiRequest<Feedback[]>("/admin/feedback", { token }).catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setFirs(firsData);
      setCases(casesData);
      setEvidence(evidenceData);
      setJudgments(judgmentsData);
      setFeedback(feedbackData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setMessage("❌ Failed to load dashboard data");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(email: string, role: string) {
    try {
      await apiRequest(`/admin/users/${email}/role?role=${role}`, {
        method: "PUT",
        token,
      });
      setMessage(`✅ User role updated to ${role}`);
      loadDashboardData();
      setShowUserModal(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update user role");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteUser(email: string) {
    try {
      await apiRequest(`/admin/users/${email}`, { method: "DELETE", token });
      setMessage(`✅ User ${email} deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete user");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function updateFIRStatus(
    firId: string,
    status: string,
    remarks: string,
  ) {
    try {
      await apiRequest(
        `/admin/firs/${firId}/status?status=${status}&remarks=${encodeURIComponent(remarks)}`,
        { method: "PUT", token },
      );
      setMessage(`✅ FIR status updated to ${status}`);
      loadDashboardData();
      setShowFirModal(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update FIR status");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteFIR(firId: string) {
    try {
      await apiRequest(`/admin/firs/${firId}`, { method: "DELETE", token });
      setMessage(`✅ FIR deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete FIR");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function updateCaseStatus(caseId: string, status: string) {
    try {
      await apiRequest(`/admin/cases/${caseId}/status?status=${status}`, {
        method: "PUT",
        token,
      });
      setMessage(`✅ Case status updated to ${status}`);
      loadDashboardData();
      setShowCaseModal(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to update case status");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteCase(caseId: string) {
    try {
      await apiRequest(`/admin/cases/${caseId}`, { method: "DELETE", token });
      setMessage(`✅ Case deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete case");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteEvidence(evidenceId: string) {
    try {
      await apiRequest(`/admin/evidence/${evidenceId}`, {
        method: "DELETE",
        token,
      });
      setMessage(`✅ Evidence deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete evidence");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteJudgment(judgmentId: string) {
    try {
      await apiRequest(`/admin/judgments/${judgmentId}`, {
        method: "DELETE",
        token,
      });
      setMessage(`✅ Judgment deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete judgment");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteFeedback(feedbackId: string) {
    try {
      await apiRequest(`/admin/feedback/${feedbackId}`, {
        method: "DELETE",
        token,
      });
      setMessage(`✅ Feedback deleted successfully`);
      loadDashboardData();
      setDeleteModal(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete feedback");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function viewFirDetails(firId: string) {
    try {
      const data = await apiRequest<FIRDetailResponse>(
        `/admin/fir-details/${firId}`,
        { token },
      );
      setSelectedFir(data);
      setFirStatus(data.fir.status);
      setFirRemarks("");
      setShowFirModal(true);
    } catch (err) {
      setMessage("❌ Failed to load FIR details");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function getStatusBadge(status: string) {
    if (!status) {
      return <span className="status-badge status-unknown">UNKNOWN</span>;
    }
    const colors: Record<string, string> = {
      SUBMITTED: "#f59e0b",
      UNDER_REVIEW: "#3b82f6",
      ACCEPTED: "#10b981",
      REJECTED: "#ef4444",
      UNDER_INVESTIGATION: "#8b5cf6",
      SUBMITTED_TO_COURT: "#f59e0b",
      DECIDED: "#10b981",
    };
    return (
      <span
        className="status-badge"
        style={{
          background: `${colors[status] || "#64748b"}20`,
          color: colors[status] || "#64748b",
        }}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#10b981",
    };
    if (!priority) return <span className="priority-badge">N/A</span>;
    return (
      <span
        className="priority-badge"
        style={{
          background: `${colors[priority] || "#64748b"}20`,
          color: colors[priority] || "#64748b",
        }}
      >
        {priority}
      </span>
    );
  }

  function getVerdictBadge(verdict: string) {
    const colors: Record<string, string> = {
      GUILTY: "#ef4444",
      NOT_GUILTY: "#10b981",
      ACQUITTED: "#3b82f6",
      CONVICTED: "#ef4444",
    };
    if (!verdict) return <span className="verdict-badge">N/A</span>;
    return (
      <span
        className="verdict-badge"
        style={{
          background: `${colors[verdict] || "#64748b"}20`,
          color: colors[verdict] || "#64748b",
        }}
      >
        {verdict}
      </span>
    );
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      COMPLAINT: "⚠️",
      SUGGESTION: "💡",
      APPRECIATION: "👍",
      BUG: "🐛",
    };
    return icons[category] || "📝";
  }

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    if (!term) {
      if (activeTab === "users") return users;
      if (activeTab === "firs") return firs;
      if (activeTab === "cases") return cases;
      if (activeTab === "evidence") return evidence;
      if (activeTab === "judgments") return judgments;
      if (activeTab === "feedback") return feedback;
      return [];
    }
    if (activeTab === "users")
      return users.filter(
        (u) =>
          u.email?.toLowerCase().includes(term) ||
          u.full_name?.toLowerCase().includes(term),
      );
    if (activeTab === "firs")
      return firs.filter(
        (f) =>
          f.fir_number?.toLowerCase().includes(term) ||
          f.complainant_name?.toLowerCase().includes(term) ||
          f.incident_title?.toLowerCase().includes(term),
      );
    if (activeTab === "cases")
      return cases.filter(
        (c) =>
          c.case_number?.toLowerCase().includes(term) ||
          c.title?.toLowerCase().includes(term) ||
          c.investigator_name?.toLowerCase().includes(term),
      );
    if (activeTab === "evidence")
      return evidence.filter(
        (e) =>
          e.title?.toLowerCase().includes(term) ||
          e.evidence_id?.toLowerCase().includes(term),
      );
    if (activeTab === "judgments")
      return judgments.filter(
        (j) =>
          j.judgment_number?.toLowerCase().includes(term) ||
          j.case_number?.toLowerCase().includes(term),
      );
    if (activeTab === "feedback")
      return feedback.filter(
        (f) =>
          f.subject?.toLowerCase().includes(term) ||
          f.user_email?.toLowerCase().includes(term) ||
          f.user_name?.toLowerCase().includes(term),
      );
    return [];
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", badge: null },
    { id: "users", label: "Users", icon: "👥", badge: users.length },
    { id: "firs", label: "FIRs", icon: "📋", badge: firs.length },
    { id: "cases", label: "Cases", icon: "⚖️", badge: cases.length },
    { id: "evidence", label: "Evidence", icon: "📦", badge: evidence.length },
    {
      id: "judgments",
      label: "Judgments",
      icon: "📜",
      badge: judgments.length,
    },
    { id: "feedback", label: "Feedback", icon: "💬", badge: feedback.length },
  ];

  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "firs", label: "FIRs", icon: "📋" },
    { id: "cases", label: "Cases", icon: "⚖️" },
    { id: "evidence", label: "Evidence", icon: "📦" },
  ];

  const filteredData = getFilteredData();

    // Pagination logic
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return renderUsers();
      case "firs":
        return renderFIRs();
      case "cases":
        return renderCases();
      case "evidence":
        return renderEvidence();
      case "judgments":
        return renderJudgments();
      case "feedback":
        return renderFeedback();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (!stats) return null;
    return (
      <div className="admin-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats.total_firs}</div>
            <div className="stat-label">Total FIRs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-value">{stats.total_cases}</div>
            <div className="stat-label">Total Cases</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{stats.total_evidence}</div>
            <div className="stat-label">Total Evidence</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📜</div>
            <div className="stat-value">{stats.total_judgments}</div>
            <div className="stat-label">Total Judgments</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-value">{stats.total_feedback}</div>
            <div className="stat-label">Total Feedback</div>
          </div>
        </div>
        <div className="two-columns">
          <div className="info-card">
            <h3>👥 Users by Role</h3>
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <div key={role}>
                <span>{role.replace(/_/g, " ")}</span>
                <span>{count}</span>
                <div className="progress-bar">
                  <div
                    style={{ width: `${(count / stats.total_users) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="info-card">
            <h3>📋 FIRs by Status</h3>
            {Object.entries(stats.firs_by_status).map(([status, count]) => (
              <div key={status}>
                <span>{status.replace(/_/g, " ")}</span>
                <span>{count}</span>
                <div className="progress-bar">
                  <div
                    style={{ width: `${(count / stats.total_firs) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="info-card">
          <h3>⚖️ Cases by Status</h3>
          {Object.entries(stats.cases_by_status).map(([status, count]) => (
            <div key={status}>
              <span>{status.replace(/_/g, " ")}</span>
              <span>{count}</span>
              <div className="progress-bar">
                <div
                  style={{ width: `${(count / stats.total_cases) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((user: any) => (
              <tr key={user.email}>
                <td data-label="Email">{user.email}</td>
                <td data-label="Full Name">{user.full_name || "—"}</td>
                <td data-label="Role">
                  {getStatusBadge(user.role || "PUBLIC_USER")}
                </td>
                <td data-label="User ID">
                  <code>{user.user_id?.substring(0, 8)}...</code>
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.role || "PUBLIC_USER");
                      setShowUserModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "user",
                        id: user.email,
                        name: user.email,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                      {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages} ({filteredData.length} items)
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
        {filteredData.length === 0 && (
          <div className="empty-state">No users found</div>
        )}
      </div>
    </div>
  );

  const renderFIRs = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FIR Number</th>
              <th>Complainant</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((fir: any) => (
              <tr key={fir.fir_id}>
                <td data-label="FIR Number">
                  <code>{fir.fir_number}</code>
                </td>
                <td data-label="Complainant">{fir.complainant_name}</td>
                <td data-label="Title">
                  {fir.incident_title?.substring(0, 40)}...
                </td>
                <td data-label="Status">{getStatusBadge(fir.status)}</td>
                <td data-label="Created">
                  {new Date(fir.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn"
                    onClick={() => viewFirDetails(fir.fir_id)}
                  >
                    👁️
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "fir",
                        id: fir.fir_id,
                        name: fir.fir_number,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} items)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        {paginatedData.length === 0 && (
          <div className="empty-state">No FIRs found</div>
        )}
      </div>
    </div>
  );

  const renderCases = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Investigator</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((caseItem: any) => (
              <tr key={caseItem.case_id}>
                <td data-label="Case Number">
                  <code>{caseItem.case_number}</code>
                </td>
                <td data-label="Title">
                  {caseItem.title?.substring(0, 40)}...
                </td>
                <td data-label="Status">{getStatusBadge(caseItem.status)}</td>
                <td data-label="Priority">
                  {getPriorityBadge(caseItem.priority)}
                </td>
                <td data-label="Investigator">
                  {caseItem.investigator_name || caseItem.investigator_email}
                </td>
                <td data-label="Created">
                  {new Date(caseItem.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedCase(caseItem);
                      setCaseStatus(caseItem.status);
                      setShowCaseModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "case",
                        id: caseItem.case_id,
                        name: caseItem.case_number,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} items)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        {paginatedData.length === 0 && (
          <div className="empty-state">No cases found</div>
        )}
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Evidence ID</th>
              <th>Case ID</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((ev: any) => (
              <tr key={ev.evidence_id}>
                <td data-label="Title">
                  <strong>{ev.title}</strong>
                  <br />
                  <small>{ev.description?.substring(0, 40)}...</small>
                </td>
                <td data-label="Evidence ID">
                  <code>{ev.evidence_id?.substring(0, 8)}...</code>
                </td>
                <td data-label="Case ID">
                  <code>{ev.case_id?.substring(0, 8)}...</code>
                </td>
                <td data-label="Status">{getStatusBadge(ev.status)}</td>
                <td data-label="Created By">{ev.created_by}</td>
                <td data-label="Created">
                  {new Date(ev.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedEvidence(ev);
                      setShowEvidenceModal(true);
                    }}
                  >
                    👁️
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "evidence",
                        id: ev.evidence_id,
                        name: ev.title,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} items)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        {paginatedData.length === 0 && (
          <div className="empty-state">No evidence found</div>
        )}
      </div>
    </div>
  );

  const renderJudgments = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Judgment #</th>
              <th>Case</th>
              <th>Verdict</th>
              <th>Judge</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((judgment: any) => (
              <tr key={judgment.judgment_id}>
                <td data-label="Judgment #">
                  <code>{judgment.judgment_number}</code>
                </td>
                <td data-label="Case">
                  {judgment.case_number} -{" "}
                  {judgment.case_title?.substring(0, 30)}
                </td>
                <td data-label="Verdict">
                  {getVerdictBadge(judgment.verdict)}
                </td>
                <td data-label="Judge">{judgment.judge_name}</td>
                <td data-label="Created">
                  {new Date(judgment.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "judgment",
                        id: judgment.judgment_id,
                        name: judgment.judgment_number,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} items)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        {paginatedData.length === 0 && (
          <div className="empty-state">No judgments found</div>
        )}
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="admin-section">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Rating</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((fb: any) => (
              <tr key={fb.feedback_id}>
                <td data-label="User">
                  {fb.user_name}
                  <br />
                  <small>{fb.user_email}</small>
                </td>
                <td data-label="Category">
                  <span className="category-badge">
                    {getCategoryIcon(fb.category)} {fb.category}
                  </span>
                </td>
                <td data-label="Subject">{fb.subject?.substring(0, 40)}...</td>
                <td data-label="Rating" className="rating-cell">
                  {fb.rating > 0 ? "⭐".repeat(fb.rating) : "—"}
                </td>
                <td data-label="Created">
                  {new Date(fb.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions" className="action-btns">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedFeedback(fb);
                      setShowFeedbackModal(true);
                    }}
                  >
                    👁️
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      setDeleteModal({
                        type: "feedback",
                        id: fb.feedback_id,
                        name: fb.subject,
                      })
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} items)
            </span>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
        {paginatedData.length === 0 && (
          <div className="empty-state">No feedback found</div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard">
        <div className="dashboard-bg" />
        <div className="dashboard-grid" />
        <div className="dashboard-aura dashboard-aura-1" />
        <div className="dashboard-aura dashboard-aura-2" />
        <div className="dashboard-aura dashboard-aura-3" />

        <nav className="dashboard-nav">
          <div className="dashboard-nav-left">
            <div className="dashboard-logo">
              <div className="dashboard-logo-mark">⚙️</div>
              <span className="dashboard-logo-text">Admin Portal</span>
            </div>
            <button
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <div className="dashboard-nav-right">
            <button
              onClick={loadDashboardData}
              className="dashboard-refresh-btn"
            >
              ⟳ Refresh
            </button>
          </div>
        </nav>

        <div className="dashboard-main-layout">
          <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="dashboard-sidebar-header">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">👑</div>
                <div>
                  <div className="dashboard-user-name">Administrator</div>
                  <div className="dashboard-user-role">System Admin</div>
                </div>
              </div>
            </div>
            <nav className="dashboard-sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`dashboard-sidebar-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="dashboard-sidebar-footer">
              <div className="dashboard-sidebar-tip">
                <span>💡</span>
                <span>System Administration Panel</span>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="dashboard-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="dashboard-main-content">
            <div className="mobile-bottom-nav">
              <div className="mobile-bottom-nav-container">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-header">
              <div>
                <h1>
                  Admin <span>Dashboard</span>
                </h1>
                <p>Manage users, cases, evidence, and system configurations</p>
              </div>
              <div className="dashboard-header-stats">
                <div>
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>Today</span>
                </div>
                <div>
                  <span>👑 Admin</span>
                  <span>Role</span>
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`admin-toast ${message.includes("✅") ? "toast-success" : "toast-error"}`}
              >
                {message}
              </div>
            )}

            <div className="admin-search-bar">
              <div>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder={`Search ${navItems.find((i) => i.id === activeTab)?.label || "items"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {renderContent()}
          </main>
        </div>

        <div className={`mobile-menu-panel ${sidebarOpen ? "open" : ""}`}>
          <div>
            <div>
              <div>👑</div>
              <div>
                <div>Administrator</div>
                <div>System Admin</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`mobile-menu-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span>{item.badge}</span>
                )}
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

        {/* MODALS */}
        {showUserModal && selectedUser && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3>✏️ Update User Role</h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <p>
                  <strong>User:</strong> {selectedUser.email} (
                  {selectedUser.full_name})
                </p>
                <div>
                  <label>Current Role:</label>{" "}
                  {getStatusBadge(selectedUser.role || "PUBLIC_USER")}
                </div>
                <div>
                  <label>New Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="PUBLIC_USER">PUBLIC_USER</option>
                    <option value="INVESTIGATOR">INVESTIGATOR</option>
                    <option value="FORENSIC_ANALYST">FORENSIC_ANALYST</option>
                    <option value="COURT">COURT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserRole(selectedUser.email, newRole)}
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        )}

        {showFirModal && selectedFir && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowFirModal(false);
              setSelectedFir(null);
            }}
          >
            <div
              className="modal modal-large"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3>📋 FIR Details: {selectedFir.fir.fir_number}</h3>
                <button
                  onClick={() => {
                    setShowFirModal(false);
                    setSelectedFir(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <div>
                  <h4>FIR Information</h4>
                  <div>
                    <div>
                      <strong>FIR Number:</strong> {selectedFir.fir.fir_number}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedFir.fir.status)}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {new Date(selectedFir.fir.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h4>Complainant Details</h4>
                  <div>
                    <div>
                      <strong>Name:</strong> {selectedFir.fir.complainant_name}
                    </div>
                    <div>
                      <strong>Contact:</strong>{" "}
                      {selectedFir.fir.complainant_contact}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {selectedFir.fir.complainant_email}
                    </div>
                  </div>
                </div>
                <div>
                  <h4>Incident Details</h4>
                  <div>
                    <strong>Title:</strong> {selectedFir.fir.incident_title}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {selectedFir.fir.incident_description}
                  </div>
                  <div>
                    <strong>Location:</strong>{" "}
                    {selectedFir.fir.incident_location}
                  </div>
                </div>
                {selectedFir.case && (
                  <div>
                    <h4>Associated Case</h4>
                    <div>
                      <div>
                        <strong>Case Number:</strong>{" "}
                        {selectedFir.case.case_number}
                      </div>
                      <div>
                        <strong>Title:</strong> {selectedFir.case.title}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {getStatusBadge(selectedFir.case.status)}
                      </div>
                      <div>
                        <strong>Investigator:</strong>{" "}
                        {selectedFir.case.investigator_name}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label>Update Status</label>
                  <select
                    value={firStatus}
                    onChange={(e) => setFirStatus(e.target.value)}
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label>Remarks (Optional)</label>
                  <textarea
                    value={firRemarks}
                    onChange={(e) => setFirRemarks(e.target.value)}
                    rows={2}
                    placeholder="Add remarks..."
                  />
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowFirModal(false);
                    setSelectedFir(null);
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    updateFIRStatus(
                      selectedFir.fir.fir_id,
                      firStatus,
                      firRemarks,
                    )
                  }
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {showCaseModal && selectedCase && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowCaseModal(false);
              setSelectedCase(null);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3>✏️ Update Case Status</h3>
                <button
                  onClick={() => {
                    setShowCaseModal(false);
                    setSelectedCase(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <p>
                  <strong>Case:</strong> {selectedCase.case_number} -{" "}
                  {selectedCase.title}
                </p>
                <div>
                  <label>Current Status:</label>{" "}
                  {getStatusBadge(selectedCase.status)}
                </div>
                <div>
                  <label>New Status *</label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                  >
                    <option value="UNDER_INVESTIGATION">
                      UNDER_INVESTIGATION
                    </option>
                    <option value="SUBMITTED_TO_COURT">
                      SUBMITTED_TO_COURT
                    </option>
                    <option value="DECIDED">DECIDED</option>
                  </select>
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowCaseModal(false);
                    setSelectedCase(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateCaseStatus(selectedCase.case_id, caseStatus)
                  }
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {showEvidenceModal && selectedEvidence && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowEvidenceModal(false);
              setSelectedEvidence(null);
            }}
          >
            <div
              className="modal modal-large"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3>📦 Evidence Details</h3>
                <button
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setSelectedEvidence(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <div>
                  <div>
                    <strong>Title:</strong> {selectedEvidence.title}
                  </div>
                  <div>
                    <strong>Evidence ID:</strong>{" "}
                    <code>{selectedEvidence.evidence_id}</code>
                  </div>
                  <div>
                    <strong>Description:</strong> {selectedEvidence.description}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedEvidence.status)}
                  </div>
                  <div>
                    <strong>Created By:</strong> {selectedEvidence.created_by}
                  </div>
                  <div>
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedEvidence.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Hash:</strong> <code>{selectedEvidence.hash}</code>
                  </div>
                  <div>
                    <strong>Cloudinary URL:</strong>{" "}
                    <a href={selectedEvidence.cloudinary_url} target="_blank">
                      View Document ↗
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setSelectedEvidence(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showFeedbackModal && selectedFeedback && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowFeedbackModal(false);
              setSelectedFeedback(null);
            }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3>💬 Feedback Details</h3>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div>
                <div>
                  <div>
                    <strong>From:</strong> {selectedFeedback.user_name} (
                    {selectedFeedback.user_email})
                  </div>
                  <div>
                    <strong>Category:</strong>{" "}
                    {getCategoryIcon(selectedFeedback.category)}{" "}
                    {selectedFeedback.category}
                  </div>
                  <div>
                    <strong>Rating:</strong>{" "}
                    {selectedFeedback.rating > 0
                      ? "⭐".repeat(selectedFeedback.rating)
                      : "Not rated"}
                  </div>
                  <div>
                    <strong>Subject:</strong> {selectedFeedback.subject}
                  </div>
                  <div>
                    <strong>Message:</strong>{" "}
                    <div>{selectedFeedback.message}</div>
                  </div>
                  <div>
                    <strong>Submitted:</strong>{" "}
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3>⚠️ Confirm Delete</h3>
                <button onClick={() => setDeleteModal(null)}>✕</button>
              </div>
              <div>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{deleteModal.name}</strong>?
                </p>
                <p>This action cannot be undone.</p>
              </div>
              <div>
                <button onClick={() => setDeleteModal(null)}>Cancel</button>
                <button
                  onClick={() => {
                    if (deleteModal.type === "user") deleteUser(deleteModal.id);
                    else if (deleteModal.type === "fir")
                      deleteFIR(deleteModal.id);
                    else if (deleteModal.type === "case")
                      deleteCase(deleteModal.id);
                    else if (deleteModal.type === "evidence")
                      deleteEvidence(deleteModal.id);
                    else if (deleteModal.type === "judgment")
                      deleteJudgment(deleteModal.id);
                    else if (deleteModal.type === "feedback")
                      deleteFeedback(deleteModal.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .admin-dashboard {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --border-light: rgba(255, 255, 255, 0.06);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          --sidebar-width: 280px;
          --header-height: 72px;
          min-height: 100vh;
          background: var(--bg-deep);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text);
          position: relative;
          overflow-x: hidden;
        }

        .dashboard-bg { position: fixed; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99,102,241,0.08), transparent 60%); pointer-events: none; z-index: 0; }
        .dashboard-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%); pointer-events: none; z-index: 0; }
        .dashboard-aura { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; animation: float 12s ease-in-out infinite; }
        .dashboard-aura-1 { width: 500px; height: 500px; top: -150px; left: 50%; transform: translateX(-50%); background: radial-gradient(circle, rgba(99,102,241,0.15), transparent); }
        .dashboard-aura-2 { width: 350px; height: 350px; bottom: 10%; right: -5%; background: radial-gradient(circle, rgba(99,102,241,0.1), transparent); animation-delay: -4s; }
        .dashboard-aura-3 { width: 300px; height: 300px; top: 40%; left: -8%; background: radial-gradient(circle, rgba(129,140,248,0.08), transparent); animation-delay: -8s; }
        @keyframes float { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.05); opacity: 0.7; } }

        .admin-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
        .admin-spinner { width: 48px; height: 48px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dashboard-nav { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: var(--header-height); background: rgba(7,9,14,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-light); }
        .dashboard-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .dashboard-logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border-radius: 6px; }
        .dashboard-logo-text { font-family: 'Syne', sans-serif; background: linear-gradient(135deg, #e8ecf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1.1rem; }
        .mobile-menu-toggle { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 8px; }
        .mobile-menu-toggle span { width: 24px; height: 2px; background: #e8ecf8; border-radius: 2px; }
        .dashboard-refresh-btn { padding: 8px 16px; border-radius: 6px; background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); cursor: pointer; font-size: 0.8rem; font-weight: 500; }

        .dashboard-main-layout { display: flex; min-height: calc(100vh - var(--header-height)); }
        .dashboard-sidebar { width: var(--sidebar-width); background: rgba(12,15,26,0.8); backdrop-filter: blur(16px); border-right: 1px solid rgba(99,102,241,0.12); position: sticky; top: var(--header-height); height: calc(100vh - var(--header-height)); overflow-y: auto; }
        .dashboard-sidebar-header { padding: 24px 20px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .dashboard-user-info { display: flex; align-items: center; gap: 12px; }
        .dashboard-user-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .dashboard-user-name { font-size: 0.9rem; font-weight: 600; }
        .dashboard-user-role { font-size: 0.7rem; color: #818cf8; }
        .dashboard-sidebar-nav { padding: 20px 12px; display: flex; flex-direction: column; gap: 6px; }
        .dashboard-sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: transparent; border: none; border-radius: 10px; color: #7a849c; font-size: 0.85rem; font-weight: 500; cursor: pointer; width: 100%; text-align: left; transition: all 0.3s; }
        .dashboard-sidebar-item:hover { background: rgba(99,102,241,0.08); color: #e8ecf8; transform: translateX(4px); }
        .dashboard-sidebar-item.active { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08)); color: #818cf8; }
        .sidebar-icon { font-size: 1.2rem; width: 28px; }
        .sidebar-badge { background: rgba(239,68,68,0.8); color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; margin-left: auto; }
        .dashboard-sidebar-footer { padding: 20px; border-top: 1px solid rgba(99,102,241,0.1); }
        .dashboard-sidebar-tip { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(99,102,241,0.08); border-radius: 10px; font-size: 0.75rem; color: #7a849c; }
        .dashboard-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 90; }

        .dashboard-main-content { flex: 1; overflow-x: hidden; padding-bottom: 80px; }
        .mobile-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 90; background: rgba(12,15,26,0.95); backdrop-filter: blur(20px); border-top: 1px solid rgba(99,102,241,0.2); padding: 8px 16px; }
        .mobile-bottom-nav-container { display: flex; justify-content: space-around; gap: 8px; }
        .mobile-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent; border: none; padding: 8px 4px; border-radius: 8px; cursor: pointer; color: #7a849c; font-size: 0.7rem; }
        .mobile-nav-item.active { color: #818cf8; background: rgba(99,102,241,0.1); }
        .mobile-nav-icon { font-size: 1.3rem; }

        .mobile-menu-panel { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(12,15,26,0.98); backdrop-filter: blur(20px); border-radius: 20px 20px 0 0; transform: translateY(100%); transition: transform 0.3s; z-index: 200; max-height: 80vh; overflow-y: auto; }
        .mobile-menu-panel.open { transform: translateY(0); }
        .mobile-menu-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .mobile-menu-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .mobile-menu-name { font-weight: 600; }
        .mobile-menu-role { font-size: 0.75rem; color: #818cf8; }
        .mobile-menu-close { background: rgba(99,102,241,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #7a849c; font-size: 1.2rem; cursor: pointer; }
        .mobile-menu-items { padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .mobile-menu-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.1); border-radius: 12px; cursor: pointer; color: #7a849c; }
        .mobile-menu-item.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #818cf8; }
        .mobile-menu-badge { margin-left: auto; background: rgba(239,68,68,0.8); color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; }
        .mobile-menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 199; }

        .dashboard-header { padding: 2rem 2rem 0 2rem; }
        .dashboard-header > div { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; padding-bottom: 24px; border-bottom: 1px solid var(--border-light); }
        .dashboard-header h1 { font-size: 1.8rem; font-weight: 700; color: #e8ecf8; }
        .dashboard-header h1 span { background: linear-gradient(135deg, #6366f1, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .dashboard-header p { color: #7a849c; font-size: 0.88rem; margin-top: 8px; }
        .dashboard-header-stats { display: flex; gap: 12px; }
        .dashboard-header-stats > div { background: rgba(12,15,26,0.6); border: 1px solid var(--border-light); border-radius: 10px; padding: 10px 18px; text-align: center; }
        .dashboard-header-stats span:first-child { display: block; font-size: 0.85rem; font-weight: 600; color: #818cf8; }
        .dashboard-header-stats span:last-child { font-size: 0.68rem; color: #3d4459; }

        .admin-section { padding: 0 2rem 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; margin-bottom: 24px; }
        .stat-card { background: rgba(12,15,26,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(99,102,241,0.12); border-radius: 16px; padding: 20px; text-align: center; transition: all 0.3s; }
        .stat-card:hover { transform: translateY(-3px); border-color: rgba(99,102,241,0.3); }
        .stat-icon { font-size: 2rem; margin-bottom: 8px; }
        .stat-value { font-size: 1.8rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: #7a849c; margin-top: 4px; }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .info-card { background: rgba(12,15,26,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(99,102,241,0.12); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        .info-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .info-card > div > div { margin-bottom: 12px; }
        .info-card > div > div > span:first-child { font-size: 0.75rem; color: #7a849c; }
        .info-card > div > div > span:last-child { font-size: 0.75rem; font-weight: 600; float: right; }
        .progress-bar { height: 6px; background: rgba(99,102,241,0.1); border-radius: 3px; overflow: hidden; margin-top: 6px; }
        .progress-bar div { height: 100%; background: linear-gradient(90deg, #6366f1, #818cf8); border-radius: 3px; }

        .admin-search-bar { margin: 0 2rem 24px 2rem; }
        .admin-search-bar > div { position: relative; max-width: 400px; }
        .admin-search-bar span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #3d4459; }
        .admin-search-bar input { width: 100%; padding: 12px 16px 12px 44px; background: rgba(7,9,14,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; color: #e8ecf8; font-size: 0.9rem; }

        .table-container { overflow-x: auto; background: rgba(12,15,26,0.6); border-radius: 16px; border: 1px solid rgba(99,102,241,0.12); }
        .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 600px; }
        .data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(99,102,241,0.08); }
        .data-table th { color: #818cf8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
        .action-btns { display: flex; gap: 8px; }
        .icon-btn { background: rgba(99,102,241,0.1); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(99,102,241,0.2); transform: translateY(-1px); }
        .icon-btn.danger:hover { background: rgba(239,68,68,0.2); }
        .empty-state { text-align: center; padding: 60px 20px; color: #7a849c; }
        .category-badge { background: rgba(99,102,241,0.1); padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; }
        .rating-cell { text-align: center; }

        .status-badge, .priority-badge, .verdict-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .status-unknown { background: rgba(100,116,139,0.12); color: #64748b; }

        .admin-toast { position: fixed; top: 90px; right: 20px; z-index: 200; padding: 12px 20px; background: rgba(12,15,26,0.95); backdrop-filter: blur(12px); border-radius: 8px; font-size: 0.85rem; animation: slideIn 0.3s ease-out; }
        .toast-success { border: 1px solid rgba(34,197,94,0.4); color: #4ade80; }
        .toast-error { border: 1px solid rgba(239,68,68,0.4); color: #f87171; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(6,8,15,0.95); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: linear-gradient(135deg, #0c0f1a, #07090e); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; width: 90%; max-width: 550px; max-height: 85vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal > div:first-child { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(99,102,241,0.12); }
        .modal > div:first-child h3 { font-size: 1.1rem; color: #818cf8; }
        .modal > div:first-child button { background: rgba(99,102,241,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #7a849c; font-size: 1rem; cursor: pointer; }
        .modal > div:nth-child(2) { padding: 24px; }
        .modal > div:last-child { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(99,102,241,0.12); }

        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: #7a849c; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; background: rgba(7,9,14,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; color: #e8ecf8; font-size: 0.85rem; }
        .details-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .details-section h4 { font-size: 0.9rem; font-weight: 600; color: #818cf8; margin-bottom: 12px; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .details-grid div { font-size: 0.8rem; color: #7a849c; }
        .details-grid strong { color: #e8ecf8; }
        .feedback-message { background: rgba(7,9,14,0.5); padding: 12px; border-radius: 8px; margin-top: 8px; white-space: pre-wrap; }
        .warning-text { color: #f87171; font-size: 0.8rem; margin-top: 8px; }

        .btn-primary, .btn-secondary, .btn-danger { padding: 8px 20px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .btn-secondary { background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }
        .btn-secondary:hover { background: rgba(99,102,241,0.2); }
        .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
        .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }

        @media (max-width: 768px) {
          .dashboard-sidebar { position: fixed; top: var(--header-height); left: 0; transform: translateX(-100%); transition: transform 0.3s; z-index: 100; }
          .dashboard-sidebar.open { transform: translateX(0); box-shadow: 2px 0 20px rgba(0,0,0,0.3); }
          .mobile-menu-toggle { display: flex; }
          .mobile-bottom-nav { display: block; }
          .dashboard-main-content { padding-bottom: 0; }
          .dashboard-header { padding: 1rem 1rem 0 1rem; }
          .dashboard-header h1 { font-size: 1.4rem; }
          .admin-section { padding: 0 1rem 1rem; }
          .admin-search-bar { margin: 0 1rem 16px 1rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .stat-card { padding: 16px; }
          .stat-value { font-size: 1.4rem; }
          .two-columns { grid-template-columns: 1fr; gap: 16px; }
          .data-table, .data-table thead, .data-table tbody, .data-table th, .data-table td, .data-table tr { display: block; }
          .data-table thead tr { position: absolute; top: -9999px; left: -9999px; }
          .data-table tr { border: 1px solid rgba(99,102,241,0.15); margin-bottom: 12px; border-radius: 12px; padding: 12px; }
          .data-table td { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid rgba(99,102,241,0.08); text-align: right; }
          .data-table td::before { content: attr(data-label); font-weight: 600; color: #818cf8; text-align: left; margin-right: 16px; font-size: 0.75rem; }
          .admin-toast { top: auto; bottom: 80px; right: 10px; left: 10px; }
        }
        @media (max-width: 480px) {
          .dashboard-nav { padding: 0 1rem; }
          .dashboard-logo-text { font-size: 0.9rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .details-grid { grid-template-columns: 1fr; }
          .modal { width: 95%; }
          .mobile-menu-items { grid-template-columns: 1fr; }
        }
        @media (min-width: 1200px) { .stats-grid { grid-template-columns: repeat(6, 1fr); } .admin-section { max-width: 1400px; margin: 0 auto; } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(99,102,241,0.05); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 3px; }
        ::selection { background: rgba(99,102,241,0.3); color: #e8ecf8; }
        .pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid rgba(99,102,241,0.1);
  margin-top: 20px;
}

.pagination-btn {
  padding: 8px 16px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 8px;
  color: #818cf8;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(99,102,241,0.2);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.8rem;
  color: #7a849c;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-wrap: wrap;
    gap: 10px;
  }
}
      `}</style>
    </>
  );
}
