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

  function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#10b981"
    };
    return colors[priority] || "#6b7280";
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      UNDER_INVESTIGATION: "#8b5cf6",
      SUBMITTED_TO_COURT: "#3b82f6",
      DECIDED: "#10b981",
      REJECTED: "#ef4444",
      ACCEPTED: "#10b981",
      PENDING: "#f59e0b"
    };
    return colors[status] || "#6b7280";
  }

  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="sd-empty">
        <div className="sd-empty-icon">📊</div>
        <h4>No Data Available</h4>
        <p>Statistics will appear once you have case data</p>
      </div>
    );
  }

  return (
    <div className="sd-dashboard">
      {/* Overview Stats Cards */}
      <div className="sd-stats-grid">
        <div className="sd-stat-card">
          <div className="sd-stat-icon">⚖️</div>
          <div className="sd-stat-value">{stats.overview.total_cases}</div>
          <div className="sd-stat-label">Total Cases</div>
          <div className="sd-stat-sub">{stats.overview.active_cases} Active</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon">📦</div>
          <div className="sd-stat-value">{stats.overview.total_evidence}</div>
          <div className="sd-stat-label">Evidence Items</div>
          <div className="sd-stat-sub">Collected</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon">👤</div>
          <div className="sd-stat-value">{stats.overview.total_suspects}</div>
          <div className="sd-stat-label">Suspects</div>
          <div className="sd-stat-sub">Identified</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-icon">👥</div>
          <div className="sd-stat-value">{stats.overview.total_witnesses}</div>
          <div className="sd-stat-label">Witnesses</div>
          <div className="sd-stat-sub">Recorded</div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="sd-card sd-fade-up">
          <div className="sd-card-header">
            <div className="sd-card-icon">📈</div>
            <div>
              <h3>Performance Metrics</h3>
              <p>Your investigation performance overview</p>
            </div>
          </div>
          <div className="sd-metrics-grid">
            <div className="sd-metric">
              <span className="sd-metric-value">{performance.cases_handled}</span>
              <span className="sd-metric-label">Cases Handled</span>
            </div>
            <div className="sd-metric">
              <span className="sd-metric-value">{performance.evidence_collected}</span>
              <span className="sd-metric-label">Evidence Collected</span>
            </div>
            <div className="sd-metric">
              <span className="sd-metric-value">{performance.evidence_verified}</span>
              <span className="sd-metric-label">Verified Evidence</span>
            </div>
            <div className="sd-metric">
              <span className="sd-metric-value">{performance.task_completion_rate}%</span>
              <span className="sd-metric-label">Task Completion</span>
            </div>
            <div className="sd-metric">
              <span className="sd-metric-value">{performance.reports_generated}</span>
              <span className="sd-metric-label">Reports Generated</span>
            </div>
          </div>
        </div>
      )}

      {/* Status & Priority Breakdown */}
      <div className="sd-two-columns">
        <div className="sd-card sd-fade-up">
          <div className="sd-card-header small">
            <div className="sd-card-icon">📊</div>
            <div>
              <h3>Cases by Status</h3>
              <p>Distribution of case statuses</p>
            </div>
          </div>
          <div className="sd-breakdown-list">
            {Object.entries(stats.by_status).map(([status, count]) => {
              const total = stats.overview.total_cases;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status} className="sd-breakdown-item">
                  <div className="sd-breakdown-header">
                    <span className="sd-breakdown-label">{status.replace(/_/g, " ")}</span>
                    <span className="sd-breakdown-count">{count}</span>
                  </div>
                  <div className="sd-progress-bar">
                    <div 
                      className="sd-progress-fill" 
                      style={{ width: `${percentage}%`, background: getStatusColor(status) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sd-card sd-fade-up">
          <div className="sd-card-header small">
            <div className="sd-card-icon">🎯</div>
            <div>
              <h3>Cases by Priority</h3>
              <p>Priority level distribution</p>
            </div>
          </div>
          <div className="sd-breakdown-list">
            {Object.entries(stats.by_priority).map(([priority, count]) => {
              const total = stats.overview.total_cases;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={priority} className="sd-breakdown-item">
                  <div className="sd-breakdown-header">
                    <span className={`sd-priority-label sd-priority-${priority.toLowerCase()}`}>
                      {priority}
                    </span>
                    <span className="sd-breakdown-count">{count}</span>
                  </div>
                  <div className="sd-progress-bar">
                    <div 
                      className="sd-progress-fill" 
                      style={{ width: `${percentage}%`, background: getPriorityColor(priority) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="sd-card sd-fade-up">
        <div className="sd-card-header">
          <div className="sd-card-icon">📅</div>
          <div>
            <h3>Monthly Case Trend</h3>
            <p>New cases filed per month</p>
          </div>
        </div>
        <div className="sd-chart-container">
          <div className="sd-bar-chart">
            {stats.monthly_trend.map((item, idx) => {
              const maxCases = Math.max(...stats.monthly_trend.map(i => i.cases), 1);
              const height = (item.cases / maxCases) * 150;
              return (
                <div key={item.month} className="sd-bar-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="sd-bar" style={{ height: `${height}px` }}>
                    <span className="sd-bar-value">{item.cases}</span>
                  </div>
                  <div className="sd-bar-label">{item.month.split('-')[1]}/{item.month.split('-')[0]?.slice(-2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Activity & Key Metrics */}
      <div className="sd-two-columns">
        <div className="sd-card sd-fade-up">
          <div className="sd-card-header small">
            <div className="sd-card-icon">📊</div>
            <div>
              <h3>Weekly Activity</h3>
              <p>Case activity by day of week</p>
            </div>
          </div>
          <div className="sd-breakdown-list">
            {stats.weekly_activity.map((day) => {
              const maxActivity = Math.max(...stats.weekly_activity.map(d => d.cases), 1);
              const percentage = (day.cases / maxActivity) * 100;
              return (
                <div key={day.day} className="sd-breakdown-item">
                  <div className="sd-breakdown-header">
                    <span className="sd-breakdown-label">{day.day}</span>
                    <span className="sd-breakdown-count">{day.cases} cases</span>
                  </div>
                  <div className="sd-progress-bar">
                    <div className="sd-progress-fill sd-progress-green" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sd-card sd-fade-up">
          <div className="sd-card-header small">
            <div className="sd-card-icon">🎯</div>
            <div>
              <h3>Key Metrics</h3>
              <p>Overall performance indicators</p>
            </div>
          </div>
          <div className="sd-key-metrics">
            <div className="sd-key-metric">
              <div className="sd-key-value" style={{ color: "#818cf8" }}>{stats.clearance_rate}%</div>
              <div className="sd-key-label">Clearance Rate</div>
              <div className="sd-key-trend">Cases resolved vs received</div>
            </div>
            <div className="sd-key-metric">
              <div className="sd-key-value" style={{ color: "#f59e0b" }}>{stats.avg_resolution_days} days</div>
              <div className="sd-key-label">Avg Resolution Time</div>
              <div className="sd-key-trend">Time to close cases</div>
            </div>
            <div className="sd-key-metric">
              <div className="sd-key-value" style={{ color: "#10b981" }}>{stats.overview.resolved_cases}</div>
              <div className="sd-key-label">Resolved Cases</div>
              <div className="sd-key-trend">Successfully closed</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Stats Dashboard Styles - Indigo Theme */
        .sd-dashboard {
          animation: sd-fadeIn 0.4s ease-out;
        }

        @keyframes sd-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sd-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sd-fade-up {
          animation: sd-slideUp 0.5s ease-out backwards;
        }

        /* Loading State */
        .sd-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
          gap: 16px;
        }

        .sd-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: sd-spin 0.8s linear infinite;
        }

        @keyframes sd-spin {
          to { transform: rotate(360deg); }
        }

        .sd-loading p {
          color: #7a849c;
        }

        /* Empty State */
        .sd-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }

        .sd-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .sd-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .sd-empty p {
          color: #7a849c;
        }

        /* Stats Grid */
        .sd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .sd-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .sd-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .sd-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          transition: all 0.3s;
        }

        .sd-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .sd-stat-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .sd-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #e8ecf8;
          line-height: 1.2;
        }

        .sd-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sd-stat-sub {
          font-size: 0.65rem;
          color: #3d4459;
          margin-top: 4px;
        }

        /* Cards */
        .sd-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .sd-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .sd-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .sd-card-header.small {
          margin-bottom: 16px;
          padding-bottom: 10px;
        }

        .sd-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .sd-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .sd-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Two Columns Layout */
        .sd-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .sd-two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* Metrics Grid */
        .sd-metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .sd-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .sd-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .sd-metric {
          text-align: center;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
        }

        .sd-metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #818cf8;
        }

        .sd-metric-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        /* Breakdown List */
        .sd-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sd-breakdown-item {
          width: 100%;
        }

        .sd-breakdown-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .sd-breakdown-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #7a849c;
        }

        .sd-breakdown-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .sd-priority-label {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 20px;
        }

        .sd-priority-high {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .sd-priority-medium {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .sd-priority-low {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        /* Progress Bar */
        .sd-progress-bar {
          height: 6px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .sd-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .sd-progress-green {
          background: #10b981;
        }

        /* Bar Chart */
        .sd-chart-container {
          padding: 16px 0;
        }

        .sd-bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 12px;
          height: 220px;
        }

        .sd-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: sd-barIn 0.4s ease-out backwards;
        }

        @keyframes sd-barIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sd-bar {
          width: 100%;
          max-width: 50px;
          background: linear-gradient(180deg, #6366f1, #818cf8);
          border-radius: 6px 6px 0 0;
          position: relative;
          transition: height 0.5s ease;
          cursor: pointer;
        }

        .sd-bar:hover {
          background: linear-gradient(180deg, #818cf8, #a5b4fc);
        }

        .sd-bar-value {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          font-weight: 600;
          color: #818cf8;
          white-space: nowrap;
        }

        .sd-bar-label {
          font-size: 0.65rem;
          color: #7a849c;
          text-align: center;
        }

        /* Key Metrics */
        .sd-key-metrics {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sd-key-metric {
          text-align: center;
          padding: 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
        }

        .sd-key-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .sd-key-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .sd-key-trend {
          font-size: 0.65rem;
          color: #3d4459;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sd-card {
            padding: 20px;
          }

          .sd-bar-chart {
            height: 180px;
          }

          .sd-bar {
            max-width: 40px;
          }

          .sd-bar-value {
            font-size: 0.6rem;
            top: -18px;
          }

          .sd-bar-label {
            font-size: 0.55rem;
          }
        }

        @media (max-width: 480px) {
          .sd-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .sd-bar-chart {
            gap: 8px;
          }

          .sd-bar {
            max-width: 35px;
          }
        }
      `}</style>
    </div>
  );
}