// frontend/src/pages/roles/Investigator/components/AdvancedSearchPanel.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type SearchResult = {
  case: any;
  fir: {
    fir_number: string;
    complainant_name: string;
    complainant_contact: string;
    incident_location: string;
    incident_datetime: string;
  } | null;
};

export function AdvancedSearchPanel({ token, onCaseSelect }: { token: string; onCaseSelect?: (caseId: string) => void }) {
  const [searchParams, setSearchParams] = useState({
    q: "",
    status: "",
    priority: "",
    from_date: "",
    to_date: "",
    fir_number: "",
    complainant_name: ""
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [searchName, setSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hoveredResult, setHoveredResult] = useState<string | null>(null);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  async function loadSavedSearches() {
    try {
      const data = await apiRequest<any[]>("/investigator/search/saved-searches", { token });
      setSavedSearches(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSearch() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const data = await apiRequest<{ total: number; results: SearchResult[] }>(`/investigator/search/cases?${queryParams.toString()}`, { token });
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSearch() {
    if (!searchName) return;
    try {
      await apiRequest("/investigator/search/save-search", {
        method: "POST",
        token,
        body: { name: searchName, query: searchParams }
      });
      setShowSaveDialog(false);
      setSearchName("");
      loadSavedSearches();
    } catch (err) {
      console.error(err);
    }
  }

  function loadSavedSearch(query: any) {
    setSearchParams(query);
    handleSearch();
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      UNDER_INVESTIGATION: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      SUBMITTED_TO_COURT: { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" },
      DECIDED: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" }
    };
    const style = colors[status] || { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" };
    return (
      <span className="status-badge" style={{ background: style.bg, color: style.color }}>
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      HIGH: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
      MEDIUM: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
      LOW: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" }
    };
    const style = colors[priority] || { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" };
    return (
      <span className="priority-badge" style={{ background: style.bg, color: style.color }}>
        {priority}
      </span>
    );
  }

  return (
    <div className="asp-dashboard">
      {/* Search Form Card */}
      <div className="asp-card asp-fade-up">
        <div className="asp-card-header">
          <div className="asp-card-icon">🔍</div>
          <div>
            <h3>Advanced Search</h3>
            <p>Search cases using multiple criteria</p>
          </div>
        </div>
        
        <div className="asp-form">
          <div className="asp-form-grid">
            <div className="asp-form-group">
              <label>🔑 Keyword (Title/Description)</label>
              <div className="asp-input-wrapper">
                <span className="asp-input-icon">🔍</span>
                <input 
                  value={searchParams.q} 
                  onChange={(e) => setSearchParams({...searchParams, q: e.target.value})} 
                  placeholder="Search by title or description..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>📊 Status</label>
              <div className="asp-select-wrapper">
                <select value={searchParams.status} onChange={(e) => setSearchParams({...searchParams, status: e.target.value})}>
                  <option value="">All Status</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="SUBMITTED_TO_COURT">Submitted to Court</option>
                  <option value="DECIDED">Decided</option>
                </select>
                <span className="asp-select-icon">📋</span>
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>⚠️ Priority</label>
              <div className="asp-select-wrapper">
                <select value={searchParams.priority} onChange={(e) => setSearchParams({...searchParams, priority: e.target.value})}>
                  <option value="">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <span className="asp-select-icon">⚡</span>
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>📅 From Date</label>
              <div className="asp-input-wrapper">
                <span className="asp-input-icon">📅</span>
                <input type="date" value={searchParams.from_date} onChange={(e) => setSearchParams({...searchParams, from_date: e.target.value})} />
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>📅 To Date</label>
              <div className="asp-input-wrapper">
                <span className="asp-input-icon">📅</span>
                <input type="date" value={searchParams.to_date} onChange={(e) => setSearchParams({...searchParams, to_date: e.target.value})} />
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>📋 FIR Number</label>
              <div className="asp-input-wrapper">
                <span className="asp-input-icon">📄</span>
                <input 
                  value={searchParams.fir_number} 
                  onChange={(e) => setSearchParams({...searchParams, fir_number: e.target.value})} 
                  placeholder="JUSTICE-2025-XXXXX"
                />
              </div>
            </div>
            
            <div className="asp-form-group">
              <label>👤 Complainant Name</label>
              <div className="asp-input-wrapper">
                <span className="asp-input-icon">👤</span>
                <input 
                  value={searchParams.complainant_name} 
                  onChange={(e) => setSearchParams({...searchParams, complainant_name: e.target.value})} 
                  placeholder="Search by complainant name"
                />
              </div>
            </div>
          </div>
          
          <div className="asp-form-actions">
            <button className="asp-btn asp-btn-primary" onClick={handleSearch}>
              🔍 Search Cases
            </button>
            <button className="asp-btn asp-btn-secondary" onClick={() => setShowSaveDialog(true)}>
              💾 Save This Search
            </button>
          </div>
        </div>
      </div>

      {/* Save Search Dialog Modal */}
      {showSaveDialog && (
        <div className="asp-modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="asp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asp-modal-header">
              <h3>💾 Save Search</h3>
              <button className="asp-modal-close" onClick={() => setShowSaveDialog(false)}>✕</button>
            </div>
            <div className="asp-modal-body">
              <div className="asp-form-group">
                <label>Search Name</label>
                <div className="asp-input-wrapper">
                  <span className="asp-input-icon">🏷️</span>
                  <input 
                    value={searchName} 
                    onChange={(e) => setSearchName(e.target.value)} 
                    placeholder="e.g., High Priority Cases, Recent FIRs"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="asp-modal-footer">
              <button className="asp-btn asp-btn-secondary" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="asp-btn asp-btn-success" onClick={saveSearch}>Save Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="asp-card asp-fade-up">
          <div className="asp-card-header small">
            <div className="asp-card-icon">📚</div>
            <div>
              <h3>Saved Searches</h3>
              <p>Quick access to your saved search queries</p>
            </div>
          </div>
          <div className="asp-saved-searches">
            {savedSearches.map((s: any, idx: number) => (
              <button 
                key={s.id} 
                className="asp-saved-search-btn"
                onClick={() => loadSavedSearch(s.query)}
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <span className="asp-saved-icon">🔖</span>
                <span className="asp-saved-name">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="asp-card asp-fade-up">
        <div className="asp-card-header">
          <div className="asp-card-icon">📋</div>
          <div>
            <h3>Search Results</h3>
            <p>{total} case{total !== 1 ? 's' : ''} found</p>
          </div>
          {total > 0 && <span className="asp-results-badge">{total}</span>}
        </div>
        
        {loading ? (
          <div className="asp-loading">
            <div className="asp-spinner"></div>
            <p>Searching cases...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="asp-empty">
            <div className="asp-empty-icon">🔍</div>
            <h4>No Results Found</h4>
            <p>Try different search criteria or clear filters</p>
          </div>
        ) : (
          <div className="asp-results-list">
            {results.map((item, idx) => (
              <div 
                key={idx} 
                className={`asp-result-card ${hoveredResult === item.case.case_id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredResult(item.case.case_id)}
                onMouseLeave={() => setHoveredResult(null)}
                onClick={() => onCaseSelect?.(item.case.case_id)}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="asp-result-header">
                  <div className="asp-result-info">
                    <span className="asp-result-number">{item.case.case_number}</span>
                    {getStatusBadge(item.case.status)}
                    {getPriorityBadge(item.case.priority)}
                  </div>
                  <span className="asp-result-date">
                    {new Date(item.case.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="asp-result-title">{item.case.title}</h4>
                <p className="asp-result-desc">{item.case.description?.substring(0, 120)}...</p>
                
                {item.fir && (
                  <div className="asp-result-fir">
                    <div className="asp-fir-detail">
                      <span className="asp-detail-icon">👤</span>
                      <span><strong>Complainant:</strong> {item.fir.complainant_name}</span>
                    </div>
                    <div className="asp-fir-detail">
                      <span className="asp-detail-icon">📋</span>
                      <span><strong>FIR:</strong> {item.fir.fir_number}</span>
                    </div>
                    <div className="asp-fir-detail">
                      <span className="asp-detail-icon">📍</span>
                      <span><strong>Location:</strong> {item.fir.incident_location}</span>
                    </div>
                  </div>
                )}
                
                <div className="asp-result-footer">
                  <span className="asp-result-click">Click to view case details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* Advanced Search Panel Styles - Indigo Theme */
        .asp-dashboard {
          animation: asp-fadeIn 0.4s ease-out;
        }

        @keyframes asp-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes asp-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .asp-fade-up {
          animation: asp-slideUp 0.5s ease-out backwards;
        }

        /* Cards */
        .asp-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .asp-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .asp-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .asp-card-header.small {
          margin-bottom: 16px;
          padding-bottom: 12px;
        }

        .asp-card-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .asp-card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .asp-card-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        .asp-results-badge {
          margin-left: auto;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* Form */
        .asp-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .asp-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .asp-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .asp-form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
          letter-spacing: 0.3px;
        }

        /* Input Wrappers */
        .asp-input-wrapper {
          position: relative;
        }

        .asp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .asp-input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
          transition: all 0.3s;
        }

        .asp-input-wrapper input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .asp-input-wrapper input::placeholder {
          color: #3d4459;
        }

        /* Select Wrapper */
        .asp-select-wrapper {
          position: relative;
        }

        .asp-select-wrapper select {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
          appearance: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .asp-select-wrapper select:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        .asp-select-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        /* Form Actions */
        .asp-form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 8px;
        }

        /* Buttons */
        .asp-btn {
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .asp-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .asp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .asp-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .asp-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
          transform: translateY(-2px);
        }

        .asp-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .asp-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        /* Saved Searches */
        .asp-saved-searches {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .asp-saved-search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 40px;
          color: #818cf8;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s;
          animation: asp-slideIn 0.3s ease-out backwards;
        }

        @keyframes asp-slideIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .asp-saved-search-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }

        .asp-saved-icon {
          font-size: 0.9rem;
        }

        .asp-saved-name {
          font-weight: 500;
        }

        /* Results List */
        .asp-results-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .asp-result-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: asp-resultIn 0.3s ease-out backwards;
        }

        @keyframes asp-resultIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .asp-result-card.hovered {
          border-color: rgba(99, 102, 241, 0.35);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .asp-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .asp-result-info {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .asp-result-number {
          font-weight: 700;
          font-size: 0.8rem;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .status-badge, .priority-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .asp-result-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .asp-result-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #e8ecf8;
        }

        .asp-result-desc {
          font-size: 0.8rem;
          color: #7a849c;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .asp-result-fir {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding: 12px 0;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          margin-bottom: 12px;
        }

        .asp-fir-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #7a849c;
        }

        .asp-detail-icon {
          font-size: 0.8rem;
        }

        .asp-fir-detail strong {
          color: #e8ecf8;
        }

        .asp-result-footer {
          text-align: right;
        }

        .asp-result-click {
          font-size: 0.7rem;
          color: #818cf8;
          transition: all 0.3s;
        }

        .asp-result-card:hover .asp-result-click {
          transform: translateX(4px);
          display: inline-block;
        }

        /* Modal */
        .asp-modal-overlay {
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
          animation: asp-fadeInModal 0.2s ease;
        }

        @keyframes asp-fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .asp-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 450px;
          animation: asp-slideUpModal 0.3s ease;
        }

        @keyframes asp-slideUpModal {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .asp-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }

        .asp-modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }

        .asp-modal-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .asp-modal-close:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #e8ecf8;
        }

        .asp-modal-body {
          padding: 24px;
        }

        .asp-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }

        /* Loading State */
        .asp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .asp-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: asp-spin 0.8s linear infinite;
        }

        @keyframes asp-spin {
          to { transform: rotate(360deg); }
        }

        .asp-loading p {
          color: #7a849c;
        }

        /* Empty State */
        .asp-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .asp-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .asp-empty h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .asp-empty p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .asp-card {
            padding: 20px;
          }

          .asp-form-grid {
            gap: 16px;
          }

          .asp-form-actions {
            flex-direction: column;
          }

          .asp-btn {
            width: 100%;
            text-align: center;
          }

          .asp-result-fir {
            flex-direction: column;
            gap: 8px;
          }

          .asp-result-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}