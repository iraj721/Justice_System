import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

type BlockchainStatus = {
  connected: boolean;
  chain_id?: number;
  latest_block?: number;
  contract_address?: string;
  contract_deployed?: boolean;
  message?: string;
};

type SystemStats = {
  total_users: number;
  total_firs: number;
  total_cases: number;
  total_evidence: number;
  total_forensic_reports: number;
  total_judgments: number;
};

type Anchor = {
  tx_hash: string;
  block_number: number;
  object_hash: string;
  object_type: string;
  case_id?: string;
  evidence_type?: number;
  collected_by?: string;
  cid?: string;
  recorder?: string;
  datetime: string;
};

type Judgment = {
  tx_hash: string;
  block_number: number;
  judgment_id: string;
  case_id: string;
  judge: string;
  verdict: number;
  datetime: string;
};

type BlockchainUser = {
  tx_hash: string;
  block_number: number;
  user: string;
  role: number;
  datetime: string;
};

type BlockchainFIR = {
  tx_hash: string;
  block_number: number;
  fir_id: string;
  complainant: string;
  status: number;
  datetime: string;
};

type SummaryData = {
  success: boolean;
  connected: boolean;
  contract_address: string;
  chain_id: number;
  latest_block: number;
  system_stats: SystemStats;
  recent_counts: {
    evidence_events: number;
    judgment_events: number;
    user_events: number;
    fir_events: number;
  };
};

type Block = {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
  }>;
  gasUsed: number;
  gasLimit: number;
};

