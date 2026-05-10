// frontend/src/features/dashboard/UserWidgets.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

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
      
      // Convert recent FIRs to activities
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
      setLoading(false);
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
      "SUBMITTED": "#f59e0b",
      "UNDER_REVIEW": "#3b82f6",
      "ACCEPTED": "#10b981",
      "UNDER_INVESTIGATION": "#8b5cf6",
      "DECIDED": "#6b7280"
    };
    return colors[status] || "#6b7280";
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Quick Action Buttons */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button onClick={() => onTabChange?.("fir")} style={{ background: "#3b82f6", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", border: "none", color: "white" }}>
          📝 File New FIR
        </button>
        <button onClick={() => onTabChange?.("drafts")} style={{ background: "#f59e0b", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", border: "none", color: "white" }}>
          💾 My Drafts
        </button>
        <button onClick={() => onTabChange?.("documents")} style={{ background: "#10b981", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", border: "none", color: "white" }}>
          📎 My Documents
        </button>
        <button onClick={() => onTabChange?.("share")} style={{ background: "#8b5cf6", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", border: "none", color: "white" }}>
          👥 Share Case
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="card" style={{ textAlign: "center", cursor: "pointer" }} onClick={() => onTabChange?.("my-firs")}>
          <div style={{ fontSize: "40px" }}>📋</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6" }}>{stats?.total_firs || 0}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total FIRs</div>
        </div>
        
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px" }}>⏳</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{stats?.status_breakdown?.SUBMITTED || 0}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Pending</div>
        </div>
        
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px" }}>✅</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{stats?.status_breakdown?.ACCEPTED || 0}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Accepted</div>
        </div>
        
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px" }}>⚖️</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>{stats?.status_breakdown?.UNDER_INVESTIGATION || 0}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Investigation</div>
        </div>
      </div>

      {/* Recent FIRs */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3>📋 Recent FIRs</h3>
        {stats?.recent_firs?.length === 0 ? (
          <p>No FIRs filed yet. <button onClick={() => onTabChange?.("fir")} style={{ background: "none", color: "#3b82f6", cursor: "pointer", border: "none" }}>File your first FIR</button></p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats?.recent_firs?.map((fir, idx) => (
              <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <strong>{fir.fir_number}</strong>
                  <div style={{ fontSize: "14px", color: "#666" }}>{fir.incident_title}</div>
                  <div style={{ fontSize: "12px", color: "#999" }}>{new Date(fir.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ background: getStatusColor(fir.status), color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                  {fir.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="card">
          <h3>🕐 Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activities.slice(0, 5).map((activity, idx) => (
              <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>{activity.icon}</span>
                <div style={{ flex: 1 }}>
                  <div><strong>{activity.title}</strong></div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{activity.date}</div>
                </div>
                {activity.status && (
                  <span style={{ background: getStatusColor(activity.status), color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
                    {activity.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card" style={{ background: "#f8fafc" }}>
        <h3>❓ Need Help?</h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <a href="/help" style={{ textDecoration: "none", color: "#3b82f6" }}>📖 Read FAQs</a>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <a href="/help/guides" style={{ textDecoration: "none", color: "#3b82f6" }}>📚 User Guides</a>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <span>📞 Helpline: 1234</span>
        </div>
      </div>
    </div>
  );
}