// frontend/src/features/dashboard/HelpCenter.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

type FAQCategory = {
  category: string;
  faqs: FAQ[];
};

type Guide = {
  id: string;
  title: string;
  icon: string;
  steps: string[];
};

export function HelpCenter() {
  const [faqs, setFaqs] = useState<FAQCategory[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [support, setSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("general");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    loadHelpData();
  }, []);

  async function loadHelpData() {
    try {
      const [faqData, guideData, supportData] = await Promise.all([
        apiRequest<any>("/help/faq").catch(() => ({ categories: [], faqs: {} })),
        apiRequest<{ guides: Guide[] }>("/help/guides").catch(() => ({ guides: [] })),
        apiRequest<any>("/help/contact").catch(() => ({}))
      ]);
      
      // Process FAQs
      const faqCategories: FAQCategory[] = [];
      if (faqData.faqs) {
        for (const [cat, faqList] of Object.entries(faqData.faqs)) {
          faqCategories.push({
            category: cat,
            faqs: faqList as FAQ[]
          });
        }
      }
      setFaqs(faqCategories);
      setGuides(guideData.guides || []);
      setSupport(supportData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p>Loading help center...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ textAlign: "center", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❓</div>
        <h2 style={{ color: "white" }}>Help Center</h2>
        <p style={{ opacity: 0.8 }}>Find answers to common questions and learn how to use the system</p>
      </div>

      {/* Support Contact */}
      {support && (
        <div className="card" style={{ background: "#f8fafc" }}>
          <h3>📞 Need Immediate Help?</h3>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <strong>Helpline:</strong> {support.support?.helpline || "1234"}
            </div>
            <div>
              <strong>Email:</strong> {support.support?.email || "support@justice.gov.pk"}
            </div>
            <div>
              <strong>Timings:</strong> {support.support?.timings || "9:00 AM - 5:00 PM"}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="card">
        <h3>📖 Frequently Asked Questions</h3>
        
        {/* Category Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
          {faqs.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              style={{
                background: activeCategory === cat.category ? "#3b82f6" : "transparent",
                color: activeCategory === cat.category ? "white" : "#64748b",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              {cat.category.toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* FAQs List */}
        {faqs.find(c => c.category === activeCategory)?.faqs.map((faq) => (
          <div key={faq.id} style={{ borderBottom: "1px solid #e2e8f0", marginBottom: "12px" }}>
            <button
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <strong>{faq.question}</strong>
              <span>{expandedFaq === faq.id ? "▲" : "▼"}</span>
            </button>
            {expandedFaq === faq.id && (
              <div style={{ padding: "0 12px 12px 12px", color: "#666" }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Guides */}
      <div className="card">
        <h3>📚 User Guides</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {guides.map((guide) => (
            <div key={guide.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>{guide.icon}</div>
              <h4 style={{ margin: "8px 0" }}>{guide.title}</h4>
              <ol style={{ margin: "8px 0 0 20px", fontSize: "13px", color: "#666" }}>
                {guide.steps.slice(0, 3).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
                {guide.steps.length > 3 && <li>...</li>}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="card">
        <h3>💡 Quick Tips</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔐</span>
            <div><strong>Save Evidence Hash</strong> - Always save the hash of uploaded evidence for future verification</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>📋</span>
            <div><strong>Save FIR Number</strong> - Keep your FIR number for tracking case status</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>📱</span>
            <div><strong>Update Profile</strong> - Keep your contact info updated for notifications</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🚨</span>
            <div><strong>Emergency SOS</strong> - Add emergency contacts for SOS feature</div>
          </div>
        </div>
      </div>
    </div>
  );
}