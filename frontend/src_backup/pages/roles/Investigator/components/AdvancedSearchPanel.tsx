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
    const colors: Record<string, string> = {
      UNDER_INVESTIGATION: "#f59e0b",
      SUBMITTED_TO_COURT: "#8b5cf6",
      DECIDED: "#10b981"
    };
    return <span style={{ background: colors[status] || "#6b7280", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>{status.replace(/_/g, " ")}</span>;
  }

  return (
    <div>
      {/* Search Form */}
      <div className="card">
        <h3>🔍 Advanced Search</h3>
        <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label>Keyword (Title/Description)</label>
            <input value={searchParams.q} onChange={(e) => setSearchParams({...searchParams, q: e.target.value})} placeholder="Search..." />
          </div>
          <div>
            <label>Status</label>
            <select value={searchParams.status} onChange={(e) => setSearchParams({...searchParams, status: e.target.value})}>
              <option value="">All</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="SUBMITTED_TO_COURT">Submitted to Court</option>
              <option value="DECIDED">Decided</option>
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select value={searchParams.priority} onChange={(e) => setSearchParams({...searchParams, priority: e.target.value})}>
              <option value="">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label>From Date</label>
            <input type="date" value={searchParams.from_date} onChange={(e) => setSearchParams({...searchParams, from_date: e.target.value})} />
          </div>
          <div>
            <label>To Date</label>
            <input type="date" value={searchParams.to_date} onChange={(e) => setSearchParams({...searchParams, to_date: e.target.value})} />
          </div>
          <div>
            <label>FIR Number</label>
            <input value={searchParams.fir_number} onChange={(e) => setSearchParams({...searchParams, fir_number: e.target.value})} placeholder="JUSTICE-2025-XXXXX" />
          </div>
          <div>
            <label>Complainant Name</label>
            <input value={searchParams.complainant_name} onChange={(e) => setSearchParams({...searchParams, complainant_name: e.target.value})} placeholder="Search by name" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button onClick={handleSearch} style={{ background: "#3b82f6", cursor: "pointer" }}>🔍 Search</button>
          <button onClick={() => setShowSaveDialog(true)} style={{ background: "#10b981", cursor: "pointer" }}>💾 Save Search</button>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="card">
          <h3>💾 Save Search</h3>
          <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Search name" style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={saveSearch} style={{ background: "#10b981", cursor: "pointer" }}>Save</button>
            <button onClick={() => setShowSaveDialog(false)} style={{ background: "#6b7280", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="card">
          <h3>📚 Saved Searches</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {savedSearches.map((s: any) => (
              <button key={s.id} onClick={() => loadSavedSearch(s.query)} style={{ background: "#f3f4f6", color: "#1f2937", cursor: "pointer", padding: "6px 12px", borderRadius: "20px", fontSize: "12px" }}>
                🔖 {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="card">
        <h3>📋 Search Results ({total} found)</h3>
        {loading ? (
          <p>Searching...</p>
        ) : results.length === 0 ? (
          <p>No results found. Try different search criteria.</p>
        ) : (
          results.map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "12px", cursor: "pointer" }} onClick={() => onCaseSelect?.(item.case.case_id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <strong>{item.case.case_number}</strong>
                {getStatusBadge(item.case.status)}
              </div>
              <h4 style={{ margin: "8px 0" }}>{item.case.title}</h4>
              <p style={{ fontSize: "13px", color: "#666" }}>{item.case.description?.substring(0, 150)}...</p>
              {item.fir && (
                <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
                  <strong>Complainant:</strong> {item.fir.complainant_name} | <strong>FIR:</strong> {item.fir.fir_number}
                </div>
              )}
              <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                Created: {new Date(item.case.created_at).toLocaleDateString()} | Priority: {item.case.priority}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}