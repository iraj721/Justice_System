// frontend/src/shared/components/CaseTimeline.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { apiRequest } from "../services/apiClient";
import { useWebSocket } from "../hooks/useWebSocket";

type TimelineEvent = {
  date: string;
  event: string;
  description: string;
  icon: string;
  status: "completed" | "pending" | "current";
  by?: string;
  by_name?: string;
  action?: string;
  details?: any;
  type?: "case_level" | "evidence_level";
  evidence_id?: string;
  evidence_title?: string;
};

type TimelineData = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
  progress_percentage: number;
  current_stage: string;
  investigator_name: string;
  investigator_contact: string;
  created_at: string;
  updated_at: string;
  timeline: TimelineEvent[];
  evidence_summary: {
    total: number;
    verified: number;
    pending: number;
    tampered: number;
  };
  suspects_count: number;
  witnesses_count: number;
};

export function CaseTimeline({
  token,
  caseId,
}: {
  token: string;
  caseId: string;
}) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [newEventIndicator, setNewEventIndicator] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const prevEventCountRef = useRef(0);
  
  // Use WebSocket for real-time updates
  const { isConnected, lastMessage, requestRefresh } = useWebSocket(caseId);

  async function loadTimeline(showNotification = false) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<TimelineData>(`/case-timeline/${caseId}`, {
        token,
      });
      
      // Check if new events were added
      const oldCount = prevEventCountRef.current;
      const newCount = data?.timeline?.length || 0;
      
      if (showNotification && oldCount > 0 && newCount > oldCount) {
        setNewEventIndicator(true);
        setTimeout(() => setNewEventIndicator(false), 3000);
      }
      
      prevEventCountRef.current = newCount;
      setLastUpdateTime(new Date());
      
      // Log each event individually
      data?.timeline?.forEach((event, idx) => {
        console.log(`📅 Event ${idx}:`, event.event || event.action, "by:", event.by || event.by_name);
      });
      
      setTimelineData(data);
    } catch (err) {
      console.error("Error loading timeline:", err);
      if (!showNotification) {
        setError("Failed to load case timeline");
      }
    } finally {
      setLoading(false);
    }
  }

  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'timeline_update' || lastMessage?.type === 'case_update') {
      console.log("📡 Real-time update received, refreshing timeline...");
      loadTimeline(true);
    }
  }, [lastMessage]);

  // Initial load
  useEffect(() => {
    if (caseId) {
      loadTimeline();
    }
  }, [caseId]);

  // Auto-refresh every 10 seconds as fallback (if WebSocket not connected)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log("🔄 Auto-refreshing timeline (fallback)");
        loadTimeline(false);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isConnected, caseId]);

  function toggleEvent(index: number) {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "completed":
        return "#10b981";
      case "current":
        return "#6366f1";
      case "pending":
        return "#f59e0b";
      default:
        return "#64748b";
    }
  }

  function getEventDisplayName(event: TimelineEvent): string {
    if (event.event) return event.event;
    if (event.action) return event.action;
    return "Event";
  }

  function getEventBy(event: TimelineEvent): string {
    if (event.by) return event.by;
    if (event.by_name) return event.by_name;
    return "System";
  }

  function getEventIcon(event: TimelineEvent): string {
    const eventName = event.event || event.action || "";
    
    if (eventName.includes("Message")) return "💬";
    if (eventName.includes("SOS")) return "🚨";
    if (eventName.includes("Feedback")) return "📝";
    if (eventName.includes("Shared")) return "👥";
    if (eventName.includes("Hearing")) return "🎙️";
    if (eventName.includes("Evidence")) return "📦";
    if (eventName.includes("Case Created")) return "⚖️";
    if (eventName.includes("FIR")) return "📝";
    if (eventName.includes("Forensic Report Shared")) return "📋";
    if (eventName.includes("Forensic Report Generated")) return "📊";
    
    return event.icon || "📌";
  }

  if (loading && !timelineData) {
    return (
      <div className="timeline-loading">
        <div className="timeline-spinner"></div>
        <p>Loading case timeline...</p>
      </div>
    );
  }

  if (error || !timelineData) {
    return (
      <div className="timeline-error">
        <span>⚠️</span>
        <p>{error || "No timeline data available"}</p>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Connection Status Bar */}
      <div className="connection-status-bar">
        <div className="status-indicators">
          {isConnected ? (
            <span className="status-badge connected">
              <span className="status-dot"></span>
              Live Updates Active
            </span>
          ) : (
            <span className="status-badge disconnected">
              <span className="status-dot"></span>
              Reconnecting... (Auto-refresh every 10s)
            </span>
          )}
          {lastUpdateTime && (
            <span className="last-update">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button 
          className="refresh-btn" 
          onClick={() => loadTimeline(true)}
          disabled={loading}
        >
          {loading ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {/* New Event Toast */}
      {newEventIndicator && (
        <div className="new-event-toast">
          ✨ New timeline updates available!
        </div>
      )}

      {/* Progress Header */}
      <div className="timeline-progress">
        <div className="progress-header">
          <span>Case Progress</span>
          <span>{timelineData.progress_percentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${timelineData.progress_percentage}%` }}
          />
        </div>
        <div className="progress-stage">
          <span className="stage-icon">📍</span>
          Current Stage: {timelineData.current_stage}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="timeline-stats">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <strong>{timelineData.evidence_summary.total}</strong>
            <span>Total Evidence</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div>
            <strong>{timelineData.evidence_summary.verified}</strong>
            <span>Verified</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div>
            <strong>{timelineData.evidence_summary.pending}</strong>
            <span>Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div>
            <strong>{timelineData.suspects_count}</strong>
            <span>Suspects</span>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="timeline-events">
        <h3>📅 Complete Case Timeline</h3>
        <p className="timeline-subtitle">
          {timelineData.timeline.length} events recorded
        </p>

        <div className="timeline-list">
          {timelineData.timeline.map((event, idx) => (
            <div
              key={idx}
              className={`timeline-event ${event.type === "case_level" ? "case-level" : "evidence-level"} ${event.event?.includes("Forensic Report Shared") ? "share-event" : ""}`}
            >
              <div
                className="timeline-marker"
                style={{ background: getStatusColor(event.status) }}
              >
                <span className="timeline-icon">{getEventIcon(event)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <strong>{getEventDisplayName(event)}</strong>
                  {event.type && (
                    <span className={`event-type ${event.type}`}>
                      {event.type === "case_level"
                        ? "📌 Case Level"
                        : "📋 Evidence"}
                    </span>
                  )}
                  <span className="timeline-date">
                    {event.date ? new Date(event.date).toLocaleString() : "N/A"}
                  </span>
                </div>
                <p className="timeline-description">
                  {event.description || "No description"}
                </p>
                <div className="timeline-footer">
                  <span className="timeline-by">
                    By: {getEventBy(event)}
                  </span>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <button
                      className="timeline-expand-btn"
                      onClick={() => toggleEvent(idx)}
                    >
                      {expandedEvents.has(idx)
                        ? "▼ Hide Details"
                        : "▶ View Details"}
                    </button>
                  )}
                </div>
                {expandedEvents.has(idx) && event.details && (
                  <div className="timeline-details">
                    <pre>{JSON.stringify(event.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .timeline-container {
          padding: 24px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          position: relative;
        }
        
        /* Connection Status Bar */
        .connection-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          font-size: 0.75rem;
        }
        
        .status-indicators {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
        }
        
        .status-badge.connected {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .status-badge.disconnected {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        .last-update {
          color: #7a849c;
          font-size: 0.7rem;
        }
        
        .refresh-btn {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #818cf8;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .refresh-btn:hover {
          background: rgba(99, 102, 241, 0.3);
          transform: scale(0.98);
        }
        
        .new-event-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
          z-index: 1000;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }
        
        /* Share Event Highlight */
        .timeline-event.share-event .timeline-content {
          border-left: 3px solid #8b5cf6;
          background: rgba(139, 92, 246, 0.08);
        }
        
        /* Progress Section */
        .timeline-progress {
          background: rgba(7, 9, 14, 0.5);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #7a849c;
          margin-bottom: 8px;
        }
        
        .progress-bar {
          height: 8px;
          background: rgba(99, 102, 241, 0.15);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 4px;
          transition: width 0.5s;
        }
        
        .progress-stage {
          margin-top: 12px;
          font-size: 0.8rem;
          color: #818cf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        /* Stats Cards */
        .timeline-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        @media (max-width: 768px) {
          .timeline-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
        }
        
        .stat-icon {
          font-size: 1.5rem;
        }
        
        .stat-card div {
          display: flex;
          flex-direction: column;
        }
        
        .stat-card strong {
          font-size: 1.2rem;
          color: #e8ecf8;
        }
        
        .stat-card span:last-child {
          font-size: 0.7rem;
          color: #7a849c;
        }
        
        /* Timeline Events */
        .timeline-events h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 4px;
        }
        
        .timeline-subtitle {
          font-size: 0.75rem;
          color: #7a849c;
          margin-bottom: 20px;
        }
        
        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .timeline-event {
          display: flex;
          gap: 16px;
          position: relative;
        }
        
        .timeline-event:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 44px;
          width: 2px;
          height: calc(100% + 8px);
          background: rgba(99, 102, 241, 0.15);
        }
        
        .timeline-marker {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #6366f1;
        }
        
        .timeline-icon {
          font-size: 1.1rem;
        }
        
        .timeline-content {
          flex: 1;
          background: rgba(7, 9, 14, 0.5);
          padding: 14px 18px;
          border-radius: 12px;
        }
        
        .timeline-event.case-level .timeline-content {
          border-left: 3px solid #10b981;
        }
        
        .timeline-header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        
        .timeline-header strong {
          font-size: 0.9rem;
          color: #e8ecf8;
        }
        
        .event-type {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 20px;
        }
        
        .event-type.case_level {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .event-type.evidence_level {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }
        
        .timeline-date {
          font-size: 0.7rem;
          color: #3d4459;
          margin-left: auto;
        }
        
        .timeline-description {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 6px 0;
          line-height: 1.5;
        }
        
        .timeline-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        
        .timeline-by {
          font-size: 0.65rem;
          color: #3d4459;
        }
        
        .timeline-expand-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.7rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        
        .timeline-expand-btn:hover {
          background: rgba(99, 102, 241, 0.1);
        }
        
        .timeline-details {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .timeline-details pre {
          font-size: 0.65rem;
          color: #7a849c;
          margin: 0;
          white-space: pre-wrap;
        }
        
        /* Loading & Error */
        .timeline-loading, .timeline-error {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }
        
        .timeline-spinner {
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
        
        .timeline-error {
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}