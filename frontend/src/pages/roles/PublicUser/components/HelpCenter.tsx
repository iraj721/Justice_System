// frontend/src/pages/roles/PublicUser/components/HelpCenter.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

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
  const [activeCategory, setActiveCategory] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      if (faqCategories.length > 0 && !activeCategory) {
        setActiveCategory(faqCategories[0].category);
      }
      setGuides(guideData.guides || []);
      setSupport(supportData);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      "general": "📌",
      "account": "👤",
      "fir": "📋",
      "case": "⚖️",
      "evidence": "🔬",
      "payment": "💰",
      "security": "🔒"
    };
    return icons[category.toLowerCase()] || "📖";
  }

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFaqs = faqs.flatMap(cat => cat.faqs);
  const filteredFaqs = searchQuery 
    ? allFaqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="hc-loading">
        <div className="hc-shimmer-card">
          <div className="hc-shimmer"></div>
        </div>
        <div className="hc-shimmer-card">
          <div className="hc-shimmer"></div>
        </div>
        <div className="hc-shimmer-card">
          <div className="hc-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hc-dashboard">
      {/* Hero Header */}
      <div className="hc-hero">
        <div className="hc-hero-icon">❓</div>
        <h1 className="hc-hero-title">Help Center</h1>
        <p className="hc-hero-subtitle">Find answers to common questions and learn how to use the system</p>
        
        {/* Search Bar */}
        <div className="hc-search">
          <span className="hc-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for help articles, guides, or FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hc-search-input"
          />
        </div>
      </div>

      {/* Support Contact Banner - Indigo Theme */}
      {support && (
        <div className="hc-support-banner">
          <div className="hc-support-icon">📞</div>
          <div className="hc-support-content">
            <h3>Need Immediate Help?</h3>
            <div className="hc-support-links">
              <div className="hc-support-item">
                <span className="hc-support-label">Helpline:</span>
                <span className="hc-support-value">{support.support?.helpline || "1234"}</span>
              </div>
              <div className="hc-support-item">
                <span className="hc-support-label">Email:</span>
                <span className="hc-support-value">{support.support?.email || "support@justice.gov.pk"}</span>
              </div>
              <div className="hc-support-item">
                <span className="hc-support-label">Timings:</span>
                <span className="hc-support-value">{support.support?.timings || "9:00 AM - 5:00 PM"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="hc-search-results hc-fade-up">
          <h3>Search Results for "{searchQuery}"</h3>
          {filteredFaqs.length === 0 && filteredGuides.length === 0 ? (
            <div className="hc-no-results">
              <span>🔍</span>
              <p>No results found. Try different keywords or browse the categories below.</p>
            </div>
          ) : (
            <>
              {filteredFaqs.length > 0 && (
                <div className="hc-results-section">
                  <h4>FAQs ({filteredFaqs.length})</h4>
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="hc-search-faq-item">
                      <strong>{faq.question}</strong>
                      <p>{faq.answer.substring(0, 150)}...</p>
                    </div>
                  ))}
                </div>
              )}
              {filteredGuides.length > 0 && (
                <div className="hc-results-section">
                  <h4>Guides ({filteredGuides.length})</h4>
                  <div className="hc-guides-grid">
                    {filteredGuides.map((guide) => (
                      <div key={guide.id} className="hc-guide-card-small">
                        <span className="hc-guide-icon-small">{guide.icon}</span>
                        <span className="hc-guide-title-small">{guide.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAQ Section */}
      {!searchQuery && faqs.length > 0 && (
        <div className="hc-faq-section hc-fade-up">
          <div className="hc-section-header">
            <h2>📖 Frequently Asked Questions</h2>
            <p>Quick answers to common questions about the platform</p>
          </div>

          {/* Category Tabs - Indigo Theme */}
          <div className="hc-category-tabs">
            {faqs.map((cat) => (
              <button
                key={cat.category}
                className={`hc-category-tab ${activeCategory === cat.category ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.category)}
              >
                <span className="hc-category-icon">{getCategoryIcon(cat.category)}</span>
                <span className="hc-category-name">{cat.category.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* FAQs Accordion */}
          <div className="hc-faq-list">
            {faqs.find(c => c.category === activeCategory)?.faqs.map((faq, idx) => (
              <div 
                key={faq.id} 
                className={`hc-faq-item ${expandedFaq === faq.id ? "expanded" : ""}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <button
                  className="hc-faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <span className="hc-faq-question-text">{faq.question}</span>
                  <span className="hc-faq-question-icon">{expandedFaq === faq.id ? "▲" : "▼"}</span>
                </button>
                {expandedFaq === faq.id && (
                  <div className="hc-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Guides Section */}
      {!searchQuery && guides.length > 0 && (
        <div className="hc-guides-section hc-fade-up">
          <div className="hc-section-header">
            <h2>📚 User Guides</h2>
            <p>Step-by-step tutorials to help you navigate the platform</p>
          </div>

          <div className="hc-guides-grid">
            {guides.map((guide, idx) => (
              <div key={guide.id} className="hc-guide-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="hc-guide-icon">{guide.icon}</div>
                <h3 className="hc-guide-title">{guide.title}</h3>
                <ul className="hc-guide-steps">
                  {guide.steps.slice(0, 3).map((step, stepIdx) => (
                    <li key={stepIdx}>
                      <span className="hc-guide-step-num">{stepIdx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                  {guide.steps.length > 3 && (
                    <li className="hc-guide-more">+{guide.steps.length - 3} more steps</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips Section */}
      {!searchQuery && (
        <div className="hc-tips-section hc-fade-up">
          <div className="hc-section-header">
            <h2>💡 Quick Tips</h2>
            <p>Pro tips to make the most of the justice system platform</p>
          </div>

          <div className="hc-tips-grid">
            <div className="hc-tip-card">
              <div className="hc-tip-icon">🔐</div>
              <div className="hc-tip-content">
                <strong>Save Evidence Hash</strong>
                <p>Always save the hash of uploaded evidence for future verification</p>
              </div>
            </div>
            <div className="hc-tip-card">
              <div className="hc-tip-icon">📋</div>
              <div className="hc-tip-content">
                <strong>Save FIR Number</strong>
                <p>Keep your FIR number handy for tracking case status</p>
              </div>
            </div>
            <div className="hc-tip-card">
              <div className="hc-tip-icon">📱</div>
              <div className="hc-tip-content">
                <strong>Update Profile</strong>
                <p>Keep your contact info updated for important notifications</p>
              </div>
            </div>
            <div className="hc-tip-card">
              <div className="hc-tip-icon">🚨</div>
              <div className="hc-tip-content">
                <strong>Emergency SOS</strong>
                <p>Add emergency contacts to enable the SOS feature</p>
              </div>
            </div>
            <div className="hc-tip-card">
              <div className="hc-tip-icon">🔔</div>
              <div className="hc-tip-content">
                <strong>Enable Notifications</strong>
                <p>Turn on notifications to get real-time case updates</p>
              </div>
            </div>
            <div className="hc-tip-card">
              <div className="hc-tip-icon">📎</div>
              <div className="hc-tip-content">
                <strong>Upload Documents</strong>
                <p>Store important documents securely on blockchain</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Indigo Theme Styles */
        .hc-dashboard {
          padding: 24px;
          animation: hc-fadeIn 0.4s ease-out;
        }

        @keyframes hc-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes hc-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hc-fade-up {
          animation: hc-slideUp 0.5s ease-out backwards;
        }

        /* Shimmer Loading */
        .hc-loading {
          padding: 24px;
        }

        .hc-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .hc-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: hc-shimmer 1.5s infinite;
        }

        @keyframes hc-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Hero Section */
        .hc-hero {
          background: linear-gradient(135deg, rgba(12, 15, 26, 0.9), rgba(7, 9, 14, 0.95));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          margin-bottom: 28px;
        }

        .hc-hero-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .hc-hero-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #e8ecf8;
          margin-bottom: 10px;
        }

        .hc-hero-subtitle {
          font-size: 0.9rem;
          color: #7a849c;
          max-width: 600px;
          margin: 0 auto 28px;
        }

        /* Search Bar */
        .hc-search {
          position: relative;
          max-width: 500px;
          margin: 0 auto;
        }

        .hc-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        .hc-search-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 40px;
          color: #e8ecf8;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .hc-search-input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .hc-search-input::placeholder {
          color: #3d4459;
        }

        /* Support Banner - Indigo Theme */
        .hc-support-banner {
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          padding: 20px 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .hc-support-icon {
          font-size: 2rem;
        }

        .hc-support-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 12px 0;
        }

        .hc-support-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .hc-support-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }

        .hc-support-label {
          color: #3d4459;
        }

        .hc-support-value {
          color: #818cf8;
          font-weight: 500;
        }

        /* Section Header */
        .hc-section-header {
          margin-bottom: 28px;
        }

        .hc-section-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8ecf8;
          margin-bottom: 6px;
        }

        .hc-section-header p {
          font-size: 0.85rem;
          color: #7a849c;
        }

        /* Category Tabs - Indigo Theme */
        .hc-category-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          background: rgba(12, 15, 26, 0.5);
          padding: 8px;
          border-radius: 12px;
          width: fit-content;
        }

        .hc-category-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #7a849c;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .hc-category-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.08);
        }

        .hc-category-tab.active {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .hc-category-icon {
          font-size: 0.9rem;
        }

        .hc-category-name {
          font-size: 0.8rem;
        }

        /* FAQ Section - Indigo Theme */
        .hc-faq-section {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 28px;
        }

        .hc-faq-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hc-faq-item {
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .hc-faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s;
          border-radius: 8px;
        }

        .hc-faq-question:hover {
          background: rgba(99, 102, 241, 0.06);
        }

        .hc-faq-question-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: #e8ecf8;
        }

        .hc-faq-question-icon {
          font-size: 0.7rem;
          color: #3d4459;
          transition: transform 0.3s;
        }

        .hc-faq-item.expanded .hc-faq-question-icon {
          transform: rotate(180deg);
        }

        .hc-faq-answer {
          padding: 0 12px 20px 12px;
          color: #7a849c;
          font-size: 0.85rem;
          line-height: 1.7;
        }

        /* Guides Section - Indigo Theme */
        .hc-guides-section {
          margin-bottom: 28px;
        }

        .hc-guides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .hc-guide-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 24px;
          transition: all 0.3s;
          animation: hc-slideIn 0.3s ease-out backwards;
        }

        @keyframes hc-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .hc-guide-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-3px);
          background: rgba(12, 15, 26, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .hc-guide-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .hc-guide-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 16px;
        }

        .hc-guide-steps {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .hc-guide-steps li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: #7a849c;
          margin-bottom: 10px;
        }

        .hc-guide-step-num {
          width: 22px;
          height: 22px;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: #818cf8;
        }

        .hc-guide-more {
          color: #818cf8;
          cursor: pointer;
          margin-top: 8px;
        }

        /* Tips Section - Indigo Theme */
        .hc-tips-section {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
        }

        .hc-tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .hc-tip-card {
          display: flex;
          gap: 14px;
          padding: 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 12px;
          transition: all 0.3s;
        }

        .hc-tip-card:hover {
          background: rgba(12, 15, 26, 0.8);
          transform: translateY(-2px);
          border-left: 2px solid #6366f1;
        }

        .hc-tip-icon {
          font-size: 1.5rem;
        }

        .hc-tip-content strong {
          display: block;
          font-size: 0.85rem;
          color: #e8ecf8;
          margin-bottom: 6px;
        }

        .hc-tip-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Search Results - Indigo Theme */
        .hc-search-results {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 28px;
        }

        .hc-search-results h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 20px;
        }

        .hc-results-section {
          margin-bottom: 20px;
        }

        .hc-results-section h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
        }

        .hc-search-faq-item {
          padding: 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .hc-search-faq-item strong {
          font-size: 0.85rem;
          color: #e8ecf8;
          display: block;
          margin-bottom: 6px;
        }

        .hc-search-faq-item p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        .hc-guide-card-small {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 40px;
          margin-right: 10px;
          margin-bottom: 10px;
          transition: all 0.3s;
        }

        .hc-guide-card-small:hover {
          background: rgba(99, 102, 241, 0.1);
          transform: translateY(-1px);
        }

        .hc-guide-icon-small {
          font-size: 0.9rem;
        }

        .hc-guide-title-small {
          font-size: 0.8rem;
          color: #e8ecf8;
        }

        .hc-no-results {
          text-align: center;
          padding: 40px;
          color: #3d4459;
        }

        .hc-no-results span {
          font-size: 3rem;
          display: block;
          margin-bottom: 12px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hc-dashboard {
            padding: 16px;
          }

          .hc-hero {
            padding: 32px 20px;
          }

          .hc-hero-title {
            font-size: 1.4rem;
          }

          .hc-category-tabs {
            width: 100%;
            border-radius: 10px;
          }

          .hc-category-tab {
            flex: 1;
            justify-content: center;
            padding: 8px 12px;
          }

          .hc-category-name {
            font-size: 0.7rem;
          }

          .hc-support-banner {
            flex-direction: column;
            text-align: center;
          }

          .hc-support-links {
            justify-content: center;
          }

          .hc-guides-grid, .hc-tips-grid {
            grid-template-columns: 1fr;
          }

          .hc-faq-question-text {
            font-size: 0.85rem;
          }

          .hc-faq-question {
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .hc-category-tab {
            padding: 6px 10px;
          }
          
          .hc-category-name {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}