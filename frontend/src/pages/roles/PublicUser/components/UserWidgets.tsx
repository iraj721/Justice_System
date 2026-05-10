// frontend/src/pages/roles/PublicUser/components/UserWidgets.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type DashboardStats = {
  total_firs: number;
  status_breakdown: Record<string, number>;
  recent_firs: Array<{
    fir_number: string;
    incident_title: string;
    status: string;
    created_at: string;
  }>;
};

type ActivityItem = {
  type: string;
  title: string;
  date: string;
  status: string;
  icon: string;
};

export function UserWidgets({ token, onTabChange }: { token: string; onTabChange?: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, profileData] = await Promise.all([
        apiRequest<DashboardStats>("/user/dashboard-stats", { token }).catch(() => null),
        apiRequest<any>("/user/profile", { token }).catch(() => null)
      ]);
      
      setStats(statsData);
      
      if (statsData?.recent_firs) {
        const acts = statsData.recent_firs.map(fir => ({
          type: "FIR",
          title: fir.incident_title,
          date: new Date(fir.created_at).toLocaleDateString(),
          status: fir.status,
          icon: getStatusIcon(fir.status)
        }));
        setActivities(acts);
      }
      
      if (profileData?.recent_activity) {
        setActivities(prev => [...prev, ...profileData.recent_activity.slice(0, 3)]);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  function getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      "SUBMITTED": "📋",
      "UNDER_REVIEW": "🔍",
      "ACCEPTED": "✅",
      "REJECTED": "❌",
      "UNDER_INVESTIGATION": "🔬",
      "DECIDED": "⚖️"
    };
    return icons[status] || "📌";
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      "SUBMITTED": "#f97316",
      "UNDER_REVIEW": "#6366f1",
      "ACCEPTED": "#22c55e",
      "UNDER_INVESTIGATION": "#a855f7",
      "REJECTED": "#ef4444",
      "DECIDED": "#64748b"
    };
    return colors[status] || "#64748b";
  }

  const quickActions = [
    { id: "fir", label: "File New FIR", icon: "📝", description: "Register new complaint" },
    { id: "drafts", label: "My Drafts", icon: "💾", description: "Saved drafts" },
    { id: "documents", label: "My Documents", icon: "📎", description: "Uploaded files" },
    { id: "share", label: "Share Case", icon: "👥", description: "Share with authorized parties" }
  ];

  if (loading) {
    return (
      <div className="uw-loading">
        <div className="uw-shimmer-card">
          <div className="uw-shimmer"></div>
        </div>
        <div className="uw-shimmer-card">
          <div className="uw-shimmer"></div>
        </div>
        <div className="uw-shimmer-card">
          <div className="uw-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="uw-dashboard">
      {/* Quick Action Buttons - Professional Design */}
      <div className="uw-actions">
        {quickActions.map((action, idx) => (
          <button
            key={action.id}
            className="uw-action-btn"
            onClick={() => onTabChange?.(action.id)}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <span className="uw-action-icon">{action.icon}</span>
            <div className="uw-action-content">
              <span className="uw-action-text">{action.label}</span>
              <span className="uw-action-desc">{action.description}</span>
            </div>
            <span className="uw-action-arrow">→</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="uw-stats">
        <div 
          className={`uw-stat-card ${hoveredCard === "total" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("total")}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => onTabChange?.("my-firs")}
        >
          <div className="uw-stat-icon">📋</div>
          <div className="uw-stat-value">{stats?.total_firs || 0}</div>
          <div className="uw-stat-label">Total FIRs</div>
          <div className="uw-stat-trend">All cases</div>
        </div>
        
        <div 
          className={`uw-stat-card ${hoveredCard === "pending" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("pending")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="uw-stat-icon">⏳</div>
          <div className="uw-stat-value uw-stat-pending">{stats?.status_breakdown?.SUBMITTED || 0}</div>
          <div className="uw-stat-label">Pending Review</div>
          <div className="uw-stat-trend warning">Awaiting response</div>
        </div>
        
        <div 
          className={`uw-stat-card ${hoveredCard === "accepted" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("accepted")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="uw-stat-icon">✅</div>
          <div className="uw-stat-value uw-stat-accepted">{stats?.status_breakdown?.ACCEPTED || 0}</div>
          <div className="uw-stat-label">Accepted</div>
          <div className="uw-stat-trend success">Under process</div>
        </div>
        
        <div 
          className={`uw-stat-card ${hoveredCard === "investigation" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("investigation")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="uw-stat-icon">🔬</div>
          <div className="uw-stat-value uw-stat-investigation">{stats?.status_breakdown?.UNDER_INVESTIGATION || 0}</div>
          <div className="uw-stat-label">Investigation</div>
          <div className="uw-stat-trend">Active case</div>
        </div>
      </div>

      {/* Recent FIRs Section */}
      <div className="uw-section uw-fade-up">
        <div className="uw-section-header">
          <div className="uw-section-title-wrap">
            <span className="uw-section-icon">📋</span>
            <h3 className="uw-section-title">Recent FIRs</h3>
          </div>
          <button className="uw-view-all" onClick={() => onTabChange?.("my-firs")}>
            View All <span>→</span>
          </button>
        </div>
        {stats?.recent_firs?.length === 0 ? (
          <div className="uw-empty">
            <div className="uw-empty-icon">📭</div>
            <p>No FIRs filed yet.</p>
            <button className="uw-link-btn" onClick={() => onTabChange?.("fir")}>
              File your first FIR
            </button>
          </div>
        ) : (
          <div className="uw-fir-list">
            {stats?.recent_firs?.slice(0, 3).map((fir, idx) => (
              <div key={idx} className="uw-fir-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="uw-fir-info">
                  <span className="uw-fir-number">{fir.fir_number}</span>
                  <span className="uw-fir-title">{fir.incident_title}</span>
                  <span className="uw-fir-date">{new Date(fir.created_at).toLocaleDateString()}</span>
                </div>
                <span 
                  className="uw-status-badge" 
                  style={{ background: `${getStatusColor(fir.status)}10`, color: getStatusColor(fir.status) }}
                >
                  {getStatusIcon(fir.status)} {fir.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      {activities.length > 0 && (
        <div className="uw-section uw-fade-up">
          <div className="uw-section-header">
            <div className="uw-section-title-wrap">
              <span className="uw-section-icon">🕐</span>
              <h3 className="uw-section-title">Recent Activity</h3>
            </div>
          </div>
          <div className="uw-activity-list">
            {activities.slice(0, 4).map((activity, idx) => (
              <div key={idx} className="uw-activity-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="uw-activity-icon">{activity.icon}</div>
                <div className="uw-activity-content">
                  <div className="uw-activity-title">{activity.title}</div>
                  <div className="uw-activity-date">{activity.date}</div>
                </div>
                {activity.status && (
                  <span 
                    className="uw-activity-status"
                    style={{ background: `${getStatusColor(activity.status)}10`, color: getStatusColor(activity.status) }}
                  >
                    {activity.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="uw-help">
        <div className="uw-help-icon">❓</div>
        <div className="uw-help-content">
          <h4>Need assistance?</h4>
          <p>Our support team is available 24/7 to help you with any questions.</p>
          <div className="uw-help-links">
            <button className="uw-help-link" onClick={() => onTabChange?.("help")}>
              📖 Visit Help Center
            </button>
            <span className="uw-help-sep">|</span>
            <span className="uw-help-phone">📞 Emergency: 15</span>
            <span className="uw-help-sep">|</span>
            <span className="uw-help-phone">📱 Helpline: 1234</span>
          </div>
        </div>
      </div>

      <style>{`
        .uw-dashboard {
          padding: 28px;
          animation: uw-fadeIn 0.4s ease-out;
        }

        @keyframes uw-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Shimmer Loading */
        .uw-loading {
          padding: 24px;
        }

        .uw-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 10px;
          height: 80px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .uw-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: uw-shimmer 1.5s infinite;
        }

        @keyframes uw-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Quick Actions - Professional & Clean */
        .uw-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .uw-action-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(12, 15, 26, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .uw-action-btn::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .uw-action-btn:hover::before {
          transform: scaleX(1);
        }

        .uw-action-btn:hover {
          background: rgba(12, 15, 26, 0.8);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }

        .uw-action-icon {
          font-size: 1.5rem;
          opacity: 0.9;
        }

        .uw-action-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .uw-action-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
        }

        .uw-action-desc {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .uw-action-arrow {
          font-size: 1rem;
          color: #6366f1;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
        }

        .uw-action-btn:hover .uw-action-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Stats Cards - FIXED SPACING */
        .uw-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .uw-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .uw-stat-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .uw-stat-card:hover::after {
          transform: scaleX(1);
        }

        .uw-stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(12, 15, 26, 0.8);
        }

        .uw-stat-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .uw-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #e8ecf8;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .uw-stat-pending {
          color: #f97316;
        }

        .uw-stat-accepted {
          color: #22c55e;
        }

        .uw-stat-investigation {
          color: #a855f7;
        }

        .uw-stat-label {
          font-size: 0.75rem;
          color: #7a849c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .uw-stat-trend {
          font-size: 0.68rem;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          background: rgba(255,255,255,0.04);
          color: #7a849c;
        }

        .uw-stat-trend.warning {
          color: #f97316;
          background: rgba(249, 115, 22, 0.08);
        }

        .uw-stat-trend.success {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
        }

        /* Sections */
        .uw-section {
          background: rgba(12, 15, 26, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }

        .uw-section:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .uw-fade-up {
          animation: uw-fadeUp 0.5s ease-out backwards;
        }

        @keyframes uw-fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .uw-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .uw-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .uw-section-icon {
          font-size: 1.1rem;
          opacity: 0.8;
        }

        .uw-section-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0;
          letter-spacing: -0.2px;
        }

        .uw-view-all {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .uw-view-all:hover {
          color: #a5b4fc;
          gap: 8px;
        }

        /* FIR List */
        .uw-fir-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .uw-fir-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
          transition: all 0.3s;
          animation: uw-slideIn 0.3s ease-out backwards;
          cursor: pointer;
        }

        @keyframes uw-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .uw-fir-item:hover {
          background: rgba(12, 15, 26, 0.9);
          transform: translateX(4px);
          border-left: 2px solid #6366f1;
        }

        .uw-fir-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .uw-fir-number {
          font-size: 0.7rem;
          font-weight: 600;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 10px;
          border-radius: 20px;
          display: inline-block;
          width: fit-content;
        }

        .uw-fir-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e8ecf8;
        }

        .uw-fir-date {
          font-size: 0.68rem;
          color: #3d4459;
        }

        .uw-status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        /* Activity */
        .uw-activity-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .uw-activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
          transition: all 0.3s;
          animation: uw-slideIn 0.3s ease-out backwards;
        }

        .uw-activity-item:hover {
          background: rgba(12, 15, 26, 0.9);
          transform: translateX(4px);
        }

        .uw-activity-icon {
          font-size: 1.3rem;
          opacity: 0.8;
        }

        .uw-activity-content {
          flex: 1;
        }

        .uw-activity-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .uw-activity-date {
          font-size: 0.68rem;
          color: #3d4459;
        }

        .uw-activity-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 500;
        }

        /* Help Section */
        .uw-help {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(129, 140, 248, 0.03));
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 20px 24px;
          transition: all 0.3s;
        }

        .uw-help:hover {
          border-color: rgba(99, 102, 241, 0.25);
          transform: translateY(-2px);
        }

        .uw-help-icon {
          font-size: 1.8rem;
          opacity: 0.8;
        }

        .uw-help-content h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .uw-help-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 12px;
        }

        .uw-help-links {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }

        .uw-help-link {
          background: none;
          border: none;
          color: #818cf8;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
          padding: 4px 0;
        }

        .uw-help-link:hover {
          color: #a5b4fc;
          transform: translateX(2px);
        }

        .uw-help-sep {
          color: #3d4459;
        }

        .uw-help-phone {
          font-size: 0.75rem;
          color: #7a849c;
        }

        .uw-link-btn {
          background: none;
          border: none;
          color: #818cf8;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s;
          padding: 8px 16px;
          border-radius: 6px;
        }

        .uw-link-btn:hover {
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.1);
        }

        .uw-empty {
          text-align: center;
          padding: 40px 20px;
        }

        .uw-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .uw-empty p {
          color: #7a849c;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .uw-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .uw-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .uw-dashboard {
            padding: 16px;
          }

          .uw-actions {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .uw-action-btn {
            padding: 14px 18px;
          }

          .uw-action-text {
            font-size: 0.85rem;
          }

          .uw-action-desc {
            font-size: 0.65rem;
          }

          .uw-stats {
            gap: 12px;
          }

          .uw-stat-card {
            padding: 18px 12px;
          }

          .uw-stat-value {
            font-size: 1.6rem;
          }

          .uw-stat-icon {
            font-size: 1.6rem;
            margin-bottom: 8px;
          }

          .uw-section {
            padding: 16px;
          }

          .uw-fir-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .uw-activity-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .uw-help {
            flex-direction: column;
            text-align: center;
          }

          .uw-help-links {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .uw-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}