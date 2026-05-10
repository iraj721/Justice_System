import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Feedback = {
  feedback_id: string;
  category: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  created_at: string;
  case_id?: string;
  case_number?: string;
};

type Category = {
  value: string;
  label: string;
  icon: string;
  color: string;
};

type UserCase = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
};

export function Feedback({ token }: { token: string }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userCases, setUserCases] = useState<UserCase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("COMPLAINT");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedCase, setSelectedCase] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: string;
  } | null>(null);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadData();
    loadUserCases();
  }, []);

  async function loadData() {
    try {
      const [fb, cats] = await Promise.all([
        apiRequest<Feedback[]>("/feedback/my-feedback", { token }).catch(
          () => [],
        ),
        apiRequest<{ categories: Category[] }>("/feedback/categories", {
          token,
        }).catch(() => ({ categories: [] })),
      ]);
      setFeedbacks(fb);
      setCategories(
        cats.categories || [
          {
            value: "COMPLAINT",
            label: "Complaint",
            icon: "⚠️",
            color: "#ef4444",
          },
          {
            value: "SUGGESTION",
            label: "Suggestion",
            icon: "💡",
            color: "#f59e0b",
          },
          {
            value: "APPRECIATION",
            label: "Appreciation",
            icon: "👍",
            color: "#10b981",
          },
          { value: "BUG", label: "Bug Report", icon: "🐛", color: "#8b5cf6" },
        ],
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function loadUserCases() {
    try {
      const myFirs = await apiRequest<any[]>("/user/my-firs", { token }).catch(
        () => [],
      );
      const casesList = myFirs
        .filter((fir: any) => fir.case_id)
        .map((fir: any) => ({
          case_id: fir.case_id,
          case_number: fir.case_number || fir.case_id,
          title: fir.incident_title,
          status: fir.case_status || "UNDER_INVESTIGATION",
        }));
      setUserCases(casesList);
    } catch (err) {
      console.error("Error loading cases:", err);
    }
  }

  async function handleSubmit() {
    if (!subject || !message) {
      showToast("Please fill subject and message", "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest<any>("/feedback/submit", {
        method: "POST",
        token,
        body: {
          category: selectedCategory,
          subject,
          message,
          rating: rating || null,
          case_id: selectedCase || null,
        },
      });

      showToast(
        "Feedback submitted successfully! The investigator has been notified.",
        "success",
      );
      setSubject("");
      setMessage("");
      setRating(0);
      setSelectedCase("");
      setActiveTab("history");
      loadData();
    } catch (err) {
      console.error("Submit error:", err);
      showToast("Failed to submit feedback. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function getCategoryIcon(category: string): string {
    const found = categories.find((c) => c.value === category);
    return found?.icon || "📝";
  }

  function getCategoryLabel(category: string): string {
    const found = categories.find((c) => c.value === category);
    return found?.label || category;
  }

  function getCategoryColor(category: string): string {
    const found = categories.find((c) => c.value === category);
    return found?.color || "#6366f1";
  }

  function getStatusConfig(status: string) {
    const config: Record<
      string,
      { color: string; bg: string; icon: string; label: string }
    > = {
      PENDING: {
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.08)",
        icon: "⏳",
        label: "Pending",
      },
      IN_PROGRESS: {
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.08)",
        icon: "🔄",
        label: "In Progress",
      },
      RESOLVED: {
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.08)",
        icon: "✅",
        label: "Resolved",
      },
      REJECTED: {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.08)",
        icon: "❌",
        label: "Rejected",
      },
    };
    return (
      config[status] || {
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        icon: "📌",
        label: status,
      }
    );
  }

  if (loading) {
    return (
      <div className="fb-loading">
        <div className="fb-shimmer-card">
          <div className="fb-shimmer"></div>
        </div>
        <div className="fb-shimmer-card">
          <div className="fb-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fb-toast fb-toast-${toastMessage.type}`}>
          <div className="fb-toast-inner">
            <span className="fb-toast-icon">
              {toastMessage.type === "success" ? "✅" : "❌"}
            </span>
            <span className="fb-toast-message">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="fb-tabs-container">
        <div className="fb-tabs">
          <button
            className={`fb-tab ${activeTab === "new" ? "active" : ""}`}
            onClick={() => setActiveTab("new")}
          >
            <span className="fb-tab-icon">✍️</span>
            <span>New Feedback</span>
          </button>
          <button
            className={`fb-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span className="fb-tab-icon">📋</span>
            <span>My Feedback</span>
            {feedbacks.length > 0 && (
              <span className="fb-tab-badge">{feedbacks.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* New Feedback Tab */}
      {activeTab === "new" && (
        <div className="fb-form-container fb-fade-up">
          <div className="fb-form-header">
            <h2>Submit Feedback</h2>
            <p>
              Your feedback helps improve the justice system. Select a case to
              notify the investigator.
            </p>
          </div>

          <div className="fb-form">
            {/* Category Selection */}
            <div className="fb-form-group">
              <label>Category</label>
              <div className="fb-categories">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    className={`fb-category-card ${selectedCategory === cat.value ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.value)}
                    type="button"
                    style={
                      selectedCategory === cat.value
                        ? { background: cat.color, borderColor: cat.color }
                        : {}
                    }
                  >
                    <span className="fb-category-icon">{cat.icon}</span>
                    <span className="fb-category-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Case Selection - NEW */}
            <div className="fb-form-group">
              <label>
                Related Case <span className="fb-optional">(Optional)</span>
              </label>
              <div
                className="fb-custom-select"
                onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
              >
                <div className="fb-select-trigger">
                  <span className="fb-select-icon">⚖️</span>
                  <span className="fb-select-text">
                    {selectedCase
                      ? userCases.find((c) => c.case_id === selectedCase)
                          ?.case_number
                      : "-- Select a case (optional) --"}
                  </span>
                  <span
                    className={`fb-select-arrow ${isCaseDropdownOpen ? "open" : ""}`}
                  >
                    ▼
                  </span>
                </div>
                {isCaseDropdownOpen && (
                  <div className="fb-select-dropdown">
                    <div
                      className="fb-select-option"
                      onClick={() => {
                        setSelectedCase("");
                        setIsCaseDropdownOpen(false);
                      }}
                    >
                      <span className="fb-option-number">-- None --</span>
                      <span className="fb-option-title">
                        Submit without linking to case
                      </span>
                    </div>
                    {userCases.length === 0 ? (
                      <div className="fb-no-options">
                        No cases available. File an FIR first.
                      </div>
                    ) : (
                      userCases.map((c) => (
                        <div
                          key={c.case_id}
                          className={`fb-select-option ${selectedCase === c.case_id ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedCase(c.case_id);
                            setIsCaseDropdownOpen(false);
                          }}
                        >
                          <span className="fb-option-number">
                            {c.case_number}
                          </span>
                          <span className="fb-option-title">{c.title}</span>
                          <span className="fb-option-status">
                            {c.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="fb-select-hint">
                {selectedCase ? (
                  <span className="fb-hint-success">
                    ✓ Feedback will be added to case timeline and investigator
                    notified
                  </span>
                ) : (
                  <span className="fb-hint">
                    💡 Select a case to share feedback directly with the
                    investigator
                  </span>
                )}
              </div>
            </div>

            <div className="fb-form-group">
              <label>
                Subject <span className="fb-required">*</span>
              </label>
              <div className="fb-input-wrapper">
                <span className="fb-input-icon">📝</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief subject line describing your feedback"
                />
              </div>
            </div>

            <div className="fb-form-group">
              <label>
                Message <span className="fb-required">*</span>
              </label>
              <div className="fb-textarea-wrapper">
                <span className="fb-textarea-icon">💬</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your feedback, complaint, or suggestion in detail..."
                />
              </div>
            </div>

            <div className="fb-form-group">
              <label>Rating (Optional)</label>
              <div className="fb-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`fb-star ${rating >= star ? "active" : ""} ${hoveredRating >= star ? "hovered" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    type="button"
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span className="fb-rating-label">
                    {rating === 5 && "Excellent!"}
                    {rating === 4 && "Good!"}
                    {rating === 3 && "Average"}
                    {rating === 2 && "Below Average"}
                    {rating === 1 && "Poor"}
                  </span>
                )}
              </div>
            </div>

            <button
              className="fb-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="fb-spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <span>📤 Submit Feedback</span>
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="fb-info-box">
            <div className="fb-info-icon">ℹ️</div>
            <div className="fb-info-content">
              <strong>How feedback works:</strong>
              <ul>
                <li>✓ Selecting a case sends feedback to the investigator</li>
                <li>✓ Feedback appears in case timeline for complete record</li>
                <li>✓ Investigator can respond to your feedback</li>
                <li>✓ All feedback is stored securely on IPFS</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Feedback History Tab */}
      {activeTab === "history" && (
        <div className="fb-list-container fb-fade-up">
          <div className="fb-list-header">
            <h2>My Feedback History</h2>
            <p>Track the status of your submitted feedback</p>
          </div>

          {feedbacks.length === 0 ? (
            <div className="fb-empty">
              <div className="fb-empty-icon">📭</div>
              <h3>No Feedback Yet</h3>
              <p>You haven't submitted any feedback yet.</p>
              <button
                className="fb-empty-btn"
                onClick={() => setActiveTab("new")}
              >
                ✍️ Submit Your First Feedback
              </button>
            </div>
          ) : (
            <div className="fb-card-list">
              {feedbacks.map((fb, idx) => {
                const statusConfig = getStatusConfig(fb.status);
                return (
                  <div
                    key={fb.feedback_id}
                    className={`fb-card ${hoveredCard === fb.feedback_id ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredCard(fb.feedback_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="fb-card-header">
                      <div className="fb-card-info">
                        <div className="fb-card-category">
                          <span
                            className="fb-category-badge"
                            style={{
                              background: `${getCategoryColor(fb.category)}20`,
                              color: getCategoryColor(fb.category),
                            }}
                          >
                            {getCategoryIcon(fb.category)}{" "}
                            {getCategoryLabel(fb.category)}
                          </span>
                          <span
                            className="fb-status-badge"
                            style={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>
                        <span className="fb-card-date">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <h4 className="fb-card-title">{fb.subject}</h4>
                    <p className="fb-card-message">{fb.message}</p>
                    {fb.case_number && (
                      <div className="fb-card-case">
                        <span className="fb-case-icon">⚖️</span>
                        <span>
                          Related Case: <strong>{fb.case_number}</strong>
                        </span>
                      </div>
                    )}
                    {fb.rating > 0 && (
                      <div className="fb-card-rating">
                        <span className="fb-rating-label-small">
                          Your Rating:
                        </span>
                        <div className="fb-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`fb-star-small ${fb.rating >= star ? "active" : ""}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        .fb-dashboard {
          padding: 24px;
          animation: fb-fadeIn 0.4s ease-out;
        }

        @keyframes fb-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fb-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fb-fade-up {
          animation: fb-slideUp 0.5s ease-out backwards;
        }

        /* Toast */
        .fb-toast {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 1000;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          padding: 12px 20px;
          min-width: 280px;
          animation: fb-toastIn 0.3s ease-out;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        @keyframes fb-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fb-toast-success {
          border-left: 3px solid #10b981;
        }
        .fb-toast-success .fb-toast-icon { color: #10b981; }
        .fb-toast-error {
          border-left: 3px solid #ef4444;
        }
        .fb-toast-error .fb-toast-icon { color: #ef4444; }

        .fb-toast-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fb-toast-icon { font-size: 1.1rem; }
        .fb-toast-message { font-size: 0.85rem; color: #e8ecf8; }

        /* Loading */
        .fb-loading { padding: 24px; }
        .fb-shimmer-card {
          background: rgba(12,15,26,0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .fb-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: fb-shimmer 1.5s infinite;
        }
        @keyframes fb-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Tabs */
        .fb-tabs-container {
          border-bottom: 1px solid rgba(99,102,241,0.15);
          margin-bottom: 28px;
        }
        .fb-tabs { display: flex; gap: 8px; }
        .fb-tab {
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
        .fb-tab::after {
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
        .fb-tab:hover { color: #e8ecf8; background: rgba(99,102,241,0.05); }
        .fb-tab.active { color: #818cf8; }
        .fb-tab.active::after { transform: scaleX(1); }
        .fb-tab-icon { font-size: 1.1rem; }
        .fb-tab-badge {
          background: rgba(99,102,241,0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 8px;
          color: #818cf8;
        }

        /* Form Container */
        .fb-form-container, .fb-list-container {
          background: rgba(12,15,26,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 16px;
          padding: 32px;
        }
        .fb-form-header, .fb-list-header {
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99,102,241,0.1);
        }
        .fb-form-header h2, .fb-list-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e8ecf8;
        }
        .fb-form-header p, .fb-list-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Form */
        .fb-form { display: flex; flex-direction: column; gap: 24px; }
        .fb-form-group { display: flex; flex-direction: column; gap: 8px; }
        .fb-form-group label { font-size: 0.8rem; font-weight: 600; color: #7a849c; }
        .fb-required { color: #ef4444; margin-left: 2px; }
        .fb-optional { color: #7a849c; font-weight: normal; margin-left: 4px; }

        /* Categories */
        .fb-categories { display: flex; gap: 12px; flex-wrap: wrap; }
        .fb-category-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 40px;
          color: #7a849c;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .fb-category-card:hover {
          border-color: #6366f1;
          background: rgba(99,102,241,0.08);
          color: #e8ecf8;
        }
        .fb-category-card.active {
          color: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .fb-category-icon { font-size: 1rem; }
        .fb-category-label { font-size: 0.85rem; font-weight: 500; }

        /* Case Select */
        .fb-select-wrapper { position: relative; }
        .fb-case-select {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          appearance: none;
          cursor: pointer;
        }
        .fb-case-select:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99,102,241,0.05);
        }
        .fb-select-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #3d4459;
        }
        .fb-hint {
          font-size: 0.7rem;
          color: #818cf8;
          padding: 6px 12px;
          background: rgba(99,102,241,0.08);
          border-radius: 8px;
        }
        .fb-hint-success {
          font-size: 0.7rem;
          color: #10b981;
          padding: 6px 12px;
          background: rgba(16,185,129,0.08);
          border-radius: 8px;
        }

        /* Inputs */
        .fb-input-wrapper, .fb-textarea-wrapper { position: relative; }
        .fb-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #3d4459;
        }
        .fb-textarea-icon {
          position: absolute;
          left: 14px;
          top: 16px;
          font-size: 1rem;
          color: #3d4459;
        }
        .fb-input-wrapper input, .fb-textarea-wrapper textarea {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
        }
        .fb-input-wrapper input:focus, .fb-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99,102,241,0.05);
        }
        .fb-textarea-wrapper textarea { resize: vertical; }

        /* Rating */
        .fb-rating { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .fb-star {
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          font-size: 1.6rem;
          color: #3d4459;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 8px;
          transition: all 0.3s;
        }
        .fb-star.active { color: #f59e0b; border-color: #f59e0b; background: rgba(245,158,11,0.08); }
        .fb-star.hovered { color: #fbbf24; transform: scale(1.05); }
        .fb-star:hover { transform: scale(1.05); }
        .fb-rating-label { font-size: 0.75rem; color: #7a849c; margin-left: 8px; }

        /* Submit Button */
        .fb-submit-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }
        .fb-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
        .fb-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .fb-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: fb-spin 0.6s linear infinite;
          margin-right: 8px;
        }
        @keyframes fb-spin { to { transform: rotate(360deg); } }

        /* Info Box */
        .fb-info-box {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          padding: 16px 20px;
          background: rgba(99,102,241,0.05);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
        }
        .fb-info-icon { font-size: 1.5rem; }
        .fb-info-content strong { display: block; font-size: 0.85rem; color: #818cf8; margin-bottom: 8px; }
        .fb-info-content ul { margin: 0; padding-left: 20px; font-size: 0.75rem; color: #7a849c; }
        .fb-info-content li { margin-bottom: 4px; }

        /* List Container */
        .fb-list-container { background: rgba(12,15,26,0.6); backdrop-filter: blur(10px); border-radius: 16px; padding: 32px; }
        .fb-list-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(99,102,241,0.1); }

        /* Cards */
        .fb-card-list { display: flex; flex-direction: column; gap: 16px; }
        .fb-card {
          background: rgba(7,9,14,0.5);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
          padding: 20px 24px;
          transition: all 0.3s;
          animation: fb-slideIn 0.3s ease-out backwards;
        }
        @keyframes fb-slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .fb-card.hovered { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); background: rgba(12,15,26,0.8); }
        .fb-card-header { margin-bottom: 12px; }
        .fb-card-info { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .fb-card-category { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .fb-category-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .fb-status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .fb-card-date { font-size: 0.7rem; color: #3d4459; }
        .fb-card-title { font-size: 1rem; font-weight: 600; margin: 12px 0 8px 0; color: #e8ecf8; }
        .fb-card-message { font-size: 0.85rem; color: #7a849c; line-height: 1.6; }
        .fb-card-case {
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(99,102,241,0.08);
          border-radius: 8px;
          font-size: 0.75rem;
          color: #818cf8;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fb-card-rating { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(99,102,241,0.1); }
        .fb-rating-label-small { font-size: 0.7rem; color: #3d4459; }
        .fb-stars { display: flex; gap: 4px; }
        .fb-star-small { font-size: 0.9rem; color: #3d4459; }
        .fb-star-small.active { color: #f59e0b; }

        /* Empty State */
        .fb-empty { text-align: center; padding: 60px 20px; }
        .fb-empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.4; }
        .fb-empty h3 { font-size: 1.2rem; margin-bottom: 8px; color: #e8ecf8; }
        .fb-empty p { color: #7a849c; margin-bottom: 20px; }
        .fb-empty-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
        }
        .fb-empty-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }

        @media (max-width: 768px) {
          .fb-dashboard { padding: 16px; }
          .fb-tab { padding: 12px 20px; font-size: 0.85rem; }
          .fb-form-container, .fb-list-container { padding: 20px; }
          .fb-categories { gap: 8px; }
          .fb-category-card { padding: 8px 16px; font-size: 0.8rem; }
          .fb-card-info { flex-direction: column; align-items: flex-start; }
          .fb-toast { top: auto; bottom: 80px; right: 10px; left: 10px; }
        }
        @media (max-width: 480px) {
          .fb-tab { padding: 10px 16px; font-size: 0.75rem; }
          .fb-tab-icon { font-size: 0.85rem; }
        }
          
        /* Custom Select Dropdown */
.fb-custom-select {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.fb-select-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: #e8ecf8;
  transition: all 0.3s;
}

.fb-select-trigger:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.fb-select-icon {
  font-size: 1rem;
  color: #3d4459;
}

.fb-select-text {
  flex: 1;
  font-size: 0.9rem;
}

.fb-select-arrow {
  font-size: 0.7rem;
  color: #3d4459;
  transition: transform 0.3s;
}

.fb-select-arrow.open {
  transform: rotate(180deg);
}

.fb-select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #0c0f1a;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.fb-select-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.fb-select-option:hover {
  background: rgba(99, 102, 241, 0.1);
}

.fb-select-option.selected {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.fb-option-number {
  font-weight: 600;
  font-size: 0.8rem;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.12);
  padding: 2px 8px;
  border-radius: 20px;
}

.fb-option-title {
  flex: 1;
  font-size: 0.85rem;
  color: #e8ecf8;
}

.fb-option-status {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  color: #7a849c;
}

.fb-no-options {
  padding: 20px;
  text-align: center;
  color: #7a849c;
  font-size: 0.8rem;
}

.fb-select-hint {
  margin-top: 8px;
}

.fb-hint {
  font-size: 0.7rem;
  color: #818cf8;
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  display: inline-block;
}

.fb-hint-success {
  font-size: 0.7rem;
  color: #10b981;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 8px;
  display: inline-block;
}
      `}</style>
    </div>
  );
}
