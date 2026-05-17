import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../../shared/env";

type Hearing = {
  hearing_id: string;
  case_id: string;
  case_number: string;
  case_title: string;
  hearing_date: string;
  hearing_time: string;
  hearing_type: string;
  meeting_link: string;
  status: string;
  notes: string;
  scheduled_by_name: string;
  created_at: string;
};

export function InvestigatorHearings({ token }: { token: string }) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadHearings();
  }, []);

  async function loadHearings() {
    setLoading(true);
    try {
      // Direct fetch with full URL to bypass any proxy issues
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const response = await fetch(`${API_BASE_URL}/cases/my-hearings`, {
        method: "GET",
        headers: myHeaders,
        cache: "no-cache",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Hearings loaded from backend:", data);
        setHearings(data || []);
      } else {
        console.error("Response not OK:", response.status);
        // Fallback: Get from timeline
        await loadHearingsFromTimeline();
      }
    } catch (err) {
      console.error("Error loading hearings:", err);
      await loadHearingsFromTimeline();
    } finally {
      setLoading(false);
    }
  }

  // Fallback method to get hearings from timeline
  async function loadHearingsFromTimeline() {
    try {
      const myCases = await apiRequest<any[]>("/cases/investigator", { token });
      let allHearings: Hearing[] = [];

      for (const caseItem of myCases) {
        try {
          const timeline = await apiRequest<any>(
            `/case-timeline/${caseItem.case_id}`,
            { token },
          );
          const hearingEvents =
            timeline?.timeline?.filter(
              (e: any) =>
                e.event?.includes("Hearing") || e.event?.includes("🎙️"),
            ) || [];

          for (const event of hearingEvents) {
            allHearings.push({
              hearing_id: `evt_${Date.now()}_${Math.random()}`,
              case_id: caseItem.case_id,
              case_number: caseItem.case_number,
              case_title: caseItem.title,
              hearing_date:
                event.date?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              hearing_time: event.date?.split("T")[1]?.slice(0, 5) || "00:00",
              hearing_type: "VIRTUAL",
              meeting_link: event.details?.meeting_link || "",
              status: "SCHEDULED",
              notes: event.description || "",
              scheduled_by_name: event.by || "Court Officer",
              created_at: event.date || new Date().toISOString(),
            });
          }
        } catch (err) {
          console.log(`Error getting timeline for case ${caseItem.case_id}`);
        }
      }

      console.log("📅 Hearings from timeline:", allHearings.length);
      setHearings(allHearings);
    } catch (err) {
      console.error("Fallback also failed:", err);
    }
  }

  function joinMeeting(link: string) {
    window.open(link, "_blank");
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { color: string; bg: string; icon: string }> =
      {
        SCHEDULED: {
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.12)",
          icon: "⏳",
        },
        COMPLETED: {
          color: "#10b981",
          bg: "rgba(16,185,129,0.12)",
          icon: "✅",
        },
        CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "❌" },
        RESCHEDULED: {
          color: "#3b82f6",
          bg: "rgba(59,130,246,0.12)",
          icon: "🔄",
        },
      };
    const style = config[status] || {
      color: "#64748b",
      bg: "rgba(100,116,139,0.12)",
      icon: "📋",
    };
    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "0.7rem",
          fontWeight: 500,
        }}
      >
        {style.icon} {status}
      </span>
    );
  }

  function isUpcoming(hearing: Hearing): boolean {
    // Handle different date formats
    let hearingDateStr = hearing.hearing_date;
    let hearingTimeStr = hearing.hearing_time;

    // If date is in ISO format (from timeline)
    if (hearingDateStr.includes("T")) {
      const parts = hearingDateStr.split("T");
      hearingDateStr = parts[0];
      if (!hearingTimeStr || hearingTimeStr === "00:00") {
        hearingTimeStr = parts[1]?.slice(0, 5) || "00:00";
      }
    }

    try {
      const hearingDateTime = new Date(`${hearingDateStr}T${hearingTimeStr}`);
      const now = new Date();
      const isUpcomingFlag =
        hearingDateTime > now && hearing.status === "SCHEDULED";

      console.log(
        `Hearing ${hearing.case_number}: date=${hearingDateStr}, time=${hearingTimeStr}, isUpcoming=${isUpcomingFlag}`,
      );
      return isUpcomingFlag;
    } catch (err) {
      console.error("Date parse error:", err);
      return false;
    }
  }

  const filteredHearings = hearings.filter((hearing) => {
    if (filter === "upcoming") return isUpcoming(hearing);
    if (filter === "past")
      return !isUpcoming(hearing) && hearing.status !== "SCHEDULED";
    return true;
  });

  if (loading) {
    return (
      <div className="ih-loading">
        <div className="ih-spinner"></div>
        <p>Loading hearings...</p>
      </div>
    );
  }

  return (
    <div className="ih-container">
      <div className="ih-header">
        <div>
          <h3>🎙️ Court Hearings</h3>
          <p>View all scheduled court hearings for your cases</p>
        </div>
        <div className="ih-filter">
          <button
            className={`ih-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`ih-filter-btn ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`ih-filter-btn ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
        </div>
      </div>

      {filteredHearings.length === 0 ? (
        <div className="ih-empty">
          <div className="ih-empty-icon">🎙️</div>
          <h4>No Hearings Found</h4>
          <p>
            {filter === "upcoming"
              ? "No upcoming hearings scheduled"
              : "No hearings recorded yet"}
          </p>
        </div>
      ) : (
        <div className="ih-hearings-list">
          {filteredHearings.map((hearing, idx) => (
            <div
              key={hearing.hearing_id}
              className={`ih-hearing-card ${hoveredId === hearing.hearing_id ? "hovered" : ""} ${isUpcoming(hearing) ? "upcoming" : ""}`}
              onMouseEnter={() => setHoveredId(hearing.hearing_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="ih-hearing-header">
                <div className="ih-hearing-info">
                  <span className="ih-case-number">{hearing.case_number}</span>
                  {getStatusBadge(hearing.status)}
                  {isUpcoming(hearing) && (
                    <span className="ih-upcoming-badge">Upcoming</span>
                  )}
                </div>
                <div className="ih-hearing-date">
                  <span className="ih-date-icon">📅</span>
                  {new Date(hearing.hearing_date).toLocaleDateString()}
                  <span className="ih-time-icon">⏰</span>
                  {hearing.hearing_time}
                </div>
              </div>

              <h4 className="ih-hearing-title">{hearing.case_title}</h4>
              <div className="ih-hearing-details">
                <div>
                  <strong>Type:</strong>{" "}
                  {hearing.hearing_type === "VIRTUAL"
                    ? "💻 Virtual"
                    : "🏛️ Physical"}
                </div>
                <div>
                  <strong>Scheduled By:</strong>{" "}
                  {hearing.scheduled_by_name || "Court Officer"}
                </div>
                {hearing.notes && (
                  <div>
                    <strong>Notes:</strong> {hearing.notes}
                  </div>
                )}
              </div>

              <div className="ih-hearing-actions">
                <button
                  className="ih-btn-view"
                  onClick={() => {
                    setSelectedHearing(hearing);
                    setShowModal(true);
                  }}
                >
                  👁️ View Details
                </button>
                {hearing.hearing_type === "VIRTUAL" &&
                  hearing.status === "SCHEDULED" && (
                    <button
                      className="ih-btn-join"
                      onClick={() => joinMeeting(hearing.meeting_link)}
                    >
                      🎥 Join Meeting
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hearing Details Modal */}
      {showModal && selectedHearing && (
        <div
          className="ih-modal-overlay"
          onClick={() => {
            setShowModal(false);
            setSelectedHearing(null);
          }}
        >
          <div className="ih-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ih-modal-header">
              <h3>🎙️ Hearing Details</h3>
              <button
                className="ih-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setSelectedHearing(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="ih-modal-body">
              <div className="ih-detail-row">
                <strong>Case Number:</strong> {selectedHearing.case_number}
              </div>
              <div className="ih-detail-row">
                <strong>Case Title:</strong> {selectedHearing.case_title}
              </div>
              <div className="ih-detail-row">
                <strong>Date:</strong>{" "}
                {new Date(selectedHearing.hearing_date).toLocaleDateString()}
              </div>
              <div className="ih-detail-row">
                <strong>Time:</strong> {selectedHearing.hearing_time}
              </div>
              <div className="ih-detail-row">
                <strong>Type:</strong>{" "}
                {selectedHearing.hearing_type === "VIRTUAL"
                  ? "💻 Virtual"
                  : "🏛️ Physical"}
              </div>
              <div className="ih-detail-row">
                <strong>Status:</strong>{" "}
                {getStatusBadge(selectedHearing.status)}
              </div>
              <div className="ih-detail-row">
                <strong>Scheduled By:</strong>{" "}
                {selectedHearing.scheduled_by_name || "Court Officer"}
              </div>
              {selectedHearing.notes && (
                <div className="ih-detail-row">
                  <strong>Notes:</strong> {selectedHearing.notes}
                </div>
              )}
              {selectedHearing.meeting_link && (
                <div className="ih-detail-row">
                  <strong>Meeting Link:</strong>{" "}
                  <a
                    href={selectedHearing.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedHearing.meeting_link}
                  </a>
                </div>
              )}
            </div>
            <div className="ih-modal-footer">
              {selectedHearing.hearing_type === "VIRTUAL" &&
                selectedHearing.status === "SCHEDULED" && (
                  <button
                    className="ih-btn-join"
                    onClick={() => joinMeeting(selectedHearing.meeting_link)}
                  >
                    🎥 Join Meeting
                  </button>
                )}
              <button
                className="ih-btn-close"
                onClick={() => {
                  setShowModal(false);
                  setSelectedHearing(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`ih-toast ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <style>{`
        .ih-container { padding: 24px; max-width: 900px; margin: 0 auto; }
        .ih-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
        .ih-header h3 { font-size: 1.3rem; color: #e8ecf8; margin-bottom: 4px; }
        .ih-header p { color: #7a849c; }
        .ih-filter { display: flex; gap: 8px; }
        .ih-filter-btn { padding: 6px 16px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; color: #7a849c; cursor: pointer; }
        .ih-filter-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
        .ih-hearings-list { display: flex; flex-direction: column; gap: 16px; }
        .ih-hearing-card { background: rgba(12,15,26,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 16px; padding: 20px; transition: all 0.3s; animation: fadeIn 0.3s ease-out backwards; }
        .ih-hearing-card.upcoming { border-left: 3px solid #10b981; }
        .ih-hearing-card.hovered { border-color: rgba(99,102,241,0.35); transform: translateY(-2px); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ih-hearing-header { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 12px; }
        .ih-hearing-info { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .ih-case-number { font-weight: 700; color: #818cf8; background: rgba(99,102,241,0.12); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }
        .ih-upcoming-badge { background: rgba(16,185,129,0.15); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; }
        .ih-hearing-date { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #7a849c; }
        .ih-hearing-title { font-size: 1rem; font-weight: 600; color: #e8ecf8; margin: 8px 0; }
        .ih-hearing-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; padding: 12px; background: rgba(7,9,14,0.5); border-radius: 10px; margin: 12px 0; font-size: 0.8rem; color: #7a849c; }
        .ih-hearing-actions { display: flex; gap: 12px; margin-top: 12px; }
        .ih-btn-view, .ih-btn-join, .ih-btn-close { padding: 8px 20px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; border: none; transition: all 0.2s; }
        .ih-btn-view { background: rgba(99,102,241,0.15); color: #818cf8; }
        .ih-btn-join { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .ih-btn-close { background: #334155; color: #94a3b8; }
        .ih-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .ih-modal { background: #0f172a; border-radius: 16px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
        .ih-modal-header { display: flex; justify-content: space-between; padding: 20px; border-bottom: 1px solid #1e293b; }
        .ih-modal-header h3 { color: #818cf8; margin: 0; }
        .ih-modal-close { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
        .ih-modal-body { padding: 20px; }
        .ih-detail-row { margin-bottom: 12px; font-size: 0.85rem; color: #7a849c; }
        .ih-detail-row strong { color: #e8ecf8; display: inline-block; width: 110px; }
        .ih-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #1e293b; }
        .ih-empty { text-align: center; padding: 60px 20px; background: rgba(12,15,26,0.6); border-radius: 16px; }
        .ih-empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
        .ih-loading { text-align: center; padding: 60px; }
        .ih-spinner { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ih-toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; z-index: 1100; }
        .ih-toast.success { background: #10b981; color: white; }
        .ih-toast.error { background: #ef4444; color: white; }
        @media (max-width: 768px) {
          .ih-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .ih-hearing-header { flex-direction: column; gap: 10px; }
          .ih-hearing-details { grid-template-columns: 1fr; }
          .ih-hearing-actions { flex-direction: column; }
          .ih-btn-view, .ih-btn-join { text-align: center; }
        }
      `}</style>
    </div>
  );
}
