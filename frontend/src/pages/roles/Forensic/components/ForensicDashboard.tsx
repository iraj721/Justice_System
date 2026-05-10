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
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);

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

  function getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      "ANALYSIS_STARTED": "🔬",
      "ANALYSIS_COMPLETED": "✅",
      "REPORT_GENERATED": "📄",
      "TRANSFERRED": "📤"
    };
    return icons[type] || "📋";
  }

  function getActivityLabel(type: string): string {
    const labels: Record<string, string> = {
      "ANALYSIS_STARTED": "Started Analysis",
      "ANALYSIS_COMPLETED": "Completed Analysis",
      "REPORT_GENERATED": "Generated Report",
      "TRANSFERRED": "Transferred Evidence"
    };
    return labels[type] || type.replace(/_/g, " ");
  }

  if (loading) {
    return (
      <div className="fd-loading">
        <div className="fd-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="fd-empty-state">
        <div className="fd-empty-icon">📊</div>
        <h4>No Data Available</h4>
        <p>Statistics will appear once you have evidence data</p>
      </div>
    );
  }

  return (
    <div className="fd-dashboard">
      {/* Stats Overview Cards */}
      <div className="fd-stats-grid">
        <div className="fd-stat-card">
          <div className="fd-stat-icon">📊</div>
          <div className="fd-stat-value">{stats.overview.total_evidence}</div>
          <div className="fd-stat-label">Total Evidence</div>
          <div className="fd-stat-sub">In the system</div>
        </div>
        <div className="fd-stat-card">
          <div className="fd-stat-icon">⏳</div>
          <div className="fd-stat-value">{stats.overview.pending}</div>
          <div className="fd-stat-label">Pending</div>
          <div className="fd-stat-sub">Awaiting analysis</div>
        </div>
        <div className="fd-stat-card">
          <div className="fd-stat-icon">🔬</div>
          <div className="fd-stat-value">{stats.overview.in_progress}</div>
          <div className="fd-stat-label">In Progress</div>
          <div className="fd-stat-sub">Being analyzed</div>
        </div>
        <div className="fd-stat-card">
          <div className="fd-stat-icon">✅</div>
          <div className="fd-stat-value">{stats.overview.completed}</div>
          <div className="fd-stat-label">Completed</div>
          <div className="fd-stat-sub">Analysis done</div>
        </div>
      </div>

      {/* Completion Rate Card */}
      <div className="fd-card fd-fade-up">
        <div className="fd-card-header">
          <div className="fd-card-icon">📈</div>
          <div>
            <h3>Overall Completion Rate</h3>
            <p>Progress of all evidence analysis</p>
          </div>
        </div>
        <div className="fd-progress-section">
          <div className="fd-progress-header">
            <span>Completion Progress</span>
            <span className="fd-progress-percent">{stats.completion_rate}%</span>
          </div>
          <div className="fd-progress-bar">
            <div className="fd-progress-fill" style={{ width: `${stats.completion_rate}%` }} />
          </div>
          <div className="fd-progress-stats">
            <span>{stats.overview.completed} completed</span>
            <span>{stats.overview.total_evidence - stats.overview.completed} remaining</span>
          </div>
        </div>
      </div>

      {/* Priority & Analysis Types */}
      <div className="fd-two-columns">
        {/* By Priority */}
        <div className="fd-card fd-fade-up">
          <div className="fd-card-header small">
            <div className="fd-card-icon">🎯</div>
            <div>
              <h3>By Priority</h3>
              <p>Distribution by priority level</p>
            </div>
          </div>
          <div className="fd-priority-list">
            <div className="fd-priority-item">
              <div className="fd-priority-header">
                <span className="fd-priority-label fd-priority-high">🔴 High Priority</span>
                <span className="fd-priority-count">{stats.by_priority.HIGH}</span>
              </div>
              <div className="fd-progress-bar-small">
                <div 
                  className="fd-progress-fill fd-progress-high" 
                  style={{ width: `${(stats.by_priority.HIGH / stats.overview.total_evidence) * 100}%` }}
                />
              </div>
            </div>
            <div className="fd-priority-item">
              <div className="fd-priority-header">
                <span className="fd-priority-label fd-priority-medium">🟡 Medium Priority</span>
                <span className="fd-priority-count">{stats.by_priority.MEDIUM}</span>
              </div>
              <div className="fd-progress-bar-small">
                <div 
                  className="fd-progress-fill fd-progress-medium" 
                  style={{ width: `${(stats.by_priority.MEDIUM / stats.overview.total_evidence) * 100}%` }}
                />
              </div>
            </div>
            <div className="fd-priority-item">
              <div className="fd-priority-header">
                <span className="fd-priority-label fd-priority-low">🟢 Low Priority</span>
                <span className="fd-priority-count">{stats.by_priority.LOW}</span>
              </div>
              <div className="fd-progress-bar-small">
                <div 
                  className="fd-progress-fill fd-progress-low" 
                  style={{ width: `${(stats.by_priority.LOW / stats.overview.total_evidence) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Types */}
        <div className="fd-card fd-fade-up">
          <div className="fd-card-header small">
            <div className="fd-card-icon">🔬</div>
            <div>
              <h3>Analysis Types</h3>
              <p>Distribution by analysis method</p>
            </div>
          </div>
          <div className="fd-analysis-list">
            {Object.entries(stats.analysis_types).map(([type, count]) => {
              const percentage = stats.overview.completed > 0 
                ? (count / stats.overview.completed) * 100 
                : 0;
              return (
                <div key={type} className="fd-analysis-item">
                  <div className="fd-analysis-header">
                    <span className="fd-analysis-label">{type.replace(/_/g, " ")}</span>
                    <span className="fd-analysis-count">{count}</span>
                  </div>
                  <div className="fd-progress-bar-small">
                    <div className="fd-progress-fill fd-progress-purple" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* My Performance Card */}
      <div className="fd-card fd-fade-up">
        <div className="fd-card-header">
          <div className="fd-card-icon">⭐</div>
          <div>
            <h3>My Performance</h3>
            <p>Your personal analytics overview</p>
          </div>
        </div>
        <div className="fd-performance-grid">
          <div className="fd-performance-item">
            <div className="fd-performance-icon">🔬</div>
            <div className="fd-performance-value">{stats.my_performance.total_analyses}</div>
            <div className="fd-performance-label">Total Analyses</div>
          </div>
          <div className="fd-performance-item">
            <div className="fd-performance-icon">✅</div>
            <div className="fd-performance-value">{stats.my_performance.completed}</div>
            <div className="fd-performance-label">Completed</div>
          </div>
          <div className="fd-performance-item">
            <div className="fd-performance-icon">⏱️</div>
            <div className="fd-performance-value">{stats.my_performance.average_completion_days}</div>
            <div className="fd-performance-label">Avg Days per Analysis</div>
          </div>
          <div className="fd-performance-item">
            <div className="fd-performance-icon">📊</div>
            <div className="fd-performance-value">
              {stats.my_performance.total_analyses > 0 
                ? Math.round((stats.my_performance.completed / stats.my_performance.total_analyses) * 100) 
                : 0}%
            </div>
            <div className="fd-performance-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="fd-card fd-fade-up">
          <div className="fd-card-header">
            <div className="fd-card-icon">🕐</div>
            <div>
              <h3>Recent Activity</h3>
              <p>Latest actions in the forensic lab</p>
            </div>
            <span className="fd-badge">{recentActivity.length} activities</span>
          </div>
          <div className="fd-activity-list">
            {recentActivity.map((activity, idx) => (
              <div 
                key={idx} 
                className={`fd-activity-item ${hoveredActivity === idx ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredActivity(idx)}
                onMouseLeave={() => setHoveredActivity(null)}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="fd-activity-icon">{getActivityIcon(activity.type)}</div>
                <div className="fd-activity-content">
                  <div className="fd-activity-title">
                    <strong>{getActivityLabel(activity.type)}</strong>
                    <span className="fd-activity-evidence">{activity.title}</span>
                  </div>
                  <div className="fd-activity-meta">
                    <span className="fd-activity-by">By: {activity.by}</span>
                    <span className="fd-activity-date">{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        /* Forensic Dashboard Styles - Indigo Theme */
        .fd-dashboard {
          animation: fd-fadeIn 0.4s ease-out;
        }

        @keyframes fd-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fd-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fd-fade-up {
          animation: fd-fadeUp 0.5s ease-out backwards;
        }

        /* Loading */
        .fd-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
          gap: 16px;
        }

        .fd-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: fd-spin 0.8s linear infinite;
        }

        @keyframes fd-spin {
          to { transform: rotate(360deg); }
        }

        .fd-loading p {
          color: #7a849c;
        }

        /* Empty State */
        .fd-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }

        .fd-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .fd-empty-state h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .fd-empty-state p {
          color: #7a849c;
        }

        /* Stats Grid */
        .fd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .fd-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .fd-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .fd-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .fd-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .fd-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .fd-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .fd-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
          margin-top: 4px;
        }

        .fd-stat-sub {
          font-size: 0.65rem;
          color: #3d4459;
          margin-top: 2px;
        }

        /* Cards */
        .fd-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .fd-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .fd-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .fd-card-header.small {
          margin-bottom: 16px;
          padding-bottom: 10px;
        }

        .fd-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .fd-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .fd-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        .fd-badge {
          margin-left: auto;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* Progress Section */
        .fd-progress-section {
          margin-top: 8px;
        }

        .fd-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.8rem;
          color: #7a849c;
        }

        .fd-progress-percent {
          font-weight: 600;
          color: #10b981;
        }

        .fd-progress-bar {
          height: 10px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 5px;
          overflow: hidden;
        }

        .fd-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 5px;
          transition: width 0.5s ease;
        }

        .fd-progress-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        /* Two Columns */
        .fd-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .fd-two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* Priority List */
        .fd-priority-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fd-priority-item {
          width: 100%;
        }

        .fd-priority-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .fd-priority-label {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .fd-priority-high {
          color: #ef4444;
        }

        .fd-priority-medium {
          color: #f59e0b;
        }

        .fd-priority-low {
          color: #10b981;
        }

        .fd-priority-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .fd-progress-bar-small {
          height: 6px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .fd-progress-high {
          background: #ef4444;
        }

        .fd-progress-medium {
          background: #f59e0b;
        }

        .fd-progress-low {
          background: #10b981;
        }

        .fd-progress-purple {
          background: #8b5cf6;
        }

        /* Analysis List */
        .fd-analysis-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fd-analysis-item {
          width: 100%;
        }

        .fd-analysis-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .fd-analysis-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #7a849c;
        }

        .fd-analysis-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        /* Performance Grid */
        .fd-performance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 600px) {
          .fd-performance-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .fd-performance-item {
          text-align: center;
          padding: 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          transition: all 0.3s;
        }

        .fd-performance-item:hover {
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .fd-performance-icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .fd-performance-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8ecf8;
        }

        .fd-performance-label {
          font-size: 0.65rem;
          color: #7a849c;
          margin-top: 4px;
        }

        /* Activity List */
        .fd-activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fd-activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          transition: all 0.3s;
          animation: fd-slideIn 0.3s ease-out backwards;
        }

        @keyframes fd-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fd-activity-item.hovered {
          background: rgba(12, 15, 26, 0.8);
          transform: translateX(4px);
        }

        .fd-activity-icon {
          font-size: 1.5rem;
        }

        .fd-activity-content {
          flex: 1;
        }

        .fd-activity-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .fd-activity-title strong {
          font-size: 0.85rem;
          color: #e8ecf8;
        }

        .fd-activity-evidence {
          font-size: 0.8rem;
          color: #818cf8;
        }

        .fd-activity-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .fd-activity-by {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .fd-activity-date {
          font-size: 0.65rem;
          color: #3d4459;
        }
      `}</style>
    </div>
  );
}