export function BlockchainViewer({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<
    "summary" | "users" | "firs" | "evidence" | "judgments" | "blocks"
  >("summary");
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [users, setUsers] = useState<BlockchainUser[]>([]);
  const [firs, setFirs] = useState<BlockchainFIR[]>([]);
  const [evidence, setEvidence] = useState<Anchor[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [verifyEvidenceId, setVerifyEvidenceId] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState("");

  const loadData = async () => {
    try {
      const [
        statusData,
        summaryData,
        usersData,
        firsData,
        evidenceData,
        judgmentsData,
      ] = await Promise.all([
        apiRequest<BlockchainStatus>("/blockchain/status", { token }),
        apiRequest<SummaryData>("/blockchain/summary", { token }),
        apiRequest<{ users: BlockchainUser[] }>("/blockchain/users", { token }),
        apiRequest<{ firs: BlockchainFIR[] }>("/blockchain/firs", { token }),
        apiRequest<{ anchors: Anchor[] }>("/blockchain/anchors", { token }),
        apiRequest<{ judgments: Judgment[] }>("/blockchain/judgments", {
          token,
        }),
      ]);

      setStatus(statusData);
      setSummary(summaryData);
      setUsers(usersData.users || []);
      setFirs(firsData.firs || []);
      setEvidence(evidenceData.anchors || []);
      setJudgments(judgmentsData.judgments || []);
    } catch (err) {
      console.error("Failed to load blockchain data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      intervalId = setInterval(loadData, 15000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const formatHash = (hash: string, len: number = 12) => {
    if (!hash) return "N/A";
    if (hash.length <= len) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getRoleName = (role: number) => {
    const roles: Record<number, string> = {
      1: "Public User",
      2: "Investigator",
      3: "Forensic Analyst",
      4: "Court",
      5: "Admin",
    };
    return roles[role] || `Role ${role}`;
  };

  const getRoleIcon = (role: number) => {
    const icons: Record<number, string> = {
      1: "👤",
      2: "👮",
      3: "🔬",
      4: "⚖️",
      5: "👑",
    };
    return icons[role] || "👤";
  };

  const getVerdictName = (verdict: number) => {
    const verdicts: Record<number, string> = {
      0: "Pending",
      1: "Guilty",
      2: "Not Guilty",
      3: "Acquitted",
      4: "Convicted",
    };
    return verdicts[verdict] || `Verdict ${verdict}`;
  };

  const handleVerifyEvidence = async () => {
    if (!verifyEvidenceId || !verifyHash) {
      setVerifyResult("❌ Please enter both Evidence ID and Hash");
      return;
    }

    try {
      const result = await apiRequest<{ verified: boolean }>(
        "/blockchain/verify/" + verifyEvidenceId,
        {
          method: "GET",
          token,
        },
      );
      setVerifyResult(
        result.verified
          ? "✅ Evidence verified on blockchain! Hash matches on-chain record."
          : "❌ Evidence not found on blockchain. Hash may be incorrect.",
      );
    } catch (err) {
      setVerifyResult("❌ Error verifying evidence");
    }
  };

  const fetchBlocks = async () => {
    setLoadingBlocks(true);
    try {
      // Get latest block number from blockchain
      const statusData = await apiRequest<BlockchainStatus>(
        "/blockchain/status",
        { token },
      );
      const latestBlock = statusData.latest_block || 0;

      // Fetch blocks from 1 to latest
      const blocksData: Block[] = [];
      for (let i = 1; i <= latestBlock; i++) {
        const response = await fetch(`http://127.0.0.1:7545`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBlockByNumber",
            params: [`0x${i.toString(16)}`, true],
            id: i,
          }),
        });
        const data = await response.json();
        if (data.result) {
          blocksData.push({
            number: i,
            hash: data.result.hash,
            parentHash: data.result.parentHash,
            timestamp: parseInt(data.result.timestamp, 16),
            transactions: data.result.transactions.map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: parseInt(tx.value, 16) / 1e18 + " ETH",
            })),
            gasUsed: parseInt(data.result.gasUsed, 16),
            gasLimit: parseInt(data.result.gasLimit, 16),
          });
        }
      }
      setBlocks(blocksData.reverse()); // Show latest first
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const getFIRStatusName = (status: number) => {
    const statuses: Record<number, string> = {
      0: "Draft",
      1: "Submitted",
      2: "Under Review",
      3: "Accepted",
      4: "Rejected",
      5: "Closed",
    };
    return statuses[status] || `Status ${status}`;
  };

  if (loading) {
    return (
      <div className="bc-container">
        <div className="bc-loading">
          <div className="bc-shimmer-card">
            <div className="bc-shimmer"></div>
          </div>
          <div className="bc-shimmer-card">
            <div className="bc-shimmer"></div>
          </div>
          <div className="bc-shimmer-card">
            <div className="bc-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bc-container">
      {/* Background Elements - Same as RegisterPage */}
      <div className="bc-bg" />
      <div className="bc-grid" />
      <div className="bc-aura bc-aura-1" />
      <div className="bc-aura bc-aura-2" />
      <div className="bc-aura bc-aura-3" />

      {/* Header */}
      <div className="bc-header">
        <div className="bc-header-icon">⛓️</div>
        <div className="bc-header-content">
          <h1>Blockchain Explorer</h1>
          <p>View all on-chain data: Users, FIRs, Evidence, and Judgments</p>
        </div>
        <div className="bc-auto-refresh">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <label htmlFor="autoRefresh">Auto-refresh (15s)</label>
        </div>
      </div>

      {/* Status Card */}
      <div className="bc-card">
        <div className="bc-card-header">
          <h2>📡 Blockchain Status</h2>
          <p>Real-time connection status to Complete Justice Blockchain</p>
        </div>
        {status?.connected ? (
          <div className="bc-status-connected">
            <div className="bc-status-icon">✅</div>
            <div className="bc-status-content">
              <strong>Connected to Ganache Blockchain</strong>
              <div className="bc-status-details">
                <span className="bc-status-badge">
                  Chain ID: {status.chain_id}
                </span>
                <span className="bc-status-badge">
                  Latest Block: {status.latest_block}
                </span>
                <span className="bc-status-badge">
                  Contract: {formatHash(status.contract_address || "", 16)}
                </span>
                <span className="bc-status-badge success">
                  {status.contract_deployed
                    ? "Contract Active ✅"
                    : "Contract Not Found"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bc-status-disconnected">
            <div className="bc-status-icon">❌</div>
            <div className="bc-status-content">
              <strong>{status?.message || "Blockchain not connected"}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Verification Tool */}
      <div className="bc-card bc-fade-up">
        <div className="bc-card-header">
          <h2>🔐 Public Evidence Verification</h2>
          <p>
            Verify evidence authenticity using its hash (checks on-chain
            records)
          </p>
        </div>
        <div className="bc-verify-form">
          <div className="bc-form-group">
            <label>Evidence ID</label>
            <div className="bc-input-wrapper">
              <span className="bc-input-icon">🔍</span>
              <input
                value={verifyEvidenceId}
                onChange={(e) => setVerifyEvidenceId(e.target.value)}
                placeholder="E.g., EVD-XXXXX"
              />
            </div>
          </div>
          <div className="bc-form-group">
            <label>Evidence Hash (SHA-256)</label>
            <div className="bc-input-wrapper">
              <span className="bc-input-icon">🔐</span>
              <input
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="64-character hex hash"
              />
            </div>
          </div>
          <button className="bc-verify-btn" onClick={handleVerifyEvidence}>
            <span>🔍</span> Verify Authenticity
          </button>
          {verifyResult && (
            <div
              className={`bc-verify-result ${verifyResult.includes("✅") ? "success" : "error"}`}
            >
              {verifyResult}
            </div>
          )}
        </div>
      </div>
      {/* System Stats Grid */}
      {summary && summary.system_stats && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>📊 System Statistics</h2>
            <p>On-chain data summary from Complete Justice Contract</p>
          </div>
          <div className="bc-stats-grid">
            <div className="bc-stat-card">
              <div className="bc-stat-icon">👥</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_users}
              </div>
              <div className="bc-stat-label">Total Users</div>
            </div>
            <div className="bc-stat-card">
              <div className="bc-stat-icon">📋</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_firs}
              </div>
              <div className="bc-stat-label">FIRs Filed</div>
            </div>
            <div className="bc-stat-card">
              <div className="bc-stat-icon">⚖️</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_cases}
              </div>
              <div className="bc-stat-label">Active Cases</div>
            </div>
            <div className="bc-stat-card">
              <div className="bc-stat-icon">📎</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_evidence}
              </div>
              <div className="bc-stat-label">Evidence Items</div>
            </div>
            <div className="bc-stat-card">
              <div className="bc-stat-icon">🔬</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_forensic_reports}
              </div>
              <div className="bc-stat-label">Forensic Reports</div>
            </div>
            <div className="bc-stat-card">
              <div className="bc-stat-icon">📜</div>
              <div className="bc-stat-value">
                {summary.system_stats.total_judgments}
              </div>
              <div className="bc-stat-label">Judgments</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bc-tabs-container">
        <div className="bc-tabs">
          <button
            className={`bc-tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <span className="bc-tab-icon">📊</span> Summary
          </button>
          <button
            className={`bc-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span className="bc-tab-icon">👥</span> Users
            {users.length > 0 && (
              <span className="bc-tab-badge">{users.length}</span>
            )}
          </button>
          <button
            className={`bc-tab ${activeTab === "firs" ? "active" : ""}`}
            onClick={() => setActiveTab("firs")}
          >
            <span className="bc-tab-icon">📋</span> FIRs
            {firs.length > 0 && (
              <span className="bc-tab-badge">{firs.length}</span>
            )}
          </button>
          <button
            className={`bc-tab ${activeTab === "evidence" ? "active" : ""}`}
            onClick={() => setActiveTab("evidence")}
          >
            <span className="bc-tab-icon">🔗</span> Evidence
            {evidence.length > 0 && (
              <span className="bc-tab-badge">{evidence.length}</span>
            )}
          </button>
          <button
            className={`bc-tab ${activeTab === "judgments" ? "active" : ""}`}
            onClick={() => setActiveTab("judgments")}
          >
            <span className="bc-tab-icon">⚖️</span> Judgments
            {judgments.length > 0 && (
              <span className="bc-tab-badge">{judgments.length}</span>
            )}
          </button>

          <button
            className={`bc-tab ${activeTab === "blocks" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("blocks");
              fetchBlocks();
            }}
          >
            <span className="bc-tab-icon">📦</span>
            <span>Blocks</span>
            {blocks.length > 0 && (
              <span className="bc-tab-badge">{blocks.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="bc-refresh-container">
        <button className="bc-refresh-btn" onClick={loadData}>
          ⟳ Refresh Now
        </button>
      </div>

      {/* Summary Tab */}
      {activeTab === "summary" && summary && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>📋 Blockchain Summary</h2>
            <p>Detailed information about the contract and network</p>
          </div>
          <div className="bc-summary-details">
            <div className="bc-summary-item">
              <span className="bc-summary-label">Contract Address:</span>
              <code className="bc-summary-value">
                {summary.contract_address}
              </code>
            </div>
            <div className="bc-summary-item">
              <span className="bc-summary-label">Chain ID:</span>
              <span className="bc-summary-value">{summary.chain_id}</span>
            </div>
            <div className="bc-summary-item">
              <span className="bc-summary-label">Latest Block:</span>
              <span className="bc-summary-value">{summary.latest_block}</span>
            </div>
            <div className="bc-summary-item">
              <span className="bc-summary-label">Recent Events:</span>
              <div className="bc-summary-stats">
                <span className="bc-mini-badge">
                  📎 Evidence: {summary.recent_counts.evidence_events}
                </span>
                <span className="bc-mini-badge">
                  ⚖️ Judgments: {summary.recent_counts.judgment_events}
                </span>
                <span className="bc-mini-badge">
                  👥 Users: {summary.recent_counts.user_events}
                </span>
                <span className="bc-mini-badge">
                  📋 FIRs: {summary.recent_counts.fir_events}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>👥 Registered Users</h2>
            <p>All users registered on the blockchain</p>
          </div>
          {users.length === 0 ? (
            <div className="bc-empty">
              <div className="bc-empty-icon">📭</div>
              <p>No users registered on blockchain yet.</p>
            </div>
          ) : (
            <div className="bc-list">
              {users.map((user, idx) => (
                <div
                  key={idx}
                  className="bc-list-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="bc-list-header">
                    <span className="bc-list-number">
                      Block #{user.block_number}
                    </span>
                    <span className="bc-list-badge">
                      {getRoleIcon(user.role)} {getRoleName(user.role)}
                    </span>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">User Address:</span>
                    <code className="bc-list-detail-value">{user.user}</code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Registered:</span>
                    <span className="bc-list-detail-value">
                      {new Date(user.datetime).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="bc-list-expand"
                    onClick={() =>
                      setActiveDetail(
                        activeDetail === user.tx_hash ? null : user.tx_hash,
                      )
                    }
                  >
                    {activeDetail === user.tx_hash
                      ? "Hide Details"
                      : "View Transaction Details"}
                  </button>
                  {activeDetail === user.tx_hash && (
                    <pre className="bc-list-json">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FIRs Tab */}
      {activeTab === "firs" && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>📋 FIRs Registered</h2>
            <p>All First Information Reports on the blockchain</p>
          </div>
          {firs.length === 0 ? (
            <div className="bc-empty">
              <div className="bc-empty-icon">📭</div>
              <p>No FIRs found on blockchain.</p>
            </div>
          ) : (
            <div className="bc-list">
              {firs.map((fir, idx) => (
                <div
                  key={idx}
                  className="bc-list-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="bc-list-header">
                    <span className="bc-list-number">
                      Block #{fir.block_number}
                    </span>
                    <span className="bc-list-badge">
                      {getFIRStatusName(fir.status)}
                    </span>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">FIR ID:</span>
                    <code className="bc-list-detail-value">{fir.fir_id}</code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Complainant:</span>
                    <code className="bc-list-detail-value">
                      {fir.complainant}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Filed:</span>
                    <span className="bc-list-detail-value">
                      {new Date(fir.datetime).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="bc-list-expand"
                    onClick={() =>
                      setActiveDetail(
                        activeDetail === fir.tx_hash ? null : fir.tx_hash,
                      )
                    }
                  >
                    {activeDetail === fir.tx_hash
                      ? "Hide Details"
                      : "View Transaction Details"}
                  </button>
                  {activeDetail === fir.tx_hash && (
                    <pre className="bc-list-json">
                      {JSON.stringify(fir, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === "evidence" && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>🔗 Evidence Anchored</h2>
            <p>All evidence hashes permanently stored on blockchain</p>
          </div>
          {evidence.length === 0 ? (
            <div className="bc-empty">
              <div className="bc-empty-icon">📭</div>
              <p>No evidence anchored on blockchain yet.</p>
            </div>
          ) : (
            <div className="bc-list">
              {evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="bc-list-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="bc-list-header">
                    <span className="bc-list-number">
                      Block #{item.block_number}
                    </span>
                    <span className="bc-list-badge">🔗 EVIDENCE</span>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Evidence Hash:</span>
                    <code className="bc-list-detail-value">
                      {item.object_hash}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Case ID:</span>
                    <code className="bc-list-detail-value">
                      {item.case_id || "N/A"}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Collected By:</span>
                    <code className="bc-list-detail-value">
                      {item.collected_by || "N/A"}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Anchored:</span>
                    <span className="bc-list-detail-value">
                      {new Date(item.datetime).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Judgments Tab */}
      {activeTab === "judgments" && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>⚖️ Judgments Delivered</h2>
            <p>All court judgments recorded on blockchain</p>
          </div>
          {judgments.length === 0 ? (
            <div className="bc-empty">
              <div className="bc-empty-icon">📭</div>
              <p>No judgments delivered on blockchain yet.</p>
            </div>
          ) : (
            <div className="bc-list">
              {judgments.map((judgment, idx) => (
                <div
                  key={idx}
                  className="bc-list-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="bc-list-header">
                    <span className="bc-list-number">
                      Block #{judgment.block_number}
                    </span>
                    <span className="bc-list-badge">
                      {getVerdictName(judgment.verdict)}
                    </span>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Case ID:</span>
                    <code className="bc-list-detail-value">
                      {judgment.case_id}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Judge:</span>
                    <code className="bc-list-detail-value">
                      {judgment.judge}
                    </code>
                  </div>
                  <div className="bc-list-detail-row">
                    <span className="bc-list-detail-label">Delivered:</span>
                    <span className="bc-list-detail-value">
                      {new Date(judgment.datetime).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "blocks" && (
        <div className="bc-card">
          <div className="bc-card-header">
            <h2>📦 Blockchain Blocks</h2>
            <p>All blocks from genesis to latest ({blocks.length} blocks)</p>
          </div>
          {loadingBlocks ? (
            <div className="bc-loading-blocks">
              <div className="bc-shimmer-card">
                <div className="bc-shimmer"></div>
              </div>
            </div>
          ) : blocks.length === 0 ? (
            <div className="bc-empty">
              <div className="bc-empty-icon">📭</div>
              <p>No blocks found. Submit a transaction to create blocks!</p>
            </div>
          ) : (
            <div className="bc-blocks-list">
              {blocks.map((block, idx) => (
                <div
                  key={block.number}
                  className="bc-block-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="bc-block-header">
                    <div className="bc-block-number">
                      <span className="bc-block-icon">📦</span>
                      Block #{block.number}
                    </div>
                    <div className="bc-block-transactions">
                      {block.transactions.length} transaction
                      {block.transactions.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="bc-block-details">
                    <div className="bc-block-row">
                      <span className="bc-block-label">Block Hash:</span>
                      <code className="bc-block-value">{block.hash}</code>
                    </div>
                    <div className="bc-block-row">
                      <span className="bc-block-label">Parent Hash:</span>
                      <code className="bc-block-value">
                        {block.parentHash.substring(0, 20)}...
                      </code>
                    </div>
                    <div className="bc-block-row">
                      <span className="bc-block-label">Timestamp:</span>
                      <span className="bc-block-value">
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="bc-block-row">
                      <span className="bc-block-label">Gas Used:</span>
                      <span className="bc-block-value">
                        {block.gasUsed.toLocaleString()} /{" "}
                        {block.gasLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {block.transactions.length > 0 && (
                    <details className="bc-block-transactions-details">
                      <summary>
                        📜 View {block.transactions.length} Transaction(s)
                      </summary>
                      <div className="bc-block-transactions-list">
                        {block.transactions.map((tx, txIdx) => (
                          <div key={txIdx} className="bc-transaction-item">
                            <div className="bc-tx-row">
                              <span className="bc-tx-label">Tx Hash:</span>
                              <code>{tx.hash}</code>
                            </div>
                            <div className="bc-tx-row">
                              <span className="bc-tx-label">From:</span>
                              <code>{tx.from}</code>
                            </div>
                            <div className="bc-tx-row">
                              <span className="bc-tx-label">To:</span>
                              <code>{tx.to || "Contract Creation"}</code>
                            </div>
                            <div className="bc-tx-row">
                              <span className="bc-tx-label">Value:</span>
                              <span>{tx.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        /* ============ SAME AS REGISTER PAGE ============ */
        .bc-container {
          --bg-deep: #06080f;
          --bg-base: #0b0e1a;
          --bg-card: rgba(12, 15, 26, 0.85);
          --border: rgba(99, 102, 241, 0.12);
          --indigo: #6366f1;
          --indigo-d: #4f46e5;
          --indigo-l: #818cf8;
          --indigo-light: #a5b4fc;
          --text: #e8ecf8;
          --text-secondary: #7a849c;
          --text-muted: #3d4459;
          
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: var(--bg-deep);
          color: var(--text);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding: 100px 3rem 3rem;
        }

        /* Background Elements */
        .bc-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .bc-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .bc-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .bc-aura-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          animation: bc-floatA 12s ease-in-out infinite;
        }

        .bc-aura-2 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: -5%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent);
          animation: bc-floatB 15s ease-in-out infinite reverse;
        }

        .bc-aura-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: -8%;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08), transparent);
          animation: bc-floatC 18s ease-in-out infinite;
        }

        @keyframes bc-floatA {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.8; }
        }
        @keyframes bc-floatB {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes bc-floatC {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(1.05); opacity: 0.6; }
        }

        /* Header */
        .bc-header {
          position: relative;
          z-index: 10;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          animation: bc-fadeIn 0.5s ease-out;
        }

        .bc-header-icon { font-size: 3rem; }
        .bc-header-content { flex: 1; }
        .bc-header-content h1 { font-size: 1.6rem; font-weight: 700; color: var(--text); margin: 0 0 6px 0; letter-spacing: -0.02em; }
        .bc-header-content p { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }

        .bc-auto-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .bc-auto-refresh input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--indigo); }

        /* Cards */
        .bc-card {
          position: relative;
          z-index: 10;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 28px;
          margin-bottom: 24px;
          animation: bc-fadeIn 0.5s ease-out;
        }

        @keyframes bc-fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bc-card-header { margin-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 16px; }
        .bc-card-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--text); margin-bottom: 6px; letter-spacing: -0.02em; }
        .bc-card-header p { font-size: 0.85rem; color: var(--text-secondary); }

        /* Status */
        .bc-status-connected, .bc-status-disconnected {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          flex-wrap: wrap;
        }
        .bc-status-connected { background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); }
        .bc-status-disconnected { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); }
        .bc-status-icon { font-size: 1.5rem; }
        .bc-status-content { flex: 1; }
        .bc-status-content strong { display: block; font-size: 0.85rem; color: var(--text); margin-bottom: 8px; }
        .bc-status-details { display: flex; gap: 16px; flex-wrap: wrap; }
        .bc-status-badge { font-size: 0.75rem; color: var(--indigo-l); background: rgba(99, 102, 241, 0.12); padding: 4px 12px; border-radius: 20px; }
        .bc-status-badge.success { background: rgba(34, 197, 94, 0.12); color: #22c55e; }

        /* Stats Grid */
        .bc-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .bc-stat-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 8px; padding: 20px; text-align: center; transition: all 0.3s; }
        .bc-stat-card:hover { border-color: rgba(99, 102, 241, 0.3); transform: translateY(-2px); background: rgba(99, 102, 241, 0.05); }
        .bc-stat-icon { font-size: 2rem; margin-bottom: 8px; }
        .bc-stat-value { font-size: 1.8rem; font-weight: 800; color: var(--text); margin-bottom: 4px; background: linear-gradient(135deg, #e8ecf8, var(--indigo-l)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .bc-stat-label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

        /* Tabs */
        .bc-tabs-container { position: relative; z-index: 10; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
        .bc-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .bc-tab { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: transparent; border: none; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.3s; position: relative; }
        .bc-tab::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--indigo); transform: scaleX(0); transition: transform 0.3s ease; }
        .bc-tab:hover { color: var(--text); }
        .bc-tab.active { color: var(--indigo-l); }
        .bc-tab.active::after { transform: scaleX(1); }
        .bc-tab-badge { background: rgba(99, 102, 241, 0.2); padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; margin-left: 6px; color: var(--indigo-l); }

        /* Refresh Button */
        .bc-refresh-container { position: relative; z-index: 10; text-align: right; margin-bottom: 16px; }
        .bc-refresh-btn { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 8px 20px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; color: var(--indigo-l); cursor: pointer; transition: all 0.3s; }
        .bc-refresh-btn:hover { background: rgba(99, 102, 241, 0.2); transform: translateY(-1px); }

        /* List Items (Same as RegisterPage card style) */
        .bc-list { display: flex; flex-direction: column; gap: 16px; max-height: 500px; overflow-y: auto; }
        .bc-list::-webkit-scrollbar { width: 4px; }
        .bc-list::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .bc-list::-webkit-scrollbar-thumb { background: var(--indigo); border-radius: 10px; }

        .bc-list-item { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 8px; padding: 20px; transition: all 0.3s; animation: bc-slideIn 0.3s ease-out backwards; }
        @keyframes bc-slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .bc-list-item:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }

        .bc-list-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .bc-list-number { font-weight: 700; font-size: 0.85rem; color: var(--indigo-l); background: rgba(99, 102, 241, 0.12); padding: 4px 12px; border-radius: 20px; }
        .bc-list-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; background: rgba(99, 102, 241, 0.12); color: var(--indigo-l); }

        .bc-list-detail-row { display: flex; margin-bottom: 10px; }
        .bc-list-detail-label { width: 130px; font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; }
        .bc-list-detail-value { flex: 1; font-size: 0.8rem; color: var(--text); word-break: break-word; font-family: monospace; }

        .bc-list-expand { background: transparent; border: none; color: var(--indigo-l); font-size: 0.7rem; cursor: pointer; margin-top: 8px; padding: 4px 0; transition: color 0.2s; }
        .bc-list-expand:hover { color: var(--indigo-light); text-decoration: underline; }

        .bc-list-json { font-size: 0.7rem; font-family: monospace; color: var(--text-secondary); background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; overflow-x: auto; margin-top: 12px; word-break: break-all; }

        /* Summary Details */
        .bc-summary-details { display: flex; flex-direction: column; gap: 12px; }
        .bc-summary-item { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .bc-summary-label { font-weight: 600; color: var(--text-secondary); min-width: 120px; }
        .bc-summary-value { color: var(--text); font-family: monospace; }
        .bc-summary-stats { display: flex; gap: 12px; flex-wrap: wrap; }
        .bc-mini-badge { background: rgba(99, 102, 241, 0.08); padding: 4px 12px; border-radius: 16px; font-size: 0.7rem; color: var(--indigo-l); }

        /* Empty State */
        .bc-empty { text-align: center; padding: 60px 20px; }
        .bc-empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
        .bc-empty p { color: var(--text-secondary); font-size: 0.85rem; }

        /* Loading */
        .bc-loading { padding: 24px; }
        .bc-shimmer-card { background: rgba(12, 15, 26, 0.5); border-radius: 12px; height: 150px; margin-bottom: 16px; overflow: hidden; position: relative; }
        .bc-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.08), transparent); animation: bc-shimmer 1.5s infinite; }
        @keyframes bc-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        /* Responsive */
        @media (max-width: 768px) {
          .bc-container { padding: 80px 1.5rem 2rem; }
          .bc-header { padding: 20px; flex-direction: column; text-align: center; }
          .bc-header-content h1 { font-size: 1.3rem; }
          .bc-tabs { gap: 4px; }
          .bc-tab { padding: 10px 16px; font-size: 0.75rem; }
          .bc-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .bc-list-detail-row { flex-direction: column; }
          .bc-list-detail-label { width: auto; margin-bottom: 4px; }
        }
        @media (max-width: 480px) {
          .bc-stats-grid { grid-template-columns: 1fr; }
          .bc-tab { padding: 8px 12px; font-size: 0.7rem; }
        }

        /* Blocks List */
.bc-blocks-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.bc-blocks-list::-webkit-scrollbar {
  width: 4px;
}

.bc-blocks-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.bc-blocks-list::-webkit-scrollbar-thumb {
  background: var(--indigo);
  border-radius: 10px;
}

.bc-block-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  animation: bc-slideIn 0.3s ease-out backwards;
}

.bc-block-item:hover {
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.05);
}

.bc-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.bc-block-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1rem;
  color: var(--indigo-l);
}

.bc-block-icon {
  font-size: 1.2rem;
}

.bc-block-transactions {
  font-size: 0.75rem;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 20px;
  color: var(--indigo-l);
}

.bc-block-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.bc-block-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.bc-block-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 100px;
}

.bc-block-value {
  font-size: 0.8rem;
  color: var(--text);
  font-family: monospace;
  word-break: break-all;
}

.bc-block-transactions-details {
  margin-top: 12px;
}

.bc-block-transactions-details summary {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--indigo-l);
  transition: color 0.2s;
  padding: 8px 0;
}

.bc-block-transactions-details summary:hover {
  color: var(--indigo-light);
}

.bc-block-transactions-list {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bc-transaction-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.bc-tx-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 0.7rem;
}

.bc-tx-label {
  width: 70px;
  color: var(--text-secondary);
}

.bc-transaction-item code {
  font-size: 0.65rem;
  color: var(--indigo-l);
  word-break: break-all;
}

.bc-loading-blocks {
  padding: 40px;
}

        /* ============================================ */
        /* RESPONSIVE DESIGN - ADDITIONAL FIXES */
        /* ============================================ */

        /* Tablet Landscape (1024px and below) */
        @media (max-width: 1024px) {
          .bc-container {
            padding: 80px 2rem 2rem;
          }
          
          .bc-header {
            padding: 24px;
          }
          
          .bc-header-icon {
            font-size: 2.5rem;
          }
          
          .bc-header-content h1 {
            font-size: 1.4rem;
          }
          
          .bc-header-content p {
            font-size: 0.8rem;
          }
          
          .bc-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
          
          .bc-stat-value {
            font-size: 1.5rem;
          }
        }

        /* Tablet Portrait (768px and below) */
        @media (max-width: 768px) {
          .bc-container {
            padding: 70px 1.5rem 1.5rem;
          }
          
          .bc-header {
            flex-direction: column;
            text-align: center;
            padding: 20px;
            gap: 12px;
          }
          
          .bc-header-content {
            text-align: center;
          }
          
          .bc-header-content h1 {
            font-size: 1.3rem;
          }
          
          .bc-auto-refresh {
            margin-top: 4px;
          }
          
          .bc-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .bc-stat-card {
            padding: 16px;
          }
          
          .bc-stat-icon {
            font-size: 1.6rem;
          }
          
          .bc-stat-value {
            font-size: 1.3rem;
          }
          
          .bc-card {
            padding: 20px;
          }
          
          .bc-card-header h2 {
            font-size: 1.2rem;
          }
          
          .bc-tabs {
            gap: 6px;
          }
          
          .bc-tab {
            padding: 10px 18px;
            font-size: 0.75rem;
          }
          
          .bc-tab-icon {
            font-size: 0.9rem;
          }
          
          /* List items responsive */
          .bc-list-detail-row {
            flex-direction: column;
            gap: 4px;
          }
          
          .bc-list-detail-label {
            width: auto;
            font-size: 0.7rem;
          }
          
          .bc-list-detail-value {
            font-size: 0.75rem;
          }
          
          /* Block items responsive */
          .bc-block-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .bc-block-number {
            font-size: 0.9rem;
          }
          
          .bc-block-row {
            flex-direction: column;
            gap: 4px;
          }
          
          .bc-block-label {
            min-width: auto;
          }
          
          /* Summary items responsive */
          .bc-summary-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          
          .bc-summary-stats {
            flex-wrap: wrap;
          }
        }

        /* Mobile (480px and below) */
        @media (max-width: 480px) {
          .bc-container {
            padding: 60px 1rem 1rem;
          }
          
          .bc-header {
            padding: 16px;
          }
          
          .bc-header-icon {
            font-size: 2rem;
          }
          
          .bc-header-content h1 {
            font-size: 1.1rem;
          }
          
          .bc-header-content p {
            font-size: 0.7rem;
          }
          
          .bc-auto-refresh {
            font-size: 0.7rem;
          }
          
          .bc-stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .bc-stat-card {
            padding: 14px;
          }
          
          .bc-stat-icon {
            font-size: 1.4rem;
          }
          
          .bc-stat-value {
            font-size: 1.2rem;
          }
          
          .bc-card {
            padding: 16px;
          }
          
          .bc-card-header {
            margin-bottom: 16px;
          }
          
          .bc-card-header h2 {
            font-size: 1rem;
          }
          
          .bc-card-header p {
            font-size: 0.7rem;
          }
          
          .bc-tabs {
            gap: 4px;
          }
          
          .bc-tab {
            padding: 8px 12px;
            font-size: 0.65rem;
          }
          
          .bc-tab-icon {
            font-size: 0.8rem;
          }
          
          .bc-tab-badge {
            font-size: 0.6rem;
            padding: 1px 6px;
          }
          
          .bc-refresh-btn {
            padding: 6px 16px;
            font-size: 0.7rem;
          }
          
          /* List items */
          .bc-list-item {
            padding: 16px;
          }
          
          .bc-list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .bc-list-number {
            font-size: 0.7rem;
          }
          
          .bc-list-badge {
            font-size: 0.6rem;
            padding: 2px 8px;
          }
          
          .bc-list-expand {
            font-size: 0.65rem;
          }
          
          .bc-list-json {
            font-size: 0.6rem;
            padding: 8px;
          }
          
          /* Block items */
          .bc-block-item {
            padding: 16px;
          }
          
          .bc-block-number {
            font-size: 0.85rem;
          }
          
          .bc-block-icon {
            font-size: 1rem;
          }
          
          .bc-block-transactions {
            font-size: 0.65rem;
            padding: 2px 8px;
          }
          
          .bc-block-label {
            font-size: 0.65rem;
          }
          
          .bc-block-value {
            font-size: 0.7rem;
          }
          
          /* Transactions */
          .bc-transaction-item {
            padding: 10px;
          }
          
          .bc-tx-row {
            font-size: 0.6rem;
          }
          
          .bc-tx-label {
            width: 60px;
          }
          
          /* Summary */
          .bc-summary-item {
            padding: 6px 0;
          }
          
          .bc-summary-label {
            font-size: 0.7rem;
            min-width: auto;
          }
          
          .bc-summary-value {
            font-size: 0.7rem;
            word-break: break-all;
          }
          
          .bc-mini-badge {
            font-size: 0.6rem;
            padding: 2px 8px;
          }
          
          /* Status card */
          .bc-status-connected, .bc-status-disconnected {
            padding: 12px;
          }
          
          .bc-status-icon {
            font-size: 1.2rem;
          }
          
          .bc-status-content strong {
            font-size: 0.75rem;
          }
          
          .bc-status-badge {
            font-size: 0.6rem;
            padding: 2px 8px;
          }
          
          .bc-status-details {
            gap: 8px;
          }
          
          /* Empty state */
          .bc-empty {
            padding: 40px 16px;
          }
          
          .bc-empty-icon {
            font-size: 2rem;
          }
          
          .bc-empty p {
            font-size: 0.7rem;
          }
        }

        /* Small Mobile (375px and below) */
        @media (max-width: 375px) {
          .bc-container {
            padding: 55px 0.75rem 0.75rem;
          }
          
          .bc-tab {
            padding: 6px 10px;
            font-size: 0.6rem;
          }
          
          .bc-tab-icon {
            font-size: 0.7rem;
          }
          
          .bc-stat-value {
            font-size: 1rem;
          }
          
          .bc-stat-label {
            font-size: 0.6rem;
          }
        }

        /* Touch-friendly targets for mobile */
        @media (hover: none) and (pointer: coarse) {
          .bc-tab,
          .bc-refresh-btn,
          .bc-list-expand,
          .bc-verify-btn,
          .bc-copy-btn {
            min-height: 44px;
          }
          
          .bc-tab {
            min-height: 44px;
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .bc-aura,
          .bc-header,
          .bc-card,
          .bc-list-item,
          .bc-block-item,
          .bc-shimmer,
          .bc-fade-up,
          .bc-status-connected,
          .bc-status-disconnected {
            animation: none !important;
            transition: none !important;
          }
          
          .bc-shimmer {
            display: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .bc-container {
            --bg-deep: #06080f;
            --bg-base: #0b0e1a;
          }
        }
          /* Verification Form */
.bc-verify-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bc-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bc-form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.bc-input-wrapper {
  position: relative;
}

.bc-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  pointer-events: none;
  color: #3d4459;
}

.bc-input-wrapper input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s;
}

.bc-input-wrapper input:focus {
  outline: none;
  border-color: var(--indigo);
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.bc-verify-btn {
  background: linear-gradient(135deg, var(--indigo), var(--indigo-d));
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.bc-verify-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.bc-verify-result {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.bc-verify-result.success {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.bc-verify-result.error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}
      `}</style>
    </div>
  );
}
