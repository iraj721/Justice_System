// frontend/src/features/dashboard/Documents.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../shared/services/apiClient";
import { API_BASE_URL } from "../../shared/env";
import { uploadFileToIPFS } from "../../shared/services/ipfs";

type Document = {
  doc_id: string;
  title: string;
  description: string;
  doc_type: string;
  filename: string;
  file_size: number;
  ipfs_cid: string;
  uploaded_at: string;
};

export function Documents({ token }: { token: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("CNIC");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
    loadDocTypes();
  }, []);

  async function loadDocuments() {
    try {
      const data = await apiRequest<Document[]>("/documents/my-documents", { token });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocTypes() {
    try {
      const data = await apiRequest<{ types: string[] }>("/documents/types", { token });
      setDocTypes(data.types);
    } catch (err) {
      setDocTypes(["CNIC", "PASSPORT", "ADDRESS_PROOF", "INCOME_PROOF", "OTHER"]);
    }
  }

  async function handleUpload() {
    if (!title || !selectedFile) {
      setMessage("❌ Please fill title and select file");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("doc_type", docType);
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setMessage(`✅ Document uploaded! CID: ${result.ipfs_cid.substring(0, 20)}...`);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Delete this document?")) return;
    
    try {
      await apiRequest(`/documents/${docId}`, { method: "DELETE", token });
      loadDocuments();
    } catch (err) {
      setMessage("❌ Failed to delete");
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  if (loading) {
    return <div className="card">Loading documents...</div>;
  }

  return (
    <div>
      {/* Upload Section */}
      <div className="card">
        <h3>📎 Upload Document</h3>
        {message && (
          <div style={{ padding: "12px", background: message.includes("✅") ? "#d1fae5" : "#fee2e2", borderRadius: "8px", marginBottom: "16px" }}>
            {message}
          </div>
        )}
        
        <div className="form-grid">
          <label>Document Type</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {docTypes.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
            ))}
          </select>
          
          <label>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., CNIC Front Copy" />
          
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Any notes about this document..." />
          
          <label>Select File *</label>
          <div style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "20px", textAlign: "center", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
            <div style={{ fontSize: "32px" }}>📄</div>
            <p>{selectedFile ? selectedFile.name : "Click to select file (Max 10MB)"}</p>
          </div>
          
          <button onClick={handleUpload} disabled={uploading} style={{ background: "#10b981", cursor: "pointer" }}>
            {uploading ? "Uploading..." : "📤 Upload Document"}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <h3>📁 My Documents ({documents.length})</h3>
        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {documents.map((doc) => (
              <div key={doc.doc_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" }}>
                  <div>
                    <strong>{doc.title}</strong>
                    <span style={{ marginLeft: "8px", background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{doc.doc_type.replace(/_/g, " ")}</span>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{doc.description}</div>
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
                      {doc.filename} • {formatFileSize(doc.file_size)} • Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                    <details style={{ marginTop: "8px" }}>
                      <summary style={{ cursor: "pointer", fontSize: "11px", color: "#3b82f6" }}>IPFS Details</summary>
                      <code style={{ fontSize: "10px", wordBreak: "break-all" }}>CID: {doc.ipfs_cid}</code>
                    </details>
                  </div>
                  <button onClick={() => handleDelete(doc.doc_id)} style={{ background: "#ef4444", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}