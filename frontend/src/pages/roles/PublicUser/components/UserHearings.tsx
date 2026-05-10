import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

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

export function UserHearings({ token }: { token: string }) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
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

    const response = await fetch("http://127.0.0.1:8000/cases/my-hearings", {
      method: "GET",
      headers: myHeaders,
      cache: "no-cache",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ User hearings loaded from backend:", data);
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
    // Get cases where user is complainant
    const myFirs = await apiRequest<any[]>("/fir/my", { token });
    
    let allHearings: Hearing[] = [];

    for (const fir of myFirs) {
      if (!fir.case_id) continue;
      
      try {
        const timeline = await apiRequest<any>(
          `/case-timeline/${fir.case_id}`,
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
            case_id: fir.case_id,
            case_number: fir.case_number || `CASE-${fir.case_id?.slice(0,8)}`,
            case_title: fir.incident_title || "Case",
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
        console.log(`Error getting timeline for case ${fir.case_id}`);
      }
    }

    console.log("📅 User hearings from timeline:", allHearings.length);
    setHearings(allHearings);
  } catch (err) {
    console.error("Fallback also failed:", err);
  }
}

  function joinMeeting(link: string) {
    window.open(link, "_blank");
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { color: string; bg: string; icon: string }> = {
      SCHEDULED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "⏳" },
      COMPLETED: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "✅" },
      CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "❌" },
      RESCHEDULED: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "🔄" }
    };
    const style = config[status] || { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: "📋" };
    return (
      <span style={{ background: style.bg, color: style.color, padding: "4px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 500 }}>
        {style.icon} {status}
      </span>
    );
  }

  function isUpcoming(hearing: Hearing): boolean {
    const hearingDateTime = new Date(`${hearing.hearing_date}T${hearing.hearing_time}`);
    return hearingDateTime > new Date() && hearing.status === "SCHEDULED";
  }

  const filteredHearings = hearings.filter(hearing => {
    if (filter === "upcoming") return isUpcoming(hearing);
    if (filter === "past") return !isUpcoming(hearing);
    return true;
  });

  if (loading) {
    return (
      <div className="uh-loading">
        <div className="uh-spinner"></div>
        <p>Loading your hearings...</p>
      </div>
    );
  }

  return (
    <div className="uh-container">
      <div className="uh-header">
        <div>
          <h3>🎙️ My Court Hearings</h3>
          <p>Track your scheduled court appearances</p>
        </div>
        <div className="uh-filter">
          <button className={`uh-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`uh-filter-btn ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>Upcoming</button>
          <button className={`uh-filter-btn ${filter === "past" ? "active" : ""}`} onClick={() => setFilter("past")}>Past</button>
        </div>
      </div>

      {filteredHearings.length === 0 ? (
        <div className="uh-empty">
          <div className="uh-empty-icon">🎙️</div>
          <h4>No Hearings Found</h4>
          <p>{filter === "upcoming" ? "No upcoming hearings scheduled" : "You have no court hearings at this time"}</p>
        </div>
      ) : (
        <div className="uh-hearings-list">
          {filteredHearings.map((hearing, idx) => (
            <div 
              key={hearing.hearing_id} 
              className={`uh-hearing-card ${isUpcoming(hearing) ? "upcoming" : ""} ${hoveredId === hearing.hearing_id ? "hovered" : ""}`}
              onMouseEnter={() => setHoveredId(hearing.hearing_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="uh-hearing-header">
                <div className="uh-hearing-info">
                  <span className="uh-case-number">{hearing.case_number}</span>
                  {getStatusBadge(hearing.status)}
                  {isUpcoming(hearing) && <span className="uh-upcoming-badge">Upcoming</span>}
                </div>
                <div className="uh-hearing-date">
                  <span className="uh-date-icon">📅</span>
                  {new Date(hearing.hearing_date).toLocaleDateString()}
                  <span className="uh-time-icon">⏰</span>
                  {hearing.hearing_time}
                </div>
              </div>
              
              <h4 className="uh-hearing-title">{hearing.case_title}</h4>
              <div className="uh-hearing-type">
                {hearing.hearing_type === "VIRTUAL" ? "💻 Virtual Hearing" : "🏛️ Physical Hearing"}
              </div>
              
              <div className="uh-hearing-actions">
                <button className="uh-btn-view" onClick={() => { setSelectedHearing(hearing); setShowModal(true); }}>
                  👁️ View Details
                </button>
                {hearing.hearing_type === "VIRTUAL" && hearing.status === "SCHEDULED" && (
                  <button className="uh-btn-join" onClick={() => joinMeeting(hearing.meeting_link)}>
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
        <div className="uh-modal-overlay" onClick={() => { setShowModal(false); setSelectedHearing(null); }}>
          <div className="uh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3>🎙️ Hearing Details</h3>
              <button className="uh-modal-close" onClick={() => { setShowModal(false); setSelectedHearing(null); }}>✕</button>
            </div>
            <div className="uh-modal-body">
              <div className="uh-detail-row"><strong>Case Number:</strong> {selectedHearing.case_number}</div>
              <div className="uh-detail-row"><strong>Case Title:</strong> {selectedHearing.case_title}</div>
              <div className="uh-detail-row"><strong>Date:</strong> {new Date(selectedHearing.hearing_date).toLocaleDateString()}</div>
              <div className="uh-detail-row"><strong>Time:</strong> {selectedHearing.hearing_time}</div>
              <div className="uh-detail-row"><strong>Type:</strong> {selectedHearing.hearing_type === "VIRTUAL" ? "💻 Virtual" : "🏛️ Physical"}</div>
              <div className="uh-detail-row"><strong>Status:</strong> {getStatusBadge(selectedHearing.status)}</div>
              <div className="uh-detail-row"><strong>Scheduled By:</strong> {selectedHearing.scheduled_by_name || "Court Officer"}</div>
              {selectedHearing.notes && <div className="uh-detail-row"><strong>Notes:</strong> {selectedHearing.notes}</div>}
              {selectedHearing.meeting_link && (
                <div className="uh-detail-row">
                  <strong>Meeting Link:</strong> 
                  <a href={selectedHearing.meeting_link} target="_blank" rel="noopener noreferrer">{selectedHearing.meeting_link}</a>
                </div>
              )}
            </div>
            <div className="uh-modal-footer">
              {selectedHearing.hearing_type === "VIRTUAL" && selectedHearing.status === "SCHEDULED" && (
                <button className="uh-btn-join" onClick={() => joinMeeting(selectedHearing.meeting_link)}>🎥 Join Meeting</button>
              )}
              <button className="uh-btn-close" onClick={() => { setShowModal(false); setSelectedHearing(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`uh-toast ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}

      <style>{`
        .uh-container {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 24px;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .uh-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }
        
        .uh-header h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 4px;
        }
        
        .uh-header p {
          font-size: 0.8rem;
          color: #7a849c;
        }
        
        .uh-filter {
          display: flex;
          gap: 8px;
        }
        
        .uh-filter-btn {
          padding: 6px 16px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          color: #7a849c;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .uh-filter-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }
        
        .uh-filter-btn:hover:not(.active) {
          background: rgba(99, 102, 241, 0.2);
          color: #e8ecf8;
        }
        
        .uh-hearings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .uh-hearing-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s;
          animation: slideIn 0.3s ease-out backwards;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .uh-hearing-card.upcoming {
          border-left: 3px solid #10b981;
        }
        
        .uh-hearing-card.hovered {
          border-color: rgba(99, 102, 241, 0.35);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.7);
        }
        
        .uh-hearing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .uh-hearing-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .uh-case-number {
          font-weight: 600;
          font-size: 0.75rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }
        
        .uh-upcoming-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        
        .uh-hearing-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #7a849c;
        }
        
        .uh-hearing-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 8px 0 6px 0;
        }
        
        .uh-hearing-type {
          font-size: 0.8rem;
          color: #10b981;
          margin-bottom: 16px;
        }
        
        .uh-hearing-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        
        .uh-btn-view, .uh-btn-join, .uh-btn-close {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        
        .uh-btn-view {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }
        
        .uh-btn-view:hover {
          background: rgba(99, 102, 241, 0.25);
          transform: translateY(-1px);
        }
        
        .uh-btn-join {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .uh-btn-join:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .uh-btn-close {
          background: #334155;
          color: #94a3b8;
        }
        
        .uh-btn-close:hover {
          background: #3d4a5f;
          color: #e8ecf8;
        }
        
        /* Modal Styles */
        .uh-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(6, 8, 15, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .uh-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .uh-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }
        
        .uh-modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }
        
        .uh-modal-close {
          background: none;
          border: none;
          color: #7a849c;
          font-size: 1.2rem;
          cursor: pointer;
        }
        
        .uh-modal-close:hover {
          color: #fff;
        }
        
        .uh-modal-body {
          padding: 24px;
        }
        
        .uh-detail-row {
          margin-bottom: 14px;
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.5;
        }
        
        .uh-detail-row strong {
          color: #e8ecf8;
          display: inline-block;
          width: 110px;
        }
        
        .uh-detail-row a {
          color: #818cf8;
          text-decoration: none;
          word-break: break-all;
        }
        
        .uh-detail-row a:hover {
          text-decoration: underline;
        }
        
        .uh-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }
        
        /* Empty State */
        .uh-empty {
          text-align: center;
          padding: 60px 20px;
        }
        
        .uh-empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }
        
        .uh-empty h4 {
          font-size: 1rem;
          color: #e8ecf8;
          margin-bottom: 8px;
        }
        
        .uh-empty p {
          font-size: 0.85rem;
          color: #7a849c;
        }
        
        /* Loading State */
        .uh-loading {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }
        
        .uh-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Toast */
        .uh-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 1100;
          animation: slideInRight 0.3s ease;
        }
        
        .uh-toast.success {
          background: #10b981;
          color: white;
        }
        
        .uh-toast.error {
          background: #ef4444;
          color: white;
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .uh-container {
            padding: 16px;
          }
          
          .uh-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .uh-hearing-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .uh-hearing-actions {
            flex-direction: column;
          }
          
          .uh-btn-view, .uh-btn-join {
            text-align: center;
          }
          
          .uh-detail-row strong {
            display: block;
            width: auto;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
}