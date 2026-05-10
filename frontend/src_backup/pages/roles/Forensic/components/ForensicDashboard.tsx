// frontend/src/pages/roles/Forensic/components/ForensicDashboard.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type DashboardStats = {
  overview: {
    total_evidence: number;
    pending: number;
    in_progress: number;
    completed: number;
    transferred: number;
  };
  by_priority: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  analysis_types: Record<string, number>;
  my_performance: {
    total_analyses: number;
    completed: number;
    average_completion_days: number;
  };
  completion_rate: number;
};

type RecentActivity = {
  type: string;
  evidence_id: string;
  title: string;
  timestamp: string;
  by: string;
};

export function ForensicDashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, activityData] = await Promise.all([
        apiRequest<DashboardStats>("/forensic/dashboard/stats", { token }).catch(() => null),
        apiRequest<RecentActivity[]>("/forensic/dashboard/recent", { token }).catch(() => [])
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="card">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Stats Overview */}
      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>📊</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats.overview.total_evidence}</div>
              <div>Total Evidence</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>⏳</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{stats.overview.pending}</div>
              <div>Pending</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>🔬</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats.overview.in_progress}</div>
              <div>In Progress</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>✅</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{stats.overview.completed}</div>
              <div>Completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card">
            <h3>📈 Overall Completion Rate</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Progress</span>
              <span>{stats.completion_rate}%</span>
            </div>
            <div style={{ height: "12px", background: "#e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ width: `${stats.completion_rate}%`, height: "100%", background: "#10b981", transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Priority & Analysis Types */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div className="card">
              <h3>🎯 By Priority</h3>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>🔴 High</span>
                  <span>{stats.by_priority.HIGH}</span>
                </div>
                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "12px" }}>
                  <div style={{ width: `${(stats.by_priority.HIGH / stats.overview.total_evidence) * 100}%`, height: "100%", background: "#ef4444", borderRadius: "4px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>🟡 Medium</span>
                  <span>{stats.by_priority.MEDIUM}</span>
                </div>
                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "12px" }}>
                  <div style={{ width: `${(stats.by_priority.MEDIUM / stats.overview.total_evidence) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: "4px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>🟢 Low</span>
                  <span>{stats.by_priority.LOW}</span>
                </div>
                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: `${(stats.by_priority.LOW / stats.overview.total_evidence) * 100}%`, height: "100%", background: "#10b981", borderRadius: "4px" }} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3>🔬 Analysis Types</h3>
              {Object.entries(stats.analysis_types).map(([type, count]) => (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{type.replace(/_/g, " ")}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "12px" }}>
                    <div style={{ width: `${(count / stats.overview.completed) * 100}%`, height: "100%", background: "#8b5cf6", borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Performance */}
          <div className="card">
            <h3>⭐ My Performance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}>{stats.my_performance.total_analyses}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total Analyses</div>
              </div>
              <div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>{stats.my_performance.completed}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Completed</div>
              </div>
              <div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f59e0b" }}>{stats.my_performance.average_completion_days}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Avg Days per Analysis</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card">
          <h3>🕐 Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentActivity.map((activity, idx) => (
              <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "14px" }}>
                    {activity.type === "ANALYSIS_STARTED" ? "🔬 Started Analysis:" : "✅ Completed Analysis:"}
                    <strong> {activity.title}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>By: {activity.by}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>{new Date(activity.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}