// frontend/src/pages/roles/PublicUser/components/ProfilePage.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";
import { getToken, getUser } from "../../../../shared/services/auth";

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

export function ProfilePage({
  onTabChange,
}: {
  onTabChange?: (tab: string) => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myFirs, setMyFirs] = useState<FIRWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [formData, setFormData] = useState<any>({});
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [notificationPrefs, setNotificationPrefs] = useState<any>({});
  const [message, setMessage] = useState("");
  const [expandedFir, setExpandedFir] = useState<string | null>(null);
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    loadProfile();
    loadMyFirs();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiRequest<ProfileData>("/user/profile", {
        token: token!,
      });
      setProfile(data);
      setFormData(data.user_info);
      setNotificationPrefs(data.notification_preferences);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function loadMyFirs() {
    try {
      const data = await apiRequest<FIRWithDetails[]>("/user/my-firs", {
        token: token!,
      });
      setMyFirs(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateProfile() {
    try {
      // Create clean payload - only send fields that exist
      const payload: any = {};

      if (formData.full_name) payload.full_name = formData.full_name;
      if (formData.phone_number) payload.phone_number = formData.phone_number;
      if (formData.alternative_phone)
        payload.alternative_phone = formData.alternative_phone;
      if (formData.address) payload.address = formData.address;
      if (formData.city) payload.city = formData.city;
      if (formData.district) payload.district = formData.district;
      if (formData.province) payload.province = formData.province;
      if (formData.postal_code) payload.postal_code = formData.postal_code;

      await apiRequest("/user/profile", {
        method: "PUT",
        token: token!,
        body: payload,
      });
      setEditing(false);
      await loadProfile();
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage(
        "❌ Update failed - " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage("❌ New passwords do not match");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (passwordData.new_password.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    try {
      await apiRequest("/user/change-password", {
        method: "POST",
        token: token!,
        body: {
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        },
      });
      setChangingPassword(false);
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setMessage("✅ Password changed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to change password");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function updateNotificationPrefs() {
    try {
      await apiRequest("/user/notification-preferences", {
        method: "PUT",
        token: token!,
        body: notificationPrefs,
      });
      setMessage("✅ Notification preferences updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Update failed");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function getStatusConfig(status: string) {
    const config: Record<
      string,
      { color: string; bg: string; icon: string; label: string }
    > = {
      SUBMITTED: {
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.08)",
        icon: "📋",
        label: "Submitted",
      },
      UNDER_REVIEW: {
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.08)",
        icon: "🔍",
        label: "Under Review",
      },
      ACCEPTED: {
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.08)",
        icon: "✅",
        label: "Accepted",
      },
      REJECTED: {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.08)",
        icon: "❌",
        label: "Rejected",
      },
      UNDER_INVESTIGATION: {
        color: "#a855f7",
        bg: "rgba(168, 85, 247, 0.08)",
        icon: "🔬",
        label: "Investigation",
      },
    };
    return (
      config[status] || {
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        icon: "📌",
        label: status.replace(/_/g, " "),
      }
    );
  }

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-shimmer-card">
          <div className="pp-shimmer"></div>
        </div>
        <div className="pp-shimmer-card">
          <div className="pp-shimmer"></div>
        </div>
        <div className="pp-shimmer-card">
          <div className="pp-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-dashboard">
      {/* Message Toast */}
      {message && (
        <div
          className={`pp-toast ${message.includes("✅") ? "pp-toast-success" : "pp-toast-error"}`}
        >
          <span>{message}</span>
        </div>
      )}

      {/* Profile Header Card - Indigo Theme */}
      <div className="pp-header-card">
        <div className="pp-avatar">
          <div className="pp-avatar-inner">
            <span>{profile?.user_info.full_name?.charAt(0) || "U"}</span>
          </div>
          <div className="pp-avatar-badge">👤</div>
        </div>
        <div className="pp-header-info">
          <h1 className="pp-header-name">{profile?.user_info.full_name}</h1>
          <p className="pp-header-email">{profile?.user_info.email}</p>
          <div className="pp-header-actions">
            <button
              className="pp-btn pp-btn-primary"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "❌ Cancel" : "✏️ Edit Profile"}
            </button>
            <button
              className="pp-btn pp-btn-secondary"
              onClick={() => setChangingPassword(!changingPassword)}
            >
              🔒 Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Indigo Theme */}
      <div className="pp-stats">
        <div className="pp-stat-card">
          <div className="pp-stat-icon">📋</div>
          <div className="pp-stat-value">
            {profile?.statistics.total_firs_filed}
          </div>
          <div className="pp-stat-label">FIRs Filed</div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon">⚖️</div>
          <div className="pp-stat-value">
            {profile?.statistics.active_cases}
          </div>
          <div className="pp-stat-label">Active Cases</div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon">✅</div>
          <div className="pp-stat-value">
            {profile?.statistics.resolved_cases}
          </div>
          <div className="pp-stat-label">Resolved Cases</div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon">📎</div>
          <div className="pp-stat-value">
            {profile?.statistics.evidence_submitted}
          </div>
          <div className="pp-stat-label">Evidence Items</div>
        </div>
      </div>

      {/* Sub Tabs - Horizontal One Line */}
      <div className="pp-subtabs-container">
        <div className="pp-subtabs">
          <button
            className={`pp-subtab ${activeSubTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveSubTab("overview")}
          >
            <span className="pp-subtab-icon">📊</span>
            <span>Overview</span>
          </button>
          <button
            className={`pp-subtab ${activeSubTab === "firs" ? "active" : ""}`}
            onClick={() => setActiveSubTab("firs")}
          >
            <span className="pp-subtab-icon">📋</span>
            <span>My FIRs</span>
            {myFirs.length > 0 && (
              <span className="pp-subtab-badge">{myFirs.length}</span>
            )}
          </button>
          <button
            className={`pp-subtab ${activeSubTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveSubTab("notifications")}
          >
            <span className="pp-subtab-icon">🔔</span>
            <span>Notifications</span>
          </button>
          <button
            className={`pp-subtab ${activeSubTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveSubTab("activity")}
          >
            <span className="pp-subtab-icon">🕐</span>
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeSubTab === "overview" && (
        <div className="pp-section pp-fade-up">
          {/* Profile Information */}
          <div className="pp-card">
            <div className="pp-card-header">
              <h3>📋 Personal Information</h3>
            </div>
            {editing ? (
              <div className="pp-form">
                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label>Full Name</label>
                    <input
                      value={formData.full_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>Phone Number</label>
                    <input
                      value={formData.phone_number || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                      placeholder="0300-1234567"
                    />
                  </div>
                </div>
                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label>Alternative Phone</label>
                    <input
                      value={formData.alternative_phone || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alternative_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>City</label>
                    <input
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label>District</label>
                    <input
                      value={formData.district || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>Province</label>
                    <div className="pp-select-wrapper">
                      <span className="pp-select-icon">🏛️</span>
                      <select
                        value={formData.province || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, province: e.target.value })
                        }
                      >
                        <option value="">Select Province</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="Khyber Pakhtunkhwa">
                          Khyber Pakhtunkhwa
                        </option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad Capital Territory">
                          Islamabad
                        </option>
                        <option value="Gilgit-Baltistan">
                          Gilgit-Baltistan
                        </option>
                        <option value="Azad Kashmir">Azad Kashmir</option>
                      </select>
                      <span className="pp-select-arrow">▼</span>
                    </div>
                  </div>
                </div>
                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label>Postal Code</label>
                    <input
                      value={formData.postal_code || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>Address</label>
                    <textarea
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </div>
                <div className="pp-form-actions">
                  <button
                    className="pp-btn pp-btn-success"
                    onClick={handleUpdateProfile}
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="pp-info-grid">
                <div className="pp-info-item">
                  <span className="pp-info-icon">📞</span>
                  <div>
                    <strong>Phone</strong>
                    <p>{profile?.user_info.phone_number || "Not set"}</p>
                  </div>
                </div>
                <div className="pp-info-item">
                  <span className="pp-info-icon">📱</span>
                  <div>
                    <strong>Alternative</strong>
                    <p>{profile?.user_info.alternative_phone || "Not set"}</p>
                  </div>
                </div>
                <div className="pp-info-item">
                  <span className="pp-info-icon">📍</span>
                  <div>
                    <strong>Address</strong>
                    <p>{profile?.user_info.address || "Not set"}</p>
                  </div>
                </div>
                <div className="pp-info-item">
                  <span className="pp-info-icon">🏙️</span>
                  <div>
                    <strong>City / District</strong>
                    <p>
                      {profile?.user_info.city || "Not set"},{" "}
                      {profile?.user_info.district || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="pp-info-item">
                  <span className="pp-info-icon">🏛️</span>
                  <div>
                    <strong>Province</strong>
                    <p>{profile?.user_info.province || "Not set"}</p>
                  </div>
                </div>
                <div className="pp-info-item">
                  <span className="pp-info-icon">📅</span>
                  <div>
                    <strong>Member Since</strong>
                    <p>
                      {new Date(
                        profile?.user_info.member_since || "",
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {profile?.user_info.last_login && (
                  <div className="pp-info-item">
                    <span className="pp-info-icon">🔐</span>
                    <div>
                      <strong>Last Login</strong>
                      <p>
                        {new Date(
                          profile?.user_info.last_login,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change Password Modal */}
          {changingPassword && (
            <div className="pp-card pp-fade-up">
              <div className="pp-card-header">
                <h3>🔒 Change Password</h3>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="pp-form">
                  <div className="pp-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          old_password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="pp-form-actions">
                    <button
                      type="button"
                      className="pp-btn pp-btn-secondary"
                      onClick={() => setChangingPassword(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="pp-btn pp-btn-danger">
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* My FIRs Tab */}
      {activeSubTab === "firs" && (
        <div className="pp-section pp-fade-up">
          <div className="pp-card">
            <div className="pp-card-header">
              <h3>📋 My FIRs</h3>
              <p>
                {myFirs.length} FIR{myFirs.length !== 1 ? "s" : ""} filed
              </p>
            </div>
            {myFirs.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-icon">📭</div>
                <h4>No FIRs Filed</h4>
                <p>You haven't filed any FIRs yet.</p>
                <button
                  className="pp-btn pp-btn-primary"
                  onClick={() => onTabChange && onTabChange("fir")}
                >
                  📝 File Your First FIR
                </button>
              </div>
            ) : (
              <div className="pp-firs-list">
                {myFirs.map((fir, idx) => {
                  const statusConfig = getStatusConfig(fir.status);
                  return (
                    <div
                      key={fir.fir_id}
                      className="pp-fir-card"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="pp-fir-header">
                        <div className="pp-fir-info">
                          <span className="pp-fir-number">
                            {fir.fir_number}
                          </span>
                          <span
                            className="pp-fir-status"
                            style={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>
                        <span className="pp-fir-date">
                          {new Date(fir.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="pp-fir-title">{fir.incident_title}</h4>
                      <p className="pp-fir-desc">
                        {fir.incident_description?.substring(0, 120)}...
                      </p>

                      {/* Progress Bar */}
                      <div className="pp-progress">
                        <div className="pp-progress-header">
                          <span>Progress</span>
                          <span>{fir.progress_percentage}%</span>
                        </div>
                        <div className="pp-progress-bar">
                          <div
                            className="pp-progress-fill"
                            style={{ width: `${fir.progress_percentage}%` }}
                          />
                        </div>
                        <p className="pp-progress-stage">
                          Current: {fir.current_stage}
                        </p>
                      </div>

                      <button
                        className="pp-expand-btn"
                        onClick={() =>
                          setExpandedFir(
                            expandedFir === fir.fir_id ? null : fir.fir_id,
                          )
                        }
                      >
                        {expandedFir === fir.fir_id
                          ? "▲ Hide Timeline"
                          : "▼ View Timeline"}
                      </button>

                      {expandedFir === fir.fir_id && (
                        <div className="pp-timeline">
                          {fir.timeline.map((event, eventIdx) => (
                            <div key={eventIdx} className="pp-timeline-item">
                              <div className="pp-timeline-icon">
                                {event.icon}
                              </div>
                              <div className="pp-timeline-content">
                                <div className="pp-timeline-header">
                                  <strong>{event.event}</strong>
                                  <span>
                                    {new Date(event.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p>{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="pp-track-btn"
                        onClick={() => onTabChange && onTabChange("my-firs")}
                      >
                        🔍 Track Case
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeSubTab === "notifications" && (
        <div className="pp-section pp-fade-up">
          <div className="pp-card">
            <div className="pp-card-header">
              <h3>🔔 Notification Preferences</h3>
              <p>Choose how you want to receive updates</p>
            </div>
            <div className="pp-notification-options">
              <label className="pp-notification-option">
                <input
                  type="checkbox"
                  checked={notificationPrefs.email_notifications}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      email_notifications: e.target.checked,
                    })
                  }
                />
                <div>
                  <strong>📧 Email Notifications</strong>
                  <p>Receive updates via email</p>
                </div>
              </label>
              <label className="pp-notification-option">
                <input
                  type="checkbox"
                  checked={notificationPrefs.sms_notifications}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      sms_notifications: e.target.checked,
                    })
                  }
                />
                <div>
                  <strong>📱 SMS Notifications</strong>
                  <p>Get text messages for important updates</p>
                </div>
              </label>
              <label className="pp-notification-option">
                <input
                  type="checkbox"
                  checked={notificationPrefs.case_updates}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      case_updates: e.target.checked,
                    })
                  }
                />
                <div>
                  <strong>⚖️ Case Updates</strong>
                  <p>Notifications when your case status changes</p>
                </div>
              </label>
              <label className="pp-notification-option">
                <input
                  type="checkbox"
                  checked={notificationPrefs.hearing_reminders}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      hearing_reminders: e.target.checked,
                    })
                  }
                />
                <div>
                  <strong>🏛️ Hearing Reminders</strong>
                  <p>Reminders for upcoming court hearings</p>
                </div>
              </label>
            </div>
            <div className="pp-form-actions">
              <button
                className="pp-btn pp-btn-success"
                onClick={updateNotificationPrefs}
              >
                💾 Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeSubTab === "activity" && (
        <div className="pp-section pp-fade-up">
          <div className="pp-card">
            <div className="pp-card-header">
              <h3>🕐 Recent Activity</h3>
              <p>Your latest actions and updates</p>
            </div>
            {profile?.recent_activity.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-icon">📭</div>
                <h4>No Recent Activity</h4>
                <p>Your recent actions will appear here</p>
              </div>
            ) : (
              <div className="pp-activity-list">
                {profile?.recent_activity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="pp-activity-item"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="pp-activity-icon">{activity.icon}</div>
                    <div className="pp-activity-content">
                      <div className="pp-activity-title">{activity.title}</div>
                      {activity.description && <p>{activity.description}</p>}
                      <span className="pp-activity-date">
                        {new Date(activity.date).toLocaleString()}
                      </span>
                    </div>
                    {activity.status && (
                      <div className="pp-activity-status">
                        {activity.status.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pp-quick-actions">
        <div className="pp-card">
          <div className="pp-card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="pp-actions-grid">
            <button
              className="pp-action-btn"
              onClick={() => onTabChange && onTabChange("fir")}
            >
              <span>📝</span> File New FIR
            </button>
            <button
              className="pp-action-btn"
              onClick={() => onTabChange && onTabChange("my-firs")}
            >
              <span>📋</span> View My FIRs
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Indigo Theme Styles */
        .pp-dashboard {
          padding: 24px;
          animation: pp-fadeIn 0.4s ease-out;
        }

        @keyframes pp-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pp-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pp-fade-up {
          animation: pp-slideUp 0.5s ease-out backwards;
        }

        /* Shimmer Loading */
        .pp-loading {
          padding: 24px;
        }

        .pp-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 12px;
          height: 150px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .pp-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: pp-shimmer 1.5s infinite;
        }

        @keyframes pp-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Toast */
        .pp-toast {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 200;
          padding: 12px 24px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: pp-toastIn 0.3s ease-out;
        }

        @keyframes pp-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .pp-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .pp-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Header Card - Indigo Theme */
        .pp-header-card {
          background: linear-gradient(135deg, rgba(12, 15, 26, 0.9), rgba(7, 9, 14, 0.95));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .pp-avatar {
          position: relative;
        }

        .pp-avatar-inner {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
        }

        .pp-avatar-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 1.5rem;
        }

        .pp-header-info {
          flex: 1;
        }

        .pp-header-name {
          font-size: 1.6rem;
          font-weight: 700;
          color: #e8ecf8;
          margin: 0 0 6px 0;
        }

        .pp-header-email {
          color: #7a849c;
          margin: 0 0 16px 0;
        }

        .pp-header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Stats Cards */
        .pp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        .pp-stat-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .pp-stat-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }

        .pp-stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .pp-stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .pp-stat-label {
          font-size: 0.7rem;
          color: #7a849c;
        }

        /* Sub Tabs - Horizontal One Line */
        .pp-subtabs-container {
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 24px;
        }

        .pp-subtabs {
          display: flex;
          gap: 8px;
        }

        .pp-subtab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          border-radius: 8px 8px 0 0;
        }

        .pp-subtab::after {
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

        .pp-subtab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .pp-subtab.active {
          color: #818cf8;
        }

        .pp-subtab.active::after {
          transform: scaleX(1);
        }

        .pp-subtab-icon {
          font-size: 1.1rem;
        }

        .pp-subtab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 8px;
          color: #818cf8;
        }

        /* Cards */
        .pp-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 24px;
        }

        .pp-card-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .pp-card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .pp-card-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        /* Buttons - Indigo Theme */
        .pp-btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .pp-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .pp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .pp-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .pp-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .pp-btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
        }

        .pp-btn-success:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .pp-btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
        }

        .pp-btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* Form */
        .pp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pp-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .pp-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pp-form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .pp-form-group input,
        .pp-form-group select,
        .pp-form-group textarea {
          padding: 10px 14px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
          transition: all 0.3s;
        }

        .pp-form-group input:focus,
        .pp-form-group select:focus,
        .pp-form-group textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .pp-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        /* Info Grid */
        .pp-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .pp-info-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .pp-info-icon {
          font-size: 1.2rem;
        }

        .pp-info-item strong {
          display: block;
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 4px;
        }

        .pp-info-item p {
          font-size: 0.85rem;
          color: #e8ecf8;
          margin: 0;
        }

        /* FIR List */
        .pp-firs-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pp-fir-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s;
          animation: pp-slideIn 0.3s ease-out backwards;
        }

        @keyframes pp-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .pp-fir-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .pp-fir-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .pp-fir-info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .pp-fir-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .pp-fir-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .pp-fir-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .pp-fir-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #e8ecf8;
        }

        .pp-fir-desc {
          font-size: 0.8rem;
          color: #7a849c;
          margin-bottom: 16px;
        }

        /* Progress Bar - Indigo */
        .pp-progress {
          margin-bottom: 16px;
        }

        .pp-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #7a849c;
          margin-bottom: 6px;
        }

        .pp-progress-bar {
          height: 6px;
          background: rgba(99, 102, 241, 0.15);
          border-radius: 3px;
          overflow: hidden;
        }

        .pp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 3px;
          transition: width 0.3s;
        }

        .pp-progress-stage {
          font-size: 0.7rem;
          color: #3d4459;
          margin-top: 6px;
        }

        .pp-expand-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
          margin: 12px 0;
          padding: 0;
        }

        .pp-track-btn {
          background: none;
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 8px 16px;
          border-radius: 6px;
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-track-btn:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        /* Timeline */
        .pp-timeline {
          margin-top: 16px;
          padding: 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
        }

        .pp-timeline-item {
          display: flex;
          gap: 14px;
          margin-bottom: 16px;
        }

        .pp-timeline-item:last-child {
          margin-bottom: 0;
        }

        .pp-timeline-icon {
          font-size: 1.2rem;
        }

        .pp-timeline-content {
          flex: 1;
        }

        .pp-timeline-header {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .pp-timeline-header strong {
          font-size: 0.8rem;
          color: #e8ecf8;
        }

        .pp-timeline-header span {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .pp-timeline-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Notification Options */
        .pp-notification-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .pp-notification-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .pp-notification-option:hover {
          background: rgba(12, 15, 26, 0.8);
        }

        .pp-notification-option input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #6366f1;
        }

        .pp-notification-option strong {
          display: block;
          font-size: 0.85rem;
          color: #e8ecf8;
        }

        .pp-notification-option p {
          font-size: 0.7rem;
          color: #7a849c;
          margin: 0;
        }

        /* Activity List */
        .pp-activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pp-activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
          transition: all 0.3s;
          animation: pp-slideIn 0.3s ease-out backwards;
        }

        /* Select wrapper styles */
.pp-select-wrapper {
  position: relative;
  width: 100%;
}

.pp-select-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
  z-index: 1;
  color: #3d4459;
}

.pp-select-wrapper select {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  color: #e8ecf8;
  font-size: 0.85rem;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s;
}

.pp-select-wrapper select:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.pp-select-wrapper select option {
  background: #0c0f1a;
  color: #e8ecf8;
}

.pp-select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  pointer-events: none;
  color: #3d4459;
}

        .pp-activity-item:hover {
          background: rgba(12, 15, 26, 0.8);
        }

        .pp-activity-icon {
          font-size: 1.5rem;
        }

        .pp-activity-content {
          flex: 1;
        }

        .pp-activity-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .pp-activity-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        .pp-activity-date {
          font-size: 0.65rem;
          color: #3d4459;
          display: block;
          margin-top: 4px;
        }

        .pp-activity-status {
          font-size: 0.7rem;
          padding: 4px 10px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 20px;
          color: #818cf8;
        }

        /* Quick Actions */
        .pp-quick-actions {
          margin-top: 8px;
        }

        .pp-actions-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pp-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 6px;
          color: #e8ecf8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pp-action-btn:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          background: rgba(99, 102, 241, 0.08);
        }

        /* Empty State */
        .pp-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .pp-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .pp-empty h4 {
          font-size: 1rem;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .pp-empty p {
          font-size: 0.8rem;
          color: #7a849c;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .pp-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .pp-dashboard {
            padding: 16px;
          }

          .pp-header-card {
            flex-direction: column;
            text-align: center;
          }

          .pp-header-actions {
            justify-content: center;
          }

          .pp-stats {
            gap: 12px;
          }

          .pp-stat-value {
            font-size: 1.3rem;
          }

          .pp-subtabs {
            gap: 4px;
          }

          .pp-subtab {
            padding: 12px 20px;
            font-size: 0.85rem;
          }

          .pp-subtab-icon {
            font-size: 0.9rem;
          }

          .pp-form-row {
            grid-template-columns: 1fr;
          }

          .pp-card {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .pp-stats {
            grid-template-columns: 1fr;
          }

          .pp-subtab {
            padding: 10px 16px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
