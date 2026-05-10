// frontend/src/pages/roles/Investigator/components/TaskManager.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Task = {
  task_id: string;
  case_id: string;
  case_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  assigned_to: string;
  created_at: string;
  notes: Array<{ note: string; by: string; at: string }>;
};

type TaskStats = {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
};

export function TaskManager({ token, cases }: { token: string; cases: any[] }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksData, statsData] = await Promise.all([
        apiRequest<Task[]>("/investigator/tasks/my-tasks", { token }).catch(() => []),
        apiRequest<TaskStats>("/investigator/tasks/stats", { token }).catch(() => null)
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask() {
    if (!selectedCase || !taskTitle) {
      setMessage("❌ Please select case and enter task title");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest("/investigator/tasks/create", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          due_date: taskDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        }
      });
      setMessage("✅ Task created successfully!");
      setShowCreateForm(false);
      setSelectedCase("");
      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("MEDIUM");
      setTaskDueDate("");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to create task");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function updateTaskStatus(taskId: string, status: string, notes?: string) {
    try {
      await apiRequest(`/investigator/tasks/${taskId}/status`, {
        method: "PUT",
        token,
        body: { status, notes }
      });
      loadData();
      setMessage(`✅ Task marked as ${status}`);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("❌ Failed to update task");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, { bg: string; color: string; icon: string }> = {
      HIGH: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", icon: "🔴" },
      MEDIUM: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", icon: "🟡" },
      LOW: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", icon: "🟢" }
    };
    const style = colors[priority] || { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", icon: "⚪" };
    return (
      <span className="tm-priority-badge" style={{ background: style.bg, color: style.color }}>
        <span className="tm-priority-icon">{style.icon}</span>
        {priority}
      </span>
    );
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string; icon: string }> = {
      PENDING: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", icon: "⏳" },
      IN_PROGRESS: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", icon: "🔄" },
      COMPLETED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", icon: "✅" },
      CANCELLED: { bg: "rgba(107, 114, 128, 0.12)", color: "#6b7280", icon: "❌" }
    };
    const style = colors[status] || { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", icon: "📋" };
    return (
      <span className="tm-status-badge" style={{ background: style.bg, color: style.color }}>
        <span className="tm-status-icon">{style.icon}</span>
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  function isOverdue(dueDate: string, status: string): boolean {
    if (status === "COMPLETED" || status === "CANCELLED") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  if (loading) {
    return (
      <div className="tm-loading">
        <div className="tm-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="tm-dashboard">
      {/* Stats Cards */}
      {stats && (
        <div className="tm-stats-grid">
          <div className="tm-stat-card">
            <div className="tm-stat-icon">📋</div>
            <div className="tm-stat-value">{stats.total}</div>
            <div className="tm-stat-label">Total Tasks</div>
          </div>
          <div className={`tm-stat-card ${stats.overdue > 0 ? "tm-stat-warning" : ""}`}>
            <div className="tm-stat-icon">⚠️</div>
            <div className="tm-stat-value">{stats.overdue}</div>
            <div className="tm-stat-label">Overdue</div>
          </div>
          <div className="tm-stat-card">
            <div className="tm-stat-icon">✅</div>
            <div className="tm-stat-value">{stats.completed}</div>
            <div className="tm-stat-label">Completed</div>
          </div>
          <div className="tm-stat-card">
            <div className="tm-stat-icon">🔄</div>
            <div className="tm-stat-value">{stats.in_progress}</div>
            <div className="tm-stat-label">In Progress</div>
          </div>
        </div>
      )}

      {/* Create Task Button */}
      <div className="tm-action-bar">
        <button className="tm-btn tm-btn-success" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "❌ Cancel" : "➕ Create New Task"}
        </button>
      </div>

      {/* Create Task Form Modal */}
      {showCreateForm && (
        <div className="tm-modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tm-modal-header">
              <h3>📝 Create New Task</h3>
              <button className="tm-modal-close" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <div className="tm-modal-body">
              {message && (
                <div className={`tm-message ${message.includes("✅") ? "tm-message-success" : "tm-message-error"}`}>
                  {message}
                </div>
              )}
              <div className="tm-form">
                <div className="tm-form-group">
                  <label>Select Case <span className="tm-required">*</span></label>
                  <div className="tm-select-wrapper">
                    <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}>
                      <option value="">-- Select Case --</option>
                      {cases.map((c: any) => (
                        <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
                      ))}
                    </select>
                    <span className="tm-select-icon">⚖️</span>
                  </div>
                </div>
                <div className="tm-form-group">
                  <label>Task Title <span className="tm-required">*</span></label>
                  <div className="tm-input-wrapper">
                    <span className="tm-input-icon">📌</span>
                    <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., Collect CCTV footage" />
                  </div>
                </div>
                <div className="tm-form-group">
                  <label>Description</label>
                  <div className="tm-textarea-wrapper">
                    <span className="tm-textarea-icon">📄</span>
                    <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} placeholder="Detailed description..." />
                  </div>
                </div>
                <div className="tm-form-row">
                  <div className="tm-form-group">
                    <label>Priority</label>
                    <div className="tm-select-wrapper">
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                        <option value="HIGH">🔴 HIGH</option>
                        <option value="MEDIUM">🟡 MEDIUM</option>
                        <option value="LOW">🟢 LOW</option>
                      </select>
                      <span className="tm-select-icon">⚡</span>
                    </div>
                  </div>
                  <div className="tm-form-group">
                    <label>Due Date</label>
                    <div className="tm-input-wrapper">
                      <span className="tm-input-icon">📅</span>
                      <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tm-modal-footer">
              <button className="tm-btn tm-btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button className="tm-btn tm-btn-primary" onClick={handleCreateTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tm-tabs-container">
        <div className="tm-tabs">
          <button
            className={`tm-tab ${activeTab === "my-tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("my-tasks")}
          >
            <span className="tm-tab-icon">📋</span>
            <span>My Tasks</span>
            <span className="tm-tab-badge">{tasks.length}</span>
          </button>
          <button
            className={`tm-tab ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <span className="tm-tab-icon">📊</span>
            <span>Statistics</span>
          </button>
        </div>
      </div>

      {/* My Tasks List */}
      {activeTab === "my-tasks" && (
        <div className="tm-card tm-fade-up">
          {tasks.length === 0 ? (
            <div className="tm-empty">
              <div className="tm-empty-icon">✅</div>
              <h4>No Tasks</h4>
              <p>You have no tasks assigned. Create a new task to get started.</p>
              <button className="tm-link-btn" onClick={() => setShowCreateForm(true)}>
                Create Your First Task →
              </button>
            </div>
          ) : (
            <div className="tm-tasks-list">
              {tasks.map((task, idx) => {
                const overdue = isOverdue(task.due_date, task.status);
                return (
                  <div 
                    key={task.task_id} 
                    className={`tm-task-card ${hoveredTask === task.task_id ? "hovered" : ""} ${overdue ? "overdue" : ""}`}
                    onMouseEnter={() => setHoveredTask(task.task_id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="tm-task-header">
                      <div className="tm-task-info">
                        <div className="tm-task-title-section">
                          <span className="tm-task-icon">📋</span>
                          <strong className="tm-task-title">{task.title}</strong>
                        </div>
                        <div className="tm-task-badges">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                          {overdue && <span className="tm-overdue-badge">⚠️ Overdue</span>}
                        </div>
                      </div>
                      <div className="tm-task-meta">
                        <span className="tm-task-case">Case: {task.case_number}</span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="tm-task-description">{task.description}</p>
                    )}
                    
                    <div className="tm-task-footer">
                      <div className="tm-task-due">
                        <span className="tm-due-icon">📅</span>
                        <span className={overdue ? "tm-due-overdue" : ""}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="tm-task-actions">
                        {task.status === "PENDING" && (
                          <button className="tm-btn tm-btn-primary tm-btn-small" onClick={() => updateTaskStatus(task.task_id, "IN_PROGRESS")}>
                            ▶ Start
                          </button>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <button className="tm-btn tm-btn-success tm-btn-small" onClick={() => updateTaskStatus(task.task_id, "COMPLETED")}>
                            ✅ Complete
                          </button>
                        )}
                        {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                          <button className="tm-btn tm-btn-danger tm-btn-small" onClick={() => updateTaskStatus(task.task_id, "CANCELLED")}>
                            ❌ Cancel
                          </button>
                        )}
                        {task.notes.length > 0 && (
                          <button 
                            className="tm-btn tm-btn-secondary tm-btn-small"
                            onClick={() => setExpandedTask(expandedTask === task.task_id ? null : task.task_id)}
                          >
                            {expandedTask === task.task_id ? "▲ Hide Log" : "▼ Activity Log"}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {expandedTask === task.task_id && task.notes.length > 0 && (
                      <div className="tm-activity-log">
                        <div className="tm-log-header">Activity Log ({task.notes.length})</div>
                        {task.notes.map((note, noteIdx) => (
                          <div key={noteIdx} className="tm-log-item">
                            <span className="tm-log-note">{note.note}</span>
                            <span className="tm-log-meta">
                              {new Date(note.at).toLocaleString()} by {note.by}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Statistics View */}
      {activeTab === "stats" && stats && (
        <div className="tm-card tm-fade-up">
          <div className="tm-card-header">
            <div className="tm-card-icon">📊</div>
            <div>
              <h3>Task Statistics</h3>
              <p>Overview of your task performance</p>
            </div>
          </div>
          <div className="tm-stats-container">
            <div className="tm-stats-section">
              <h4>📊 By Status</h4>
              <div className="tm-stats-list">
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-pending"></span>
                  <span className="tm-stat-label">Pending</span>
                  <span className="tm-stat-number">{stats.pending}</span>
                </div>
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-progress"></span>
                  <span className="tm-stat-label">In Progress</span>
                  <span className="tm-stat-number">{stats.in_progress}</span>
                </div>
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-completed"></span>
                  <span className="tm-stat-label">Completed</span>
                  <span className="tm-stat-number">{stats.completed}</span>
                </div>
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-overdue"></span>
                  <span className="tm-stat-label">Overdue</span>
                  <span className="tm-stat-number tm-stat-number-warning">{stats.overdue}</span>
                </div>
              </div>
            </div>
            <div className="tm-stats-section">
              <h4>🎯 By Priority</h4>
              <div className="tm-stats-list">
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-high"></span>
                  <span className="tm-stat-label">High</span>
                  <span className="tm-stat-number">{stats.high_priority}</span>
                </div>
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-medium"></span>
                  <span className="tm-stat-label">Medium</span>
                  <span className="tm-stat-number">{stats.medium_priority}</span>
                </div>
                <div className="tm-stat-item">
                  <span className="tm-stat-dot tm-stat-dot-low"></span>
                  <span className="tm-stat-label">Low</span>
                  <span className="tm-stat-number">{stats.low_priority}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="tm-progress-section">
            <h4>📈 Completion Progress</h4>
            <div className="tm-progress-bar">
              <div 
                className="tm-progress-fill" 
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
            <div className="tm-progress-stats">
              <span>{stats.completed} of {stats.total} tasks completed</span>
              <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && !showCreateForm && (
        <div className={`tm-toast ${message.includes("✅") ? "tm-toast-success" : "tm-toast-error"}`}>
          <span>{message}</span>
        </div>
      )}

      <style>{`
        /* Task Manager Styles - Indigo Theme */
        .tm-dashboard {
          animation: tm-fadeIn 0.4s ease-out;
        }

        @keyframes tm-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes tm-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tm-fade-up {
          animation: tm-slideUp 0.5s ease-out backwards;
        }

        /* Loading State */
        .tm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
          gap: 16px;
        }

        .tm-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: tm-spin 0.8s linear infinite;
        }

        @keyframes tm-spin {
          to { transform: rotate(360deg); }
        }

        .tm-loading p {
          color: #7a849c;
        }

        /* Stats Grid */
        .tm-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .tm-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .tm-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .tm-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .tm-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .tm-stat-card.tm-stat-warning {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .tm-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .tm-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .tm-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        /* Action Bar */
        .tm-action-bar {
          margin-bottom: 20px;
        }

        /* Buttons */
        .tm-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tm-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .tm-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .tm-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .tm-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .tm-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .tm-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .tm-btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
        }

        .tm-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .tm-btn-small {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .tm-link-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .tm-link-btn:hover {
          color: #a5b4fc;
          transform: translateX(4px);
        }

        /* Tabs */
        .tm-tabs-container {
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 24px;
        }

        .tm-tabs {
          display: flex;
          gap: 8px;
        }

        .tm-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          border-radius: 8px 8px 0 0;
        }

        .tm-tab::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #6366f1;
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .tm-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .tm-tab.active {
          color: #818cf8;
        }

        .tm-tab.active::after {
          transform: scaleX(1);
        }

        .tm-tab-icon {
          font-size: 1rem;
        }

        .tm-tab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #818cf8;
        }

        /* Card */
        .tm-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s;
        }

        .tm-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .tm-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .tm-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .tm-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Tasks List */
        .tm-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tm-task-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
          animation: tm-slideIn 0.3s ease-out backwards;
        }

        @keyframes tm-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .tm-task-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .tm-task-card.overdue {
          border-left: 3px solid #ef4444;
        }

        .tm-task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .tm-task-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tm-task-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tm-task-icon {
          font-size: 1.1rem;
        }

        .tm-task-title {
          font-size: 0.95rem;
          color: #e8ecf8;
        }

        .tm-task-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tm-priority-badge, .tm-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .tm-overdue-badge {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .tm-task-meta {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .tm-task-description {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 12px 0;
          line-height: 1.5;
        }

        .tm-task-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        .tm-task-due {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #7a849c;
        }

        .tm-due-overdue {
          color: #ef4444;
          font-weight: 500;
        }

        .tm-task-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Activity Log */
        .tm-activity-log {
          margin-top: 16px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
        }

        .tm-log-header {
          font-size: 0.75rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 10px;
        }

        .tm-log-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          font-size: 0.7rem;
        }

        .tm-log-item:last-child {
          border-bottom: none;
        }

        .tm-log-note {
          color: #7a849c;
          flex: 1;
        }

        .tm-log-meta {
          color: #3d4459;
        }

        /* Modal */
        .tm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(6, 8, 15, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: tm-fadeInModal 0.2s ease;
        }

        @keyframes tm-fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tm-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
          animation: tm-slideUpModal 0.3s ease;
        }

        @keyframes tm-slideUpModal {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .tm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }

        .tm-modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }

        .tm-modal-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1rem;
          cursor: pointer;
        }

        .tm-modal-body {
          padding: 24px;
        }

        .tm-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }

        /* Form */
        .tm-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tm-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tm-form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .tm-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .tm-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 500px) {
          .tm-form-row {
            grid-template-columns: 1fr;
          }
        }

        .tm-input-wrapper, .tm-select-wrapper, .tm-textarea-wrapper {
          position: relative;
        }

        .tm-input-icon, .tm-select-icon, .tm-textarea-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .tm-textarea-icon {
          top: 14px;
          transform: none;
        }

        .tm-input-wrapper input, .tm-select-wrapper select, .tm-textarea-wrapper textarea {
          width: 100%;
          padding: 10px 12px 10px 36px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
        }

        .tm-input-wrapper input:focus, .tm-select-wrapper select:focus, .tm-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Stats Container */
        .tm-stats-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 600px) {
          .tm-stats-container {
            grid-template-columns: 1fr;
          }
        }

        .tm-stats-section h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
        }

        .tm-stats-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tm-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 8px;
        }

        .tm-stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .tm-stat-dot-pending { background: #f59e0b; }
        .tm-stat-dot-progress { background: #3b82f6; }
        .tm-stat-dot-completed { background: #10b981; }
        .tm-stat-dot-overdue { background: #ef4444; }
        .tm-stat-dot-high { background: #ef4444; }
        .tm-stat-dot-medium { background: #f59e0b; }
        .tm-stat-dot-low { background: #10b981; }

        .tm-stat-label {
          flex: 1;
          font-size: 0.8rem;
          color: #7a849c;
        }

        .tm-stat-number {
          font-size: 0.85rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .tm-stat-number-warning {
          color: #ef4444;
        }

        /* Progress Section */
        .tm-progress-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .tm-progress-section h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
        }

        .tm-progress-bar {
          height: 8px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .tm-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .tm-progress-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 0.7rem;
          color: #7a849c;
        }

        /* Message */
        .tm-message {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .tm-message-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .tm-message-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Toast */
        .tm-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: tm-toastIn 0.3s ease-out;
        }

        @keyframes tm-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .tm-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .tm-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Empty State */
        .tm-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .tm-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .tm-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .tm-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .tm-card {
            padding: 20px;
          }

          .tm-task-header {
            flex-direction: column;
          }

          .tm-task-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .tm-task-actions {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}