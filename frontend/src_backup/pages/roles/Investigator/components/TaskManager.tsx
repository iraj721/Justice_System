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
    }
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#10b981"
    };
    return <span style={{ background: colors[priority] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{priority}</span>;
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: "#f59e0b",
      IN_PROGRESS: "#3b82f6",
      COMPLETED: "#10b981",
      CANCELLED: "#6b7280"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{status.replace(/_/g, " ")}</span>;
  }

  function isOverdue(dueDate: string, status: string): boolean {
    if (status === "COMPLETED") return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  }

  if (loading) {
    return <div className="card">Loading tasks...</div>;
  }

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div className="card" style={{ textAlign: "center", padding: "12px" }}>
            <div style={{ fontSize: "24px" }}>📋</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{stats.total}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>Total Tasks</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "12px", background: stats.overdue > 0 ? "#fee2e2" : "white" }}>
            <div style={{ fontSize: "24px" }}>⚠️</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: stats.overdue > 0 ? "#ef4444" : "#666" }}>{stats.overdue}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>Overdue</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "12px" }}>
            <div style={{ fontSize: "24px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>{stats.completed}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>Completed</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "12px" }}>
            <div style={{ fontSize: "24px" }}>🔄</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}>{stats.in_progress}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>In Progress</div>
          </div>
        </div>
      )}

      {/* Create Task Button */}
      <div style={{ marginBottom: "16px" }}>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ background: "#10b981", cursor: "pointer" }}>
          {showCreateForm ? "❌ Cancel" : "➕ Create New Task"}
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="card">
          <h3>📝 Create New Task</h3>
          {message && <p style={{ color: message.includes("✅") ? "#10b981" : "#ef4444" }}>{message}</p>}
          <div className="form-grid">
            <label>Select Case *</label>
            <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}>
              <option value="">-- Select Case --</option>
              {cases.map((c: any) => (
                <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
              ))}
            </select>

            <label>Task Title *</label>
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., Collect CCTV footage" />

            <label>Description</label>
            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} placeholder="Detailed description..." />

            <label>Priority</label>
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
              <option value="HIGH">🔴 HIGH</option>
              <option value="MEDIUM">🟡 MEDIUM</option>
              <option value="LOW">🟢 LOW</option>
            </select>

            <label>Due Date</label>
            <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />

            <button onClick={handleCreateTask} style={{ background: "#3b82f6", cursor: "pointer" }}>Create Task</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
        <button onClick={() => setActiveTab("my-tasks")} style={{ background: activeTab === "my-tasks" ? "#3b82f6" : "transparent", color: activeTab === "my-tasks" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          📋 My Tasks ({tasks.length})
        </button>
        <button onClick={() => setActiveTab("all")} style={{ background: activeTab === "all" ? "#3b82f6" : "transparent", color: activeTab === "all" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          📊 All Tasks Stats
        </button>
      </div>

      {/* My Tasks List */}
      {activeTab === "my-tasks" && (
        <div className="card">
          {tasks.length === 0 ? (
            <p>No tasks assigned. Create a new task to get started.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {tasks.map((task) => (
                <div key={task.task_id} style={{ border: `1px solid ${isOverdue(task.due_date, task.status) ? "#ef4444" : "#e2e8f0"}`, borderRadius: "12px", padding: "16px", background: isOverdue(task.due_date, task.status) ? "#fef2f2" : "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                    <div>
                      <strong>{task.title}</strong>
                      <span style={{ marginLeft: "8px" }}>{getPriorityBadge(task.priority)}</span>
                      <span style={{ marginLeft: "8px" }}>{getStatusBadge(task.status)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Case: {task.case_number}
                    </div>
                  </div>
                  <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{task.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", fontSize: "12px" }}>
                    <div>
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                      {isOverdue(task.due_date, task.status) && <span style={{ color: "#ef4444", marginLeft: "8px" }}>(Overdue!)</span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {task.status === "PENDING" && (
                        <button onClick={() => updateTaskStatus(task.task_id, "IN_PROGRESS")} style={{ background: "#3b82f6", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Start</button>
                      )}
                      {task.status === "IN_PROGRESS" && (
                        <button onClick={() => updateTaskStatus(task.task_id, "COMPLETED")} style={{ background: "#10b981", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Complete</button>
                      )}
                      {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                        <button onClick={() => updateTaskStatus(task.task_id, "CANCELLED")} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                      )}
                    </div>
                  </div>
                  {task.notes.length > 0 && (
                    <details style={{ marginTop: "12px" }}>
                      <summary style={{ cursor: "pointer", fontSize: "12px", color: "#3b82f6" }}>Activity Log ({task.notes.length})</summary>
                      {task.notes.map((note, idx) => (
                        <div key={idx} style={{ fontSize: "11px", color: "#666", padding: "4px 0", borderBottom: "1px solid #e2e8f0" }}>
                          {note.note} - {new Date(note.at).toLocaleString()} by {note.by}
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats View */}
      {activeTab === "all" && stats && (
        <div className="card">
          <h3>📊 Task Statistics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <h4>By Status</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>✅ Completed: {stats.completed}</li>
                <li>🔄 In Progress: {stats.in_progress}</li>
                <li>⏳ Pending: {stats.pending}</li>
                <li>⚠️ Overdue: {stats.overdue}</li>
              </ul>
            </div>
            <div>
              <h4>By Priority</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>🔴 High: {stats.high_priority}</li>
                <li>🟡 Medium: {stats.medium_priority}</li>
                <li>🟢 Low: {stats.low_priority}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {message && !showCreateForm && (
        <div className="card" style={{ background: message.includes("✅") ? "#d1fae5" : "#fee2e2", padding: "12px", marginTop: "16px" }}>
          {message}
        </div>
      )}
    </div>
  );
}