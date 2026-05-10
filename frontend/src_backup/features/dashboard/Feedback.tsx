// frontend/src/features/dashboard/Feedback.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

type Feedback = {
  feedback_id: string;
  category: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  created_at: string;
};

type Category = {
  value: string;
  label: string;
  icon: string;
};

export function Feedback({ token }: { token: string }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("COMPLAINT");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [fb, cats] = await Promise.all([
        apiRequest<Feedback[]>("/feedback/my-feedback", { token }).catch(() => []),
        apiRequest<{ categories: Category[] }>("/feedback/categories", { token }).catch(() => ({ categories: [] }))
      ]);
      setFeedbacks(fb);
      setCategories(cats.categories || [
        { value: "COMPLAINT", label: "Complaint", icon: "⚠️" },
        { value: "SUGGESTION", label: "Suggestion", icon: "💡" },
        { value: "APPRECIATION", label: "Appreciation", icon: "👍" },
        { value: "BUG", label: "Bug Report", icon: "🐛" }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!subject || !message) {
      setSubmitMessage("❌ Please fill subject and message");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/feedback/submit", {
        method: "POST",
        token,
        body: {
          category: selectedCategory,
          subject,
          message,
          rating: rating || null
        }
      });
      setSubmitMessage("✅ Feedback submitted successfully! Thank you.");
      setSubject("");
      setMessage("");
      setRating(0);
      setActiveTab("history");
      loadData();
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (err) {
      setSubmitMessage("❌ Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  function getCategoryIcon(category: string): string {
    const found = categories.find(c => c.value === category);
    return found?.icon || "📝";
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      "PENDING": "#f59e0b",
      "IN_PROGRESS": "#3b82f6",
      "RESOLVED": "#10b981",
      "REJECTED": "#ef4444"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>{status}</span>;
  }

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <button onClick={() => setActiveTab("new")} style={{ background: activeTab === "new" ? "#3b82f6" : "transparent", color: activeTab === "new" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          ✍️ New Feedback
        </button>
        <button onClick={() => setActiveTab("history")} style={{ background: activeTab === "history" ? "#3b82f6" : "transparent", color: activeTab === "history" ? "white" : "#64748b", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          📋 My Feedback ({feedbacks.length})
        </button>
      </div>

      {/* New Feedback Form */}
      {activeTab === "new" && (
        <div className="card">
          <h3>✍️ Submit Feedback</h3>
          {submitMessage && (
            <div style={{ padding: "12px", background: submitMessage.includes("✅") ? "#d1fae5" : "#fee2e2", borderRadius: "8px", marginBottom: "16px" }}>
              {submitMessage}
            </div>
          )}
          
          <div className="form-grid">
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>
            
            <label>Subject *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief subject line" />
            
            <label>Message *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your feedback, complaint, or suggestion in detail..." />
            
            <label>Rating (Optional)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} style={{ background: rating >= star ? "#f59e0b" : "#e2e8f0", border: "none", fontSize: "24px", cursor: "pointer", borderRadius: "8px", width: "40px", height: "40px" }}>
                  ★
                </button>
              ))}
            </div>
            
            <button onClick={handleSubmit} disabled={submitting} style={{ background: "#8b5cf6", cursor: "pointer" }}>
              {submitting ? "Submitting..." : "📤 Submit Feedback"}
            </button>
          </div>
        </div>
      )}

      {/* Feedback History */}
      {activeTab === "history" && (
        <div className="card">
          <h3>📋 My Feedback History</h3>
          {feedbacks.length === 0 ? (
            <p>No feedback submitted yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {feedbacks.map((fb) => (
                <div key={fb.feedback_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                    <div>
                      <strong>{getCategoryIcon(fb.category)} {fb.category}</strong>
                      <span style={{ marginLeft: "8px" }}>{getStatusBadge(fb.status)}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#666" }}>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ margin: "8px 0" }}>{fb.subject}</h4>
                  <p style={{ fontSize: "14px", color: "#666" }}>{fb.message}</p>
                  {fb.rating && (
                    <div style={{ fontSize: "12px", color: "#f59e0b" }}>
                      Rating: {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}