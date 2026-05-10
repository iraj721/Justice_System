// frontend/src/features/dashboard/ProfilePage.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";
import { getToken, getUser } from "../../shared/services/auth";

type ProfileData = {
  user_info: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone_number: string;
    alternative_phone: string;
    address: string;
    city: string;
    district: string;
    province: string;
    postal_code: string;
    member_since: string;
    last_login: string;
  };
  statistics: {
    total_firs_filed: number;
    total_cases: number;
    active_cases: number;
    resolved_cases: number;
    evidence_submitted: number;
  };
  notification_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    case_updates: boolean;
    hearing_reminders: boolean;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    description?: string;
    date: string;
    status: string;
    icon: string;
  }>;
};

type FIRWithDetails = {
  fir_id: string;
  fir_number: string;
  incident_title: string;
  incident_description: string;
  status: string;
  created_at: string;
  progress_percentage: number;
  current_stage: string;
  timeline: Array<{
    date: string;
    event: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export function ProfilePage({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myFirs, setMyFirs] = useState<FIRWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [formData, setFormData] = useState<any>({});
  const [passwordData, setPasswordData] = useState({ old_password: "", new_password: "" });
  const [notificationPrefs, setNotificationPrefs] = useState<any>({});
  const [message, setMessage] = useState("");
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    loadProfile();
    loadMyFirs();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiRequest<ProfileData>("/user/profile", { token: token! });
      setProfile(data);
      setFormData(data.user_info);
      setNotificationPrefs(data.notification_preferences);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyFirs() {
    try {
      const data = await apiRequest<FIRWithDetails[]>("/user/my-firs", { token: token! });
      setMyFirs(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateProfile() {
    try {
      await apiRequest("/user/profile", {
        method: "PUT",
        token: token!,
        body: formData
      });
      setEditing(false);
      await loadProfile();
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Update failed");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiRequest("/user/change-password", {
        method: "POST",
        token: token!,
        body: passwordData
      });
      setChangingPassword(false);
      setPasswordData({ old_password: "", new_password: "" });
      setMessage("✅ Password changed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to change password");
    }
  }

  async function updateNotificationPrefs() {
    try {
      await apiRequest("/user/notification-preferences", {
        method: "PUT",
        token: token!,
        body: notificationPrefs
      });
      setMessage("✅ Notification preferences updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Update failed");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      "SUBMITTED": "#f59e0b",
      "UNDER_REVIEW": "#3b82f6",
      "ACCEPTED": "#10b981",
      "REJECTED": "#ef4444",
      "UNDER_INVESTIGATION": "#8b5cf6",
    };
    return (
      <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Message */}
      {message && (
        <div className="card" style={{ background: message.includes("✅") ? "#d1fae5" : "#fee2e2", borderColor: message.includes("✅") ? "#10b981" : "#ef4444" }}>
          <p style={{ margin: 0, color: message.includes("✅") ? "#065f46" : "#991b1b" }}>{message}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="card" style={{ textAlign: "center", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white" }}>
        <div style={{ fontSize: "80px", marginBottom: "16px" }}>👤</div>
        <h2 style={{ margin: 0, color: "white" }}>{profile?.user_info.full_name}</h2>
        <p style={{ opacity: 0.8 }}>{profile?.user_info.email}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
          <button onClick={() => setEditing(!editing)} style={{ background: "#3b82f6", cursor: "pointer" }}>
            {editing ? "Cancel" : "✏️ Edit Profile"}
          </button>
          <button onClick={() => setChangingPassword(!changingPassword)} style={{ background: "#8b5cf6", cursor: "pointer" }}>
            🔒 Change Password
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px" }}>📋</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{profile?.statistics.total_firs_filed}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>FIRs Filed</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px" }}>⚖️</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{profile?.statistics.active_cases}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Active Cases</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px" }}>✅</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{profile?.statistics.resolved_cases}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Resolved Cases</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px" }}>📎</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{profile?.statistics.evidence_submitted}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Evidence Items</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        <button onClick={() => setActiveSubTab("overview")} style={{ background: activeSubTab === "overview" ? "#3b82f6" : "transparent", color: activeSubTab === "overview" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          📊 Overview
        </button>
        <button onClick={() => setActiveSubTab("firs")} style={{ background: activeSubTab === "firs" ? "#3b82f6" : "transparent", color: activeSubTab === "firs" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          📋 My FIRs ({myFirs.length})
        </button>
        <button onClick={() => setActiveSubTab("notifications")} style={{ background: activeSubTab === "notifications" ? "#3b82f6" : "transparent", color: activeSubTab === "notifications" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          🔔 Notifications
        </button>
        <button onClick={() => setActiveSubTab("activity")} style={{ background: activeSubTab === "activity" ? "#3b82f6" : "transparent", color: activeSubTab === "activity" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          🕐 Activity
        </button>
      </div>

      {/* Overview Tab */}
      {activeSubTab === "overview" && (
        <>
          {/* Profile Information */}
          <div className="card">
            <h3>📋 Personal Information</h3>
            {editing ? (
              <div className="form-grid">
                <label>Full Name</label>
                <input value={formData.full_name || ""} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                
                <label>Phone Number</label>
                <input value={formData.phone_number || ""} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} placeholder="0300-1234567" />
                
                <label>Alternative Phone</label>
                <input value={formData.alternative_phone || ""} onChange={(e) => setFormData({...formData, alternative_phone: e.target.value})} />
                
                <label>Address</label>
                <textarea value={formData.address || ""} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={2} />
                
                <label>City</label>
                <input value={formData.city || ""} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                
                <label>District</label>
                <input value={formData.district || ""} onChange={(e) => setFormData({...formData, district: e.target.value})} />
                
                <label>Province</label>
                <select value={formData.province || ""} onChange={(e) => setFormData({...formData, province: e.target.value})}>
                  <option value="">Select Province</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="KPK">KPK</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Islamabad">Islamabad</option>
                </select>
                
                <label>Postal Code</label>
                <input value={formData.postal_code || ""} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
                
                <button onClick={handleUpdateProfile} style={{ background: "#10b981", cursor: "pointer" }}>Save Changes</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                <div><strong>📞 Phone:</strong> {profile?.user_info.phone_number || "Not set"}</div>
                <div><strong>📱 Alternative:</strong> {profile?.user_info.alternative_phone || "Not set"}</div>
                <div><strong>📍 Address:</strong> {profile?.user_info.address || "Not set"}</div>
                <div><strong>🏙️ City:</strong> {profile?.user_info.city || "Not set"}</div>
                <div><strong>🗺️ District:</strong> {profile?.user_info.district || "Not set"}</div>
                <div><strong>🏛️ Province:</strong> {profile?.user_info.province || "Not set"}</div>
                <div><strong>📮 Postal Code:</strong> {profile?.user_info.postal_code || "Not set"}</div>
                <div><strong>📅 Member Since:</strong> {new Date(profile?.user_info.member_since || "").toLocaleDateString()}</div>
                {profile?.user_info.last_login && <div><strong>🔐 Last Login:</strong> {new Date(profile?.user_info.last_login).toLocaleString()}</div>}
              </div>
            )}
          </div>

          {/* Change Password Modal */}
          {changingPassword && (
            <div className="card">
              <h3>🔒 Change Password</h3>
              <form className="form-grid" onSubmit={handleChangePassword}>
                <label>Current Password</label>
                <input type="password" value={passwordData.old_password} onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})} required />
                <label>New Password</label>
                <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} required minLength={6} />
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="button" onClick={() => setChangingPassword(false)} style={{ background: "#6b7280", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ background: "#ef4444", cursor: "pointer" }}>Update Password</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* My FIRs Tab */}
      {activeSubTab === "firs" && (
        <div className="card">
          <h3>📋 My FIRs ({myFirs.length})</h3>
          {myFirs.length === 0 ? (
            <p>No FIRs filed yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {myFirs.map((fir) => (
                <div key={fir.fir_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                    <div>
                      <strong style={{ fontSize: "16px" }}>{fir.fir_number}</strong>
                      <span style={{ marginLeft: "12px" }}>{getStatusBadge(fir.status)}</span>
                    </div>
                    <span style={{ fontSize: "14px", color: "#666" }}>{new Date(fir.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h4 style={{ margin: "8px 0" }}>{fir.incident_title}</h4>
                  <p style={{ fontSize: "14px", color: "#666" }}>{fir.incident_description?.substring(0, 150)}...</p>
                  
                  {/* Progress Bar */}
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Progress</span>
                      <span>{fir.progress_percentage}%</span>
                    </div>
                    <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${fir.progress_percentage}%`, height: "100%", background: "#10b981", transition: "width 0.3s" }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                      Current: {fir.current_stage}
                    </p>
                  </div>
                  
                  {/* Timeline */}
                  <details style={{ marginTop: "12px" }}>
                    <summary style={{ cursor: "pointer", color: "#3b82f6", fontSize: "14px" }}>📅 View Timeline</summary>
                    <div style={{ marginTop: "12px", borderLeft: "2px solid #e2e8f0", paddingLeft: "16px" }}>
                      {fir.timeline.map((event, idx) => (
                        <div key={idx} style={{ marginBottom: "12px", position: "relative" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{event.icon}</span>
                            <div>
                              <div><strong>{event.event}</strong></div>
                              <div style={{ fontSize: "12px", color: "#666" }}>{event.description}</div>
                              <div style={{ fontSize: "11px", color: "#999" }}>{new Date(event.date).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <button 
                    onClick={() => onTabChange && onTabChange("track")}
                    style={{ marginTop: "12px", background: "#3b82f6", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                  >
                    🔍 Track Case
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeSubTab === "notifications" && (
        <div className="card">
          <h3>🔔 Notification Preferences</h3>
          <div className="form-grid">
            <label>
              <input 
                type="checkbox" 
                checked={notificationPrefs.email_notifications} 
                onChange={(e) => setNotificationPrefs({...notificationPrefs, email_notifications: e.target.checked})}
              />
              📧 Email Notifications
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={notificationPrefs.sms_notifications} 
                onChange={(e) => setNotificationPrefs({...notificationPrefs, sms_notifications: e.target.checked})}
              />
              📱 SMS Notifications
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={notificationPrefs.case_updates} 
                onChange={(e) => setNotificationPrefs({...notificationPrefs, case_updates: e.target.checked})}
              />
              ⚖️ Case Updates
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={notificationPrefs.hearing_reminders} 
                onChange={(e) => setNotificationPrefs({...notificationPrefs, hearing_reminders: e.target.checked})}
              />
              🏛️ Hearing Reminders
            </label>
            <button onClick={updateNotificationPrefs} style={{ background: "#10b981", cursor: "pointer" }}>Save Preferences</button>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeSubTab === "activity" && (
        <div className="card">
          <h3>🕐 Recent Activity</h3>
          {profile?.recent_activity.length === 0 ? (
            <p>No recent activity</p>
          ) : (
            <div>
              {profile?.recent_activity.map((activity, idx) => (
                <div key={idx} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{activity.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div><strong>{activity.title}</strong></div>
                    {activity.description && <div style={{ fontSize: "12px", color: "#666" }}>{activity.description}</div>}
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{new Date(activity.date).toLocaleString()}</div>
                  </div>
                  {activity.status && (
                    <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
                      {activity.status.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3>⚡ Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => onTabChange && onTabChange("fir")} style={{ background: "#3b82f6", cursor: "pointer" }}>
            📝 File New FIR
          </button>
          <button onClick={() => onTabChange && onTabChange("my-firs")} style={{ background: "#8b5cf6", cursor: "pointer" }}>
            📋 View My FIRs
          </button>
          <button onClick={() => onTabChange && onTabChange("track")} style={{ background: "#10b981", cursor: "pointer" }}>
            🔍 Track Case
          </button>
        </div>
      </div>
    </div>
  );
}