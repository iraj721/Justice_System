// frontend/src/pages/roles/PublicUser/components/ReceivedMessages.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Message = {
  message_id: string;
  case_id: string;
  case_number: string;
  subject: string;
  message: string;
  from_email: string;
  from_name: string;
  created_at: string;
  status: string;
};

export function ReceivedMessages({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const data = await apiRequest<Message[]>("/case-share/shared-messages", { token }).catch(() => []);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rm-loading">
        <div className="rm-shimmer-card"><div className="rm-shimmer"></div></div>
        <div className="rm-shimmer-card"><div className="rm-shimmer"></div></div>
      </div>
    );
  }

  return (
    <div className="rm-dashboard">
      <div className="rm-header">
        <div className="rm-header-icon">📬</div>
        <div>
          <h2>Messages & Notifications</h2>
          <p>Messages from investigators about your cases</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rm-empty">
          <div className="rm-empty-icon">📭</div>
          <h3>No Messages</h3>
          <p>You haven't received any messages yet.</p>
          <div className="rm-empty-tip">
            <span>💡</span>
            <span>When an investigator sends you a message, it will appear here</span>
          </div>
        </div>
      ) : (
        <div className="rm-messages-list">
          {messages.map((msg, idx) => (
            <div 
              key={msg.message_id} 
              className={`rm-message-card ${expandedMsg === msg.message_id ? "expanded" : ""}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="rm-message-header">
                <div className="rm-message-info">
                  <span className="rm-case-badge">{msg.case_number}</span>
                  <span className="rm-from">
                    <span className="rm-from-icon">👤</span>
                    {msg.from_name || msg.from_email}
                  </span>
                </div>
                <span className="rm-date">
                  {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="rm-message-subject">
                <span className="rm-subject-icon">📌</span>
                {msg.subject}
              </div>
              
              {expandedMsg === msg.message_id ? (
                <>
                  <div className="rm-message-body">
                    <p>{msg.message}</p>
                  </div>
                  <button className="rm-expand-btn" onClick={() => setExpandedMsg(null)}>
                    <span>▲</span> Show Less
                  </button>
                </>
              ) : (
                <>
                  <div className="rm-message-preview">
                    {msg.message.length > 150 ? msg.message.substring(0, 150) + "..." : msg.message}
                  </div>
                  <button className="rm-expand-btn" onClick={() => setExpandedMsg(msg.message_id)}>
                    <span>▼</span> Read More
                  </button>
                </>
              )}
              
              <div className="rm-message-status">
                <span className={`rm-status-dot ${msg.status === "SENT" ? "sent" : "read"}`}></span>
                {msg.status === "SENT" ? "Unread" : "Read"}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .rm-dashboard {
          animation: rm-fadeIn 0.4s ease-out;
        }

        @keyframes rm-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rm-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
        }

        .rm-header-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .rm-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .rm-header p {
          font-size: 0.85rem;
          color: #7a849c;
          margin: 0;
        }

        .rm-loading {
          padding: 20px;
        }

        .rm-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .rm-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: rm-shimmer 1.5s infinite;
        }

        @keyframes rm-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .rm-messages-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rm-message-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: rm-slideIn 0.3s ease-out backwards;
        }

        @keyframes rm-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .rm-message-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .rm-message-card.expanded {
          border-color: rgba(99, 102, 241, 0.35);
          background: rgba(12, 15, 26, 0.85);
        }

        .rm-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .rm-message-info {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .rm-case-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .rm-from {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #7a849c;
        }

        .rm-from-icon {
          font-size: 0.8rem;
        }

        .rm-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .rm-message-subject {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        }

        .rm-subject-icon {
          font-size: 0.9rem;
        }

        .rm-message-preview {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .rm-message-body {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
        }

        .rm-message-body p {
          margin: 0;
        }

        .rm-expand-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .rm-expand-btn:hover {
          color: #a5b4fc;
          gap: 10px;
        }

        .rm-message-status {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          color: #3d4459;
        }

        .rm-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .rm-status-dot.sent {
          background: #f59e0b;
          box-shadow: 0 0 4px #f59e0b;
        }

        .rm-status-dot.read {
          background: #10b981;
        }

        .rm-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.5);
          border-radius: 16px;
        }

        .rm-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .rm-empty h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .rm-empty p {
          color: #7a849c;
          margin-bottom: 20px;
        }

        .rm-empty-tip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 40px;
          font-size: 0.8rem;
          color: #818cf8;
        }

        @media (max-width: 768px) {
          .rm-message-card {
            padding: 16px;
          }

          .rm-message-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .rm-message-subject {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}