// frontend/src/features/blockchain/BlockchainViewer.tsx
import { useEffect, useState } from 'react';
import { apiRequest } from '../../shared/services/apiClient';

type BlockchainStatus = {
  connected: boolean;
  chain_id?: number;
  latest_block?: number;
  contract_address?: string;
  message?: string;
};

type Transaction = {
  block: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: number;
  gas: number;
  gas_price: number;
  datetime: string;
};

type Anchor = {
  tx_hash: string;
  block_number: number;
  object_hash: string;
  object_type: string;
  cid: string;
  recorder: string;
  datetime: string;
};

export function BlockchainViewer({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<'status' | 'transactions' | 'anchors'>('status');
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    try {
      const [statusData, txData, anchorData] = await Promise.all([
        apiRequest<BlockchainStatus>('/blockchain/status', { token }),
        apiRequest<{ transactions: Transaction[] }>('/blockchain/all-transactions', { token }),
        apiRequest<{ anchors: Anchor[] }>('/blockchain/anchors', { token })
      ]);
      
      setStatus(statusData);
      setTransactions(txData.transactions || []);
      setAnchors(anchorData.anchors || []);
    } catch (err) {
      console.error('Failed to load blockchain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      intervalId = setInterval(loadData, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const formatHash = (hash: string, len: number = 12) => {
    if (!hash) return 'N/A';
    if (hash.length <= len) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return <div className="card">🔗 Loading blockchain data...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ background: '#1e293b', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>⛓️</div>
          <div>
            <h2 style={{ color: 'white', margin: 0 }}>Blockchain Explorer</h2>
            <p style={{ opacity: 0.8, margin: '8px 0 0 0' }}>
              View all on-chain transactions and anchored evidence hashes
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📡 Blockchain Status</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
        </div>
        
        {status?.connected ? (
          <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#065f46' }}>✅ Connected to Ganache Blockchain</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span>Chain ID: {status.chain_id}</span>
              <span>Latest Block: {status.latest_block}</span>
              <span>Contract: {formatHash(status.contract_address || '', 16)}</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#991b1b' }}>❌ {status?.message || 'Blockchain not connected'}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('status')}
          style={{
            background: activeTab === 'status' ? '#3b82f6' : 'transparent',
            color: activeTab === 'status' ? 'white' : '#64748b',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          📊 Statistics
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            background: activeTab === 'transactions' ? '#3b82f6' : 'transparent',
            color: activeTab === 'transactions' ? 'white' : '#64748b',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          📜 Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('anchors')}
          style={{
            background: activeTab === 'anchors' ? '#3b82f6' : 'transparent',
            color: activeTab === 'anchors' ? 'white' : '#64748b',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔗 Anchored Hashes ({anchors.length})
        </button>
      </div>

      {/* Refresh Button */}
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <button onClick={loadData} style={{ background: '#10b981', cursor: 'pointer' }}>
          🔄 Refresh Now
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'status' && (
        <div className="card">
          <h3>📊 Blockchain Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{status?.chain_id || 'N/A'}</div>
              <div>Chain ID</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{status?.latest_block || 0}</div>
              <div>Latest Block</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{anchors.length}</div>
              <div>Total Anchors</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{transactions.length}</div>
              <div>Transactions</div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4>🏛️ Contract Address</h4>
            <code style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', display: 'block', wordBreak: 'break-all' }}>
              {status?.contract_address}
            </code>
            <button 
              onClick={() => copyToClipboard(status?.contract_address || '')}
              style={{ marginTop: '8px', background: '#e2e8f0', color: '#1f2937', padding: '4px 12px', cursor: 'pointer' }}
            >
              📋 Copy Address
            </button>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          <h3>📜 Blockchain Transactions</h3>
          {transactions.length === 0 ? (
            <p>No transactions found. Upload evidence to create blockchain records!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Block</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Tx Hash</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>From</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Value</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((tx, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>{tx.block}</td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ fontSize: '11px' }}>{formatHash(tx.tx_hash, 16)}</code>
                        <button onClick={() => copyToClipboard(tx.tx_hash)} style={{ marginLeft: '8px', fontSize: '10px', cursor: 'pointer' }}>📋</button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ fontSize: '11px' }}>{formatHash(tx.from_address, 12)}</code>
                      </td>
                      <td style={{ padding: '12px' }}>{tx.value} ETH</td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>{new Date(tx.datetime).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Anchors Tab */}
      {activeTab === 'anchors' && (
        <div className="card">
          <h3>🔗 Anchored Hashes</h3>
          {anchors.length === 0 ? (
            <p>No anchors found. Upload evidence to create blockchain anchors!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Block</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>CID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Hash</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {anchors.map((anchor, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>{anchor.block_number}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#dbeafe', padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
                          {anchor.object_type || 'EVIDENCE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ fontSize: '10px' }}>{formatHash(anchor.cid, 12)}</code>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ fontSize: '10px' }}>{formatHash(anchor.object_hash, 12)}</code>
                      </td>
                      <td style={{ padding: '12px', fontSize: '11px' }}>{new Date(anchor.datetime).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}