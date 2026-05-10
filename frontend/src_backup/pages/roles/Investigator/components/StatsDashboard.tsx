// frontend/src/pages/roles/Investigator/components/StatsDashboard.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type DashboardStats = {
  overview: {
    total_cases: number;
    active_cases: number;
    resolved_cases: number;
    total_evidence: number;
    total_suspects: number;
    total_witnesses: number;
  };
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  monthly_trend: Array<{ month: string; cases: number }>;
  weekly_activity: Array<{ day: string; cases: number }>;
  clearance_rate: number;
  avg_resolution_days: number;
};

type PerformanceMetrics = {
  cases_handled: number;
  evidence_collected: number;
  evidence_verified: number;
  suspects_identified: number;
  witnesses_recorded: number;
  reports_generated: number;
  task_completion_rate: number;
};

export function StatsDashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, perfData] = await Promise.all([
        apiRequest<DashboardStats>("/investigator/stats/dashboard", { token }).catch(() => null),
        apiRequest<PerformanceMetrics>("/investigator/stats/performance", { token }).catch(() => null)
      ]);
      setStats(statsData);
      setPerformance(perfData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="card">Loading statistics...</div>;
  }

  return (
    <div>
      {/* Overview Cards */}
      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>⚖️</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats.overview.total_cases}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Total Cases</div>
              <div style={{ fontSize: "12px", color: "#10b981" }}>{stats.overview.active_cases} Active</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>📦</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.overview.total_evidence}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Evidence</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>👤</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{stats.overview.total_suspects}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Suspects</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px" }}>👥</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{stats.overview.total_witnesses}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Witnesses</div>
            </div>
          </div>

          {/* Performance Metrics */}
          {performance && (
            <div className="card" style={{ marginBottom: "24px" }}>
              <h3>📈 Performance Metrics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{performance.cases_handled}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Cases Handled</div>
                </div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>{performance.evidence_collected}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Evidence Collected</div>
                </div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{performance.evidence_verified}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Verified Evidence</div>
                </div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{performance.task_completion_rate}%</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Task Completion Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Status & Priority Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div className="card">
              <h3>📊 Cases by Status</h3>
              {Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{status.replace(/_/g, " ")}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${(count / stats.overview.total_cases) * 100}%`, height: "100%", background: "#3b82f6" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3>🎯 Cases by Priority</h3>
              {Object.entries(stats.by_priority).map(([priority, count]) => {
                const colors: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
                return (
                  <div key={priority} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>{priority}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(count / stats.overview.total_cases) * 100}%`, height: "100%", background: colors[priority] || "#6b7280" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3>📅 Monthly Case Trend</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "150px", marginTop: "16px" }}>
              {stats.monthly_trend.map((item) => {
                const maxCases = Math.max(...stats.monthly_trend.map(i => i.cases), 1);
                const height = (item.cases / maxCases) * 120;
                return (
                  <div key={item.month} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: `${height}px`, background: "#3b82f6", borderRadius: "4px", marginBottom: "8px", transition: "height 0.3s" }} />
                    <div style={{ fontSize: "11px", color: "#666" }}>{item.month.slice(5)}</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>{item.cases}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Activity and Rates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="card">
              <h3>📊 Weekly Activity</h3>
              {stats.weekly_activity.map((day) => (
                <div key={day.day} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{day.day}</span>
                    <span>{day.cases} cases</span>
                  </div>
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${(day.cases / Math.max(...stats.weekly_activity.map(d => d.cases), 1)) * 100}%`, height: "100%", background: "#10b981" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3>🎯 Key Metrics</h3>
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "#3b82f6" }}>{stats.clearance_rate}%</div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>Clearance Rate</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{stats.avg_resolution_days} days</div>
                <div style={{ fontSize: "14px", color: "#666" }}>Average Resolution Time</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}