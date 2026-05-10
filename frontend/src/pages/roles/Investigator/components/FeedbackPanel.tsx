import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Feedback = {
  feedback_id: string;
  user_email: string;
  user_name: string;
  category: string;
  subject: string;
  message: string;
  rating: number;
  case_id: string;
  case_number: string;
  status: string;
  created_at: string;
};

export function FeedbackPanel({ token, cases }: { token: string; cases: any[] }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadFeedbacks();
  }, [selectedCase]);

  async function loadFeedbacks() {
    setLoading(true);
    try {
      let url = "/feedback/all";
      if (selectedCase) {
        url = `/feedback/case/${selectedCase}`;
      }
      const data = await apiRequest<Feedback[]>(url, { token });
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Error loading feedback:", err);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryConfig(category: string) {
    const config: Record<string, { icon: string; color: string; bg: string }> = {
      COMPLAINT: { icon: "⚠️", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
      SUGGESTION: { icon: "💡", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      APPRECIATION: { icon: "👍", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
      BUG: { icon: "🐛", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" }
    };
    return config[category] || { icon: "📝", color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  }

  const filteredFeedbacks = filterCategory === "all" 
    ? feedbacks 
    : feedbacks.filter(f => f.category === filterCategory);

  if (loading) {
    return (
      <div className="fp-loading">
        <div className="fp-spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="fp-dashboard">
      {/* Header */}
      <div className="fp-header">
        <div className="fp-header-icon">📝</div>
        <div>
          <h2>User Feedback</h2>
          <p>Feedback received from complainants on your cases</p>
        </div>
        <div className="fp-badge">{feedbacks.length} Total</div>
      </div>

      {/* Filters */}
      <div className="fp-filters">
        <div className="fp-filter-group">
          <label>Filter by Category:</label>
          <div className="fp-filter-buttons">
            <button className={`fp-filter-btn ${filterCategory === "all" ? "active" : ""}`} onClick={() => setFilterCategory("all")}>All</button>
            <button className={`fp-filter-btn ${filterCategory === "COMPLAINT" ? "active" : ""}`} onClick={() => setFilterCategory("COMPLAINT")}>⚠️ Complaint</button>
            <button className={`fp-filter-btn ${filterCategory === "SUGGESTION" ? "active" : ""}`} onClick={() => setFilterCategory("SUGGESTION")}>💡 Suggestion</button>
            <button className={`fp-filter-btn ${filterCategory === "APPRECIATION" ? "active" : ""}`} onClick={() => setFilterCategory("APPRECIATION")}>👍 Appreciation</button>
            <button className={`fp-filter-btn ${filterCategory === "BUG" ? "active" : ""}`} onClick={() => setFilterCategory("BUG")}>🐛 Bug Report</button>
          </div>
        </div>

        <div className="fp-filter-group">
          <label>Filter by Case:</label>
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} className="fp-case-select">
            <option value="">All Cases</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="fp-empty">
          <div className="fp-empty-icon">📭</div>
          <h3>No Feedback Yet</h3>
          <p>Feedback from complainants will appear here</p>
        </div>
      ) : (
        <div className="fp-feedback-list">
          {filteredFeedbacks.map((fb, idx) => {
            const categoryConfig = getCategoryConfig(fb.category);
            return (
              <div
                key={fb.feedback_id}
                className={`fp-feedback-card ${hoveredCard === fb.feedback_id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredCard(fb.feedback_id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="fp-card-header">
                  <div className="fp-card-left">
                    <span className="fp-category-badge" style={{ background: categoryConfig.bg, color: categoryConfig.color }}>
                      {categoryConfig.icon} {fb.category}
                    </span>
                    {fb.case_number && (
                      <span className="fp-case-badge">Case: {fb.case_number}</span>
                    )}
                    <span className="fp-date">{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="fp-card-right">
                    <span className="fp-from">From: {fb.user_name || fb.user_email}</span>
                  </div>
                </div>

                <h4 className="fp-subject">{fb.subject}</h4>
                <p className="fp-message">{fb.message}</p>

                {fb.rating > 0 && (
                  <div className="fp-rating">
                    <span>Rating: </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`fp-star ${fb.rating >= star ? "active" : ""}`}>★</span>
                    ))}
                  </div>
                )}

                <div className="fp-card-footer">
                  <button className="fp-respond-btn" onClick={() => window.location.href = `mailto:${fb.user_email}?subject=Re: ${fb.subject}`}>
                    📧 Respond via Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .fp-dashboard {
          padding: 24px;
          animation: fp-fadeIn 0.4s ease-out;
        }

        @keyframes fp-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fp-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(99,102,241,0.15);
        }

        .fp-header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .fp-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .fp-header p {
          font-size: 0.85rem;
          color: #7a849c;
          margin: 0;
        }

        .fp-badge {
          margin-left: auto;
          background: rgba(99,102,241,0.15);
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #818cf8;
        }

        /* Filters */
        .fp-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: rgba(12,15,26,0.6);
          border-radius: 12px;
        }

        .fp-filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .fp-filter-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .fp-filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .fp-filter-btn {
          padding: 6px 14px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 20px;
          color: #7a849c;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fp-filter-btn:hover {
          background: rgba(99,102,241,0.1);
          color: #e8ecf8;
        }

        .fp-filter-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        .fp-case-select {
          padding: 8px 16px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
          cursor: pointer;
        }

        /* Feedback List */
        .fp-feedback-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fp-feedback-card {
          background: rgba(7,9,14,0.5);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 14px;
          padding: 20px 24px;
          transition: all 0.3s;
          animation: fp-slideIn 0.3s ease-out backwards;
        }

        @keyframes fp-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fp-feedback-card.hovered {
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-2px);
          background: rgba(12,15,26,0.8);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .fp-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .fp-card-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .fp-category-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .fp-case-badge {
          padding: 4px 12px;
          background: rgba(99,102,241,0.12);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #818cf8;
        }

        .fp-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .fp-from {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .fp-subject {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 8px 0;
        }

        .fp-message {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .fp-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: #7a849c;
          margin-bottom: 12px;
        }

        .fp-star {
          color: #3d4459;
          font-size: 1rem;
        }

        .fp-star.active {
          color: #f59e0b;
        }

        .fp-card-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(99,102,241,0.1);
        }

        .fp-respond-btn {
          padding: 8px 20px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fp-respond-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }

        /* Empty State */
        .fp-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12,15,26,0.6);
          border-radius: 16px;
        }

        .fp-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .fp-empty h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .fp-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Loading */
        .fp-loading {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12,15,26,0.6);
          border-radius: 16px;
        }

        .fp-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}