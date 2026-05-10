import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";
import { CaseTimeline } from "../../../../shared/components/CaseTimeline";

type UserCase = {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
  created_at: string;
};

export function CaseTracker({ token, caseId }: { token: string; caseId?: string }) {
  const [myCases, setMyCases] = useState<UserCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    loadMyCases();
  }, []);

  async function loadMyCases() {
    setLoading(true);
    setError(null);
    try {
      // Get FIRs to find cases for complainant
      const myFirs = await apiRequest<any[]>("/fir/my", { token });
      console.log("My FIRs:", myFirs);
      
      // Get case IDs from FIRs
      const caseIds = myFirs.filter(f => f.case_id).map(f => f.case_id);
      
      // Fetch case details
      const casesData = [];
      for (const cid of caseIds) {
        try {
          const caseData = await apiRequest<any>(`/cases/${cid}`, { token });
          casesData.push({
            case_id: caseData.case_id,
            case_number: caseData.case_number,
            title: caseData.title,
            status: caseData.status,
            created_at: caseData.created_at
          });
        } catch (err) {
          console.error(`Error fetching case ${cid}:`, err);
        }
      }
      
      setMyCases(casesData);
      if (casesData.length === 1 && !selectedCaseId) {
        setSelectedCaseId(casesData[0].case_id);
      }
    } catch (err) {
      console.error("Error loading cases:", err);
      setError("Failed to load your cases");
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      "UNDER_INVESTIGATION": "#f59e0b",
      "SUBMITTED_TO_COURT": "#8b5cf6",
      "DECIDED": "#10b981",
      "CLOSED": "#6b7280",
      "FORENSIC_PENDING": "#f59e0b",
      "FORENSIC_ACCEPTED": "#6366f1",
      "FORENSIC_COMPLETED": "#10b981"
    };
    return colors[status] || "#6366f1";
  }

  if (loading) {
    return (
      <div className="ct-loading">
        <div className="ct-spinner"></div>
        <p>Loading your cases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ct-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={loadMyCases} className="ct-retry-btn">Retry</button>
      </div>
    );
  }

  if (myCases.length === 0) {
    return (
      <div className="ct-empty">
        <div className="ct-empty-icon">📭</div>
        <h3>No Cases Found</h3>
        <p>You haven't filed any FIRs or no cases have been created yet.</p>
        <button onClick={() => window.location.href = "/fir"} className="ct-fir-btn">
          📝 File a New FIR
        </button>
      </div>
    );
  }

  return (
    <div className="ct-dashboard">
      {/* Header */}
      <div className="ct-header">
        <div className="ct-header-icon">⚖️</div>
        <div>
          <h2>My Cases</h2>
          <p>Track the progress of your filed cases</p>
        </div>
      </div>

      {/* Case Selection */}
      {myCases.length > 1 && (
        <div className="ct-case-selector">
          <label>Select Case to Track:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setShowTimeline(false);
              setTimeout(() => setShowTimeline(true), 100);
            }}
            className="ct-case-select"
          >
            {myCases.map((caseItem) => (
              <option key={caseItem.case_id} value={caseItem.case_id}>
                {caseItem.case_number} - {caseItem.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Case Timeline Component */}
      {selectedCaseId && (
        <div className="ct-timeline-wrapper">
          <CaseTimeline token={token} caseId={selectedCaseId} />
        </div>
      )}

      <style>{`
        .ct-dashboard {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .ct-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
        }

        .ct-header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .ct-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .ct-header p {
          color: #7a849c;
          margin: 0;
        }

        .ct-case-selector {
          margin-bottom: 24px;
          background: rgba(12, 15, 26, 0.6);
          padding: 16px 20px;
          border-radius: 12px;
        }

        .ct-case-selector label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 8px;
        }

        .ct-case-select {
          width: 100%;
          padding: 12px 16px;
          background: rgba(7, 9, 14, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .ct-timeline-wrapper {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ct-loading, .ct-error {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }

        .ct-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ct-error {
          color: #f87171;
        }

        .ct-retry-btn {
          margin-top: 16px;
          padding: 8px 20px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        .ct-empty {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }

        .ct-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .ct-empty h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .ct-empty p {
          color: #7a849c;
          margin-bottom: 20px;
        }

        .ct-fir-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}