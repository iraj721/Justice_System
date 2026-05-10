// frontend/src/pages/roles/PublicUser/components/Documents.tsx
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";
import { API_BASE_URL } from "../../../../shared/env";

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
  const [activeTab, setActiveTab] = useState<"upload" | "list">("upload");
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCaseForDoc, setSelectedCaseForDoc] = useState("");
  const [userCases, setUserCases] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadDocuments();
    loadDocTypes();
    loadUserCases();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadDocuments() {
    try {
      const data = await apiRequest<Document[]>("/documents/my-documents", {
        token,
      });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  async function loadDocTypes() {
    try {
      const data = await apiRequest<{ types: string[] }>("/documents/types", {
        token,
      });
      setDocTypes(data.types);
    } catch (err) {
      setDocTypes([
        "CNIC",
        "PASSPORT",
        "ADDRESS_PROOF",
        "INCOME_PROOF",
        "OTHER",
      ]);
    }
  }
  async function loadUserCases() {
    try {
      const firs = await apiRequest<any[]>("/user/my-firs", { token });
      const casesList = firs
        .filter((f) => f.case_id)
        .map((f) => ({
          case_id: f.case_id,
          case_number: f.case_number,
          title: f.incident_title,
        }));
      setUserCases(casesList);
    } catch (err) {
      console.error(err);
    }
  }

  async function submitDocumentAsEvidence(docId: string, caseId: string) {
    if (!caseId) {
      showToast("Please select a case first", "error");
      return;
    }

    setMessage("Submitting document to case...");
    try {
      const result = await apiRequest<any>(
        `/documents/submit-to-case/${docId}?case_id=${caseId}`,
        {
          method: "POST",
          token,
        },
      );

      // Success popup - ACHA SA MSG!
      showToast(
        `✅ ${result.message || "Document submitted successfully to case!"}`,
        "success",
      );

      setMessage(`✅ ${result.message}`);
      setTimeout(() => setMessage(""), 3000);
      setSelectedCaseForDoc("");
      loadDocuments();
    } catch (err) {
      console.error("Submit error:", err);
      showToast("Failed to submit document. Please try again.", "error");
      setMessage("❌ Failed to submit document");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleUpload() {
    if (!title || !selectedFile) {
      setMessage("❌ Please fill title and select file");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      // IMPORTANT: Send empty string instead of null/undefined
      formData.append("description", description || ""); // FIX: Always send description
      formData.append("doc_type", docType);
      formData.append("file", selectedFile);

      console.log("Uploading:", {
        title,
        description: description || "",
        docType,
        fileName: selectedFile.name,
      });

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setMessage(`✅ Document uploaded successfully!`);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
      setActiveTab("list");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await apiRequest(`/documents/${docId}`, { method: "DELETE", token });
      loadDocuments();
    } catch (err) {
      setMessage("❌ Failed to delete document");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getDocTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      CNIC: "🆔",
      PASSPORT: "📘",
      ADDRESS_PROOF: "🏠",
      INCOME_PROOF: "💰",
      OTHER: "📄",
    };
    return icons[type] || "📄";
  }

  function getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CNIC: "CNIC / NICOP",
      PASSPORT: "Passport",
      ADDRESS_PROOF: "Address Proof",
      INCOME_PROOF: "Income Proof",
      OTHER: "Other Document",
    };
    return labels[type] || type.replace(/_/g, " ");
  }

  const getDocTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      CNIC: "#6366f1",
      PASSPORT: "#818cf8",
      ADDRESS_PROOF: "#22c55e",
      INCOME_PROOF: "#f97316",
      OTHER: "#64748b",
    };
    return colors[type] || "#64748b";
  };

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-shimmer-card">
          <div className="doc-shimmer"></div>
        </div>
        <div className="doc-shimmer-card">
          <div className="doc-shimmer"></div>
        </div>
        <div className="doc-shimmer-card">
          <div className="doc-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-dashboard">
      {/* Tabs - Horizontal One Line */}
      {toast && (
        <div className={`doc-toast doc-toast-${toast.type}`}>
          <div className="doc-toast-inner">
            <span className="doc-toast-icon">
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="doc-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="doc-tabs-container">
        <div className="doc-tabs">
          <button
            className={`doc-tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <span className="doc-tab-icon">📤</span>
            <span>Upload Document</span>
          </button>
          <button
            className={`doc-tab ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <span className="doc-tab-icon">📁</span>
            <span>My Documents</span>
            {documents.length > 0 && (
              <span className="doc-tab-badge">{documents.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="doc-form-container doc-fade-up">
          <div className="doc-form-header">
            <h2>Upload Document</h2>
            <p>
              Upload important documents securely to IPFS blockchain storage
            </p>
          </div>

          {message && (
            <div
              className={`doc-message ${message.includes("✅") ? "doc-message-success" : "doc-message-error"}`}
            >
              <span>{message}</span>
            </div>
          )}

          <div className="doc-form">
            <div className="doc-form-group">
              <label>Document Type</label>
              <div className="doc-custom-dropdown" ref={dropdownRef}>
                <button
                  className="doc-dropdown-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  type="button"
                >
                  <span className="doc-dropdown-icon">
                    {getDocTypeIcon(docType)}
                  </span>
                  <span className="doc-dropdown-text">
                    {getDocTypeLabel(docType)}
                  </span>
                  <span
                    className={`doc-dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
                  >
                    ▼
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="doc-dropdown-menu">
                    {docTypes.map((type) => (
                      <button
                        key={type}
                        className={`doc-dropdown-item ${docType === type ? "selected" : ""}`}
                        onClick={() => {
                          setDocType(type);
                          setIsDropdownOpen(false);
                        }}
                        type="button"
                      >
                        <span className="doc-dropdown-item-icon">
                          {getDocTypeIcon(type)}
                        </span>
                        <div className="doc-dropdown-item-content">
                          <span className="doc-dropdown-item-label">
                            {getDocTypeLabel(type)}
                          </span>
                          <span className="doc-dropdown-item-value">
                            {type}
                          </span>
                        </div>
                        {docType === type && (
                          <span className="doc-dropdown-check">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="doc-form-group">
              <label>
                Document Title <span className="doc-required">*</span>
              </label>
              <div className="doc-input-wrapper">
                <span className="doc-input-icon">📝</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CNIC Front Copy, Passport Bio Page"
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label>Description (Optional)</label>
              <div className="doc-textarea-wrapper">
                <span className="doc-textarea-icon">📄</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Any notes about this document..."
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label>
                Select File <span className="doc-required">*</span>
              </label>
              <div
                className={`doc-dropzone ${selectedFile ? "has-file" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div className="doc-dropzone-icon">
                  {selectedFile ? "📄" : "☁️"}
                </div>
                <div className="doc-dropzone-text">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select or drag and drop"}
                </div>
                <div className="doc-dropzone-hint">
                  PDF, JPG, PNG, DOC (Max 10MB)
                </div>
              </div>
            </div>

            <button
              className="doc-submit-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="doc-spinner"></span>
                  Uploading to IPFS...
                </>
              ) : (
                <>
                  <span>📤 Upload to Blockchain</span>
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="doc-security">
            <div className="doc-security-icon">🔒</div>
            <div className="doc-security-content">
              <strong>Blockchain Secured</strong>
              <p>
                All documents are encrypted and stored on IPFS with blockchain
                verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List Tab */}
      {activeTab === "list" && (
        <div className="doc-list-container doc-fade-up">
          <div className="doc-list-header">
            <h2>My Documents</h2>
            <p>All your blockchain-secured documents</p>
          </div>

          {documents.length === 0 ? (
            <div className="doc-empty">
              <div className="doc-empty-icon">📭</div>
              <h3>No Documents Yet</h3>
              <p>Upload your first document to get started</p>
              <button
                className="doc-empty-btn"
                onClick={() => setActiveTab("upload")}
              >
                + Upload Document
              </button>
            </div>
          ) : (
            <div className="doc-card-list">
              {documents.map((doc, idx) => (
                <div
                  key={doc.doc_id}
                  className={`doc-card ${hoveredDoc === doc.doc_id ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredDoc(doc.doc_id)}
                  onMouseLeave={() => setHoveredDoc(null)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="doc-card-header">
                    <div className="doc-card-info">
                      <div className="doc-card-icon">
                        {getDocTypeIcon(doc.doc_type)}
                      </div>
                      <div>
                        <h4 className="doc-card-title">{doc.title}</h4>
                        <div className="doc-card-meta">
                          <span
                            className="doc-type-badge"
                            style={{
                              background: `${getDocTypeColor(doc.doc_type)}10`,
                              color: getDocTypeColor(doc.doc_type),
                            }}
                          >
                            {getDocTypeLabel(doc.doc_type)}
                          </span>
                          <span className="doc-size">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="doc-date">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="doc-delete-btn"
                      onClick={() => handleDelete(doc.doc_id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {doc.description && (
                    <p className="doc-card-description">{doc.description}</p>
                  )}

                  <details className="doc-details">
                    <summary className="doc-details-summary">
                      <span>🔗 IPFS Details</span>
                    </summary>
                    <div className="doc-details-content">
                      <div className="doc-detail-row">
                        <span className="doc-detail-label">Filename:</span>
                        <span className="doc-detail-value">{doc.filename}</span>
                      </div>
                      <div className="doc-detail-row">
                        <span className="doc-detail-label">CID:</span>
                        <code className="doc-cid">{doc.ipfs_cid}</code>
                      </div>
                    </div>
                  </details>
                  <div className="doc-submit-section">
                    <select
                      value={selectedCaseForDoc}
                      onChange={(e) => setSelectedCaseForDoc(e.target.value)}
                      className="doc-case-select"
                    >
                      <option value="">-- Submit to Case --</option>
                      {userCases.map((c) => (
                        <option key={c.case_id} value={c.case_id}>
                          {c.case_number} - {c.title}
                        </option>
                      ))}
                    </select>
                    <button
                      className="doc-submit-btn-small"
                      onClick={() => {
                        if (selectedCaseForDoc) {
                          submitDocumentAsEvidence(
                            doc.doc_id,
                            selectedCaseForDoc,
                          );
                        }
                      }}
                      disabled={!selectedCaseForDoc}
                    >
                      📤 Submit as Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        /* Indigo Theme Styles */
        .doc-dashboard {
          padding: 24px;
          animation: doc-fadeIn 0.4s ease-out;
        }

        @keyframes doc-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes doc-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .doc-fade-up {
          animation: doc-slideUp 0.5s ease-out backwards;
        }

        /* Shimmer Loading */
        .doc-loading {
          padding: 24px;
        }

        .doc-shimmer-card {
          background: rgba(12, 15, 26, 0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .doc-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: doc-shimmer 1.5s infinite;
        }

        @keyframes doc-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Tabs Container - Horizontal One Line */
        .doc-tabs-container {
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 28px;
        }

        .doc-tabs {
          display: flex;
          gap: 8px;
        }

        .doc-tab {
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

        .doc-tab::after {
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

        .doc-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .doc-tab.active {
          color: #818cf8;
        }

        .doc-tab.active::after {
          transform: scaleX(1);
        }

        .doc-tab-icon {
          font-size: 1.1rem;
        }

        .doc-tab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 8px;
          color: #818cf8;
        }

        /* Form Container */
        .doc-form-container {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 32px;
        }

        .doc-form-header {
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .doc-form-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .doc-form-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Form */
        .doc-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .doc-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doc-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #7a849c;
        }

        .doc-required {
          color: #ef4444;
          margin-left: 2px;
        }

        /* Custom Dropdown */
        .doc-custom-dropdown {
          position: relative;
          width: 100%;
        }

        .doc-dropdown-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }

        .doc-dropdown-btn:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        .doc-dropdown-icon {
          font-size: 1.2rem;
        }

        .doc-dropdown-text {
          flex: 1;
        }

        .doc-dropdown-arrow {
          font-size: 0.7rem;
          color: #3d4459;
          transition: transform 0.3s;
        }

        .doc-dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .doc-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #0c0f1a;
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          animation: doc-dropdownFade 0.2s ease-out;
        }

        @keyframes doc-dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .doc-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .doc-dropdown-item:hover {
          background: rgba(99, 102, 241, 0.1);
          color: #e8ecf8;
        }

        .doc-dropdown-item.selected {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }

        .doc-dropdown-item-icon {
          font-size: 1.1rem;
        }

        .doc-dropdown-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .doc-dropdown-item-label {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .doc-dropdown-item-value {
          font-size: 0.65rem;
          color: #3d4459;
        }

        .doc-dropdown-item.selected .doc-dropdown-item-value {
          color: #818cf8;
        }

        .doc-dropdown-check {
          color: #22c55e;
          font-size: 0.9rem;
        }

        /* Input Wrappers */
        .doc-input-wrapper {
          position: relative;
        }

        .doc-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        .doc-input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .doc-input-wrapper input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .doc-textarea-wrapper {
          position: relative;
        }

        .doc-textarea-icon {
          position: absolute;
          left: 14px;
          top: 16px;
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        .doc-textarea-wrapper textarea {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          resize: vertical;
          transition: all 0.3s;
        }

        .doc-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .doc-input-wrapper input::placeholder,
        .doc-textarea-wrapper textarea::placeholder {
          color: #3d4459;
        }

        /* Dropzone */
        .doc-dropzone {
          border: 2px dashed rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: rgba(7, 9, 14, 0.3);
        }

        .doc-dropzone:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        .doc-dropzone.has-file {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .doc-dropzone-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .doc-dropzone-text {
          font-size: 0.9rem;
          color: #7a849c;
          margin-bottom: 8px;
        }

        .doc-dropzone-hint {
          font-size: 0.7rem;
          color: #3d4459;
        }

        /* Submit Button */
        .doc-submit-btn {
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

        .doc-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .doc-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .doc-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: doc-spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes doc-spin {
          to { transform: rotate(360deg); }
        }

        /* Security Notice */
        .doc-security {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px 20px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
        }

        .doc-security-icon {
          font-size: 1.8rem;
        }

        .doc-security-content strong {
          display: block;
          font-size: 0.85rem;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .doc-security-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* List Container */
        .doc-list-container {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 32px;
        }

        .doc-list-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .doc-list-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .doc-list-header p {
          color: #7a849c;
          font-size: 0.85rem;
        }

        /* Card List */
        .doc-card-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .doc-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: doc-slideIn 0.3s ease-out backwards;
        }

        @keyframes doc-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .doc-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .doc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .doc-card-info {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .doc-card-icon {
          font-size: 2rem;
        }

        .doc-card-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: #e8ecf8;
        }

        .doc-card-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .doc-type-badge {
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .doc-size, .doc-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .doc-delete-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .doc-delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        .doc-card-description {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 10px 0;
          padding-left: 56px;
        }

        /* Details */
        .doc-details {
          margin-top: 12px;
          padding-left: 56px;
        }

        .doc-details-summary {
          cursor: pointer;
          font-size: 0.75rem;
          color: #818cf8;
          transition: color 0.2s;
          list-style: none;
        }

        .doc-details-summary::-webkit-details-marker {
          display: none;
        }

        .doc-details-summary:hover {
          color: #a5b4fc;
        }

        .doc-details-content {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .doc-detail-row {
          margin-bottom: 8px;
        }

        .doc-detail-label {
          font-size: 0.7rem;
          color: #3d4459;
          display: inline-block;
          width: 70px;
        }

        .doc-detail-value {
          font-size: 0.7rem;
          color: #7a849c;
        }

        .doc-cid {
          font-size: 0.7rem;
          font-family: monospace;
          color: #818cf8;
          word-break: break-all;
        }

        /* Message */
        .doc-message {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          animation: doc-messageIn 0.3s ease-out;
        }

        @keyframes doc-messageIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .doc-message-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .doc-message-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Empty State */
        .doc-empty {
          text-align: center;
          padding: 60px 20px;
        }

        .doc-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .doc-empty h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .doc-empty p {
          color: #7a849c;
          margin-bottom: 20px;
        }

        .doc-empty-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s;
        }

        .doc-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .doc-dashboard {
            padding: 16px;
          }

          .doc-tabs {
            gap: 4px;
          }

          .doc-tab {
            padding: 12px 20px;
            font-size: 0.85rem;
          }

          .doc-tab-icon {
            font-size: 0.9rem;
          }

          .doc-form-container, .doc-list-container {
            padding: 20px;
          }

          .doc-card-header {
            flex-direction: column;
          }

          .doc-card-description, .doc-details {
            padding-left: 0;
          }

          .doc-security {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .doc-tab {
            padding: 10px 16px;
            font-size: 0.75rem;
          }
          
          .doc-tab-icon {
            font-size: 0.85rem;
          }
        }

        /* Submit Document to Case */
.doc-submit-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.doc-case-select {
  flex: 1;
  padding: 8px 12px;
  background: rgba(7, 9, 14, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  color: #e8ecf8;
  font-size: 0.8rem;
  cursor: pointer;
}

.doc-case-select:focus {
  outline: none;
  border-color: #6366f1;
}

.doc-submit-btn-small {
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.doc-submit-btn-small:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.doc-submit-btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
  /* ============ TOAST POPUP STYLES ============ */
.doc-toast {
  position: fixed;
  top: 90px;
  right: 20px;
  z-index: 1000;
  background: rgba(12, 15, 26, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 14px 20px;
  min-width: 280px;
  max-width: 350px;
  animation: doc-toast-slide 0.3s ease-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

@keyframes doc-toast-slide {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.doc-toast-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-toast-icon {
  font-size: 1.2rem;
}

.doc-toast-message {
  font-size: 0.85rem;
  color: #e8ecf8;
  line-height: 1.4;
  flex: 1;
}

.doc-toast-success {
  border-left: 3px solid #10b981;
}

.doc-toast-success .doc-toast-icon {
  color: #10b981;
}

.doc-toast-error {
  border-left: 3px solid #ef4444;
}

.doc-toast-error .doc-toast-icon {
  color: #ef4444;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .doc-toast {
    top: auto;
    bottom: 80px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
      `}</style>
    </div>
  );
}
