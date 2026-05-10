// frontend/src/pages/roles/Forensic/components/ForensicTemplates.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Template = {
  template_id: string;
  name: string;
  description: string;
  analysis_type: string;
  sections: Array<{ title: string; fields: string[] }>;
  is_public: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
};

export function ForensicTemplates({ token }: { token: string }) {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Record<string, any>>({});
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    analysis_type: "DIGITAL_FORENSICS",
    sections: [{ title: "", fields: [""] }]
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const [predefined, custom] = await Promise.all([
        apiRequest<Record<string, any>>("/forensic/templates/predefined", { token }).catch(() => ({})),
        apiRequest<Template[]>("/forensic/templates/my-templates", { token }).catch(() => [])
      ]);
      setPredefinedTemplates(predefined);
      setMyTemplates(custom);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createTemplate() {
    if (!newTemplate.name) {
      setMessage("❌ Please enter template name");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await apiRequest("/forensic/templates/create", {
        method: "POST",
        token,
        body: newTemplate
      });
      setMessage("✅ Template created successfully!");
      setShowCreateForm(false);
      setNewTemplate({
        name: "",
        description: "",
        analysis_type: "DIGITAL_FORENSICS",
        sections: [{ title: "", fields: [""] }]
      });
      loadTemplates();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to create template");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function addSection() {
    setNewTemplate({
      ...newTemplate,
      sections: [...newTemplate.sections, { title: "", fields: [""] }]
    });
  }

  function removeSection(index: number) {
    const sections = [...newTemplate.sections];
    sections.splice(index, 1);
    setNewTemplate({ ...newTemplate, sections });
  }

  function updateSectionTitle(index: number, title: string) {
    const sections = [...newTemplate.sections];
    sections[index].title = title;
    setNewTemplate({ ...newTemplate, sections });
  }

  function addField(sectionIndex: number) {
    const sections = [...newTemplate.sections];
    sections[sectionIndex].fields.push("");
    setNewTemplate({ ...newTemplate, sections });
  }

  function updateField(sectionIndex: number, fieldIndex: number, value: string) {
    const sections = [...newTemplate.sections];
    sections[sectionIndex].fields[fieldIndex] = value;
    setNewTemplate({ ...newTemplate, sections });
  }

  function getAnalysisTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      "DIGITAL_FORENSICS": "💻",
      "DNA_ANALYSIS": "🧬",
      "FINGERPRINT": "👆",
      "BALLISTICS": "🔫",
      "TOXICOLOGY": "⚗️"
    };
    return icons[type] || "🔬";
  }

  function getAnalysisTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      "DIGITAL_FORENSICS": "Digital Forensics",
      "DNA_ANALYSIS": "DNA Analysis",
      "FINGERPRINT": "Fingerprint Analysis",
      "BALLISTICS": "Ballistics",
      "TOXICOLOGY": "Toxicology"
    };
    return labels[type] || type.replace(/_/g, " ");
  }

  if (loading) {
    return (
      <div className="ft-loading">
        <div className="ft-spinner"></div>
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="ft-dashboard">
      {/* Create Template Button */}
      <div className="ft-action-bar">
        <button className={`ft-btn ft-btn-success ${showCreateForm ? "active" : ""}`} onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "❌ Cancel" : "➕ Create Custom Template"}
        </button>
      </div>

      {/* Create Template Form Modal */}
      {showCreateForm && (
        <div className="ft-modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="ft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3>📝 Create Custom Template</h3>
              <button className="ft-modal-close" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <div className="ft-modal-body">
              {message && (
                <div className={`ft-message ${message.includes("✅") ? "ft-message-success" : "ft-message-error"}`}>
                  {message}
                </div>
              )}
              <div className="ft-form">
                <div className="ft-form-group">
                  <label>Template Name <span className="ft-required">*</span></label>
                  <div className="ft-input-wrapper">
                    <span className="ft-input-icon">📝</span>
                    <input 
                      value={newTemplate.name} 
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} 
                      placeholder="e.g., Mobile Device Forensics"
                    />
                  </div>
                </div>

                <div className="ft-form-group">
                  <label>Description</label>
                  <div className="ft-textarea-wrapper">
                    <span className="ft-textarea-icon">📄</span>
                    <textarea 
                      value={newTemplate.description} 
                      onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} 
                      rows={2} 
                      placeholder="Template description..."
                    />
                  </div>
                </div>

                <div className="ft-form-group">
                  <label>Analysis Type</label>
                  <div className="ft-select-wrapper">
                    <select 
                      value={newTemplate.analysis_type} 
                      onChange={(e) => setNewTemplate({...newTemplate, analysis_type: e.target.value})}
                    >
                      <option value="DIGITAL_FORENSICS">💻 Digital Forensics</option>
                      <option value="DNA_ANALYSIS">🧬 DNA Analysis</option>
                      <option value="FINGERPRINT">👆 Fingerprint</option>
                      <option value="BALLISTICS">🔫 Ballistics</option>
                      <option value="TOXICOLOGY">⚗️ Toxicology</option>
                    </select>
                    <span className="ft-select-icon">🔬</span>
                  </div>
                </div>

                <label className="ft-section-label">Sections</label>
                {newTemplate.sections.map((section, idx) => (
                  <div key={idx} className="ft-section-card">
                    <div className="ft-section-header">
                      <span className="ft-section-number">Section {idx + 1}</span>
                      <button className="ft-icon-btn ft-danger" onClick={() => removeSection(idx)}>🗑️</button>
                    </div>
                    <div className="ft-form-group">
                      <input 
                        value={section.title} 
                        onChange={(e) => updateSectionTitle(idx, e.target.value)} 
                        placeholder="Section Title (e.g., Device Information)"
                        className="ft-section-title-input"
                      />
                    </div>
                    {section.fields.map((field, fidx) => (
                      <div key={fidx} className="ft-field-item">
                        <input 
                          value={field}
                          onChange={(e) => updateField(idx, fidx, e.target.value)}
                          placeholder={`Field ${fidx + 1}`}
                          className="ft-field-input"
                        />
                      </div>
                    ))}
                    <div className="ft-section-actions">
                      <button className="ft-btn ft-btn-primary ft-btn-small" onClick={() => addField(idx)}>
                        + Add Field
                      </button>
                    </div>
                  </div>
                ))}
                <button className="ft-btn ft-btn-secondary ft-btn-block" onClick={addSection}>
                  + Add Section
                </button>

                <div className="ft-modal-footer">
                  <button className="ft-btn ft-btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                  <button className="ft-btn ft-btn-success" onClick={createTemplate}>Create Template</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predefined Templates */}
      <div className="ft-card ft-fade-up">
        <div className="ft-card-header">
          <div className="ft-card-icon">📚</div>
          <div>
            <h3>Predefined Templates</h3>
            <p>Ready-to-use analysis templates</p>
          </div>
          <span className="ft-badge">{Object.keys(predefinedTemplates).length} templates</span>
        </div>
        <div className="ft-templates-grid">
          {Object.entries(predefinedTemplates).map(([key, template]: [string, any]) => (
            <div 
              key={key} 
              className={`ft-template-card ${selectedTemplate === key ? "expanded" : ""} ${hoveredTemplate === key ? "hovered" : ""}`}
              onMouseEnter={() => setHoveredTemplate(key)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <div className="ft-template-header" onClick={() => setSelectedTemplate(selectedTemplate === key ? null : key)}>
                <div className="ft-template-icon">{getAnalysisTypeIcon(template.analysis_type)}</div>
                <div className="ft-template-info">
                  <h4 className="ft-template-name">{template.name}</h4>
                  <p className="ft-template-desc">{template.description}</p>
                  <div className="ft-template-meta">
                    <span className="ft-template-type">{getAnalysisTypeLabel(template.analysis_type)}</span>
                  </div>
                </div>
                <div className="ft-template-expand">{selectedTemplate === key ? "▲" : "▼"}</div>
              </div>
              {selectedTemplate === key && (
                <div className="ft-template-preview">
                  <div className="ft-preview-title">Sections:</div>
                  <ul className="ft-preview-list">
                    {template.sections.map((section: any, idx: number) => (
                      <li key={idx} className="ft-preview-item">
                        <span className="ft-preview-section-icon">📋</span>
                        <strong>{section.title}</strong>
                        <ul className="ft-fields-list">
                          {section.fields.map((field: string, fidx: number) => (
                            <li key={fidx}>• {field}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      {myTemplates.length > 0 && (
        <div className="ft-card ft-fade-up">
          <div className="ft-card-header">
            <div className="ft-card-icon">📝</div>
            <div>
              <h3>My Custom Templates</h3>
              <p>Your personalized analysis templates</p>
            </div>
            <span className="ft-badge">{myTemplates.length} templates</span>
          </div>
          <div className="ft-templates-grid">
            {myTemplates.map((template) => (
              <div 
                key={template.template_id} 
                className={`ft-template-card ${expandedTemplate === template.template_id ? "expanded" : ""} ${hoveredTemplate === template.template_id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredTemplate(template.template_id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <div className="ft-template-header" onClick={() => setExpandedTemplate(expandedTemplate === template.template_id ? null : template.template_id)}>
                  <div className="ft-template-icon">{getAnalysisTypeIcon(template.analysis_type)}</div>
                  <div className="ft-template-info">
                    <h4 className="ft-template-name">{template.name}</h4>
                    <p className="ft-template-desc">{template.description}</p>
                    <div className="ft-template-meta">
                      <span className="ft-template-type">{getAnalysisTypeLabel(template.analysis_type)}</span>
                      <span className="ft-template-author">Created by {template.created_by_name}</span>
                      <span className="ft-template-date">{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ft-template-expand">{expandedTemplate === template.template_id ? "▲" : "▼"}</div>
                </div>
                {expandedTemplate === template.template_id && (
                  <div className="ft-template-preview">
                    <div className="ft-preview-title">Sections:</div>
                    <ul className="ft-preview-list">
                      {template.sections.map((section, idx) => (
                        <li key={idx} className="ft-preview-item">
                          <span className="ft-preview-section-icon">📋</span>
                          <strong>{section.title}</strong>
                          <ul className="ft-fields-list">
                            {section.fields.map((field, fidx) => (
                              <li key={fidx}>• {field}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Custom Templates */}
      {myTemplates.length === 0 && !showCreateForm && (
        <div className="ft-empty-state">
          <div className="ft-empty-icon">📝</div>
          <h4>No Custom Templates</h4>
          <p>Create your own templates to streamline your analysis workflow</p>
          <button className="ft-btn ft-btn-primary" onClick={() => setShowCreateForm(true)}>
            + Create Your First Template
          </button>
        </div>
      )}

      {/* Message Toast */}
      {message && !showCreateForm && (
        <div className={`ft-toast ${message.includes("✅") ? "ft-toast-success" : "ft-toast-error"}`}>
          <span>{message}</span>
        </div>
      )}

      <style>{`
        /* Forensic Templates Styles - Indigo Theme */
        .ft-dashboard {
          animation: ft-fadeIn 0.4s ease-out;
        }

        @keyframes ft-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ft-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ft-fade-up {
          animation: ft-fadeUp 0.5s ease-out backwards;
        }

        /* Loading */
        .ft-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
          gap: 16px;
        }

        .ft-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: ft-spin 0.8s linear infinite;
        }

        @keyframes ft-spin {
          to { transform: rotate(360deg); }
        }

        .ft-loading p {
          color: #7a849c;
        }

        /* Action Bar */
        .ft-action-bar {
          margin-bottom: 24px;
        }

        /* Cards */
        .ft-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .ft-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .ft-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .ft-card-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .ft-card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .ft-card-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        .ft-badge {
          margin-left: auto;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* Templates Grid */
        .ft-templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 16px;
        }

        @media (max-width: 768px) {
          .ft-templates-grid {
            grid-template-columns: 1fr;
          }
        }

        .ft-template-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          transition: all 0.3s;
          overflow: hidden;
        }

        .ft-template-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
        }

        .ft-template-card.expanded {
          border-color: rgba(99, 102, 241, 0.35);
        }

        .ft-template-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ft-template-header:hover {
          background: rgba(99, 102, 241, 0.05);
        }

        .ft-template-icon {
          font-size: 1.8rem;
        }

        .ft-template-info {
          flex: 1;
        }

        .ft-template-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 6px 0;
        }

        .ft-template-desc {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .ft-template-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.65rem;
        }

        .ft-template-type {
          background: rgba(99, 102, 241, 0.12);
          color: #818cf8;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .ft-template-author, .ft-template-date {
          color: #3d4459;
        }

        .ft-template-expand {
          color: #818cf8;
          font-size: 0.8rem;
        }

        /* Template Preview */
        .ft-template-preview {
          padding: 0 18px 18px 18px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .ft-preview-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #818cf8;
          margin-bottom: 12px;
          padding-top: 12px;
        }

        .ft-preview-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .ft-preview-item {
          margin-bottom: 12px;
          padding: 10px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 8px;
        }

        .ft-preview-section-icon {
          font-size: 0.9rem;
          margin-right: 6px;
        }

        .ft-preview-item strong {
          font-size: 0.8rem;
          color: #e8ecf8;
        }

        .ft-fields-list {
          list-style: none;
          padding-left: 24px;
          margin: 8px 0 0 0;
          font-size: 0.7rem;
          color: #7a849c;
        }

        .ft-fields-list li {
          margin-bottom: 3px;
        }

        /* Modal */
        .ft-modal-overlay {
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
          animation: ft-fadeInModal 0.2s ease;
        }

        @keyframes ft-fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ft-modal {
          background: linear-gradient(135deg, #0c0f1a, #07090e);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          animation: ft-slideUpModal 0.3s ease;
        }

        @keyframes ft-slideUpModal {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .ft-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
        }

        .ft-modal-header h3 {
          font-size: 1.1rem;
          color: #818cf8;
          margin: 0;
        }

        .ft-modal-close {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #7a849c;
          font-size: 1rem;
          cursor: pointer;
        }

        .ft-modal-body {
          padding: 24px;
        }

        /* Form */
        .ft-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ft-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ft-form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
        }

        .ft-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .ft-section-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #818cf8;
          margin-top: 8px;
        }

        .ft-input-wrapper, .ft-select-wrapper, .ft-textarea-wrapper {
          position: relative;
        }

        .ft-input-icon, .ft-select-icon, .ft-textarea-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .ft-textarea-icon {
          top: 14px;
          transform: none;
        }

        .ft-input-wrapper input, .ft-select-wrapper select, .ft-textarea-wrapper textarea {
          width: 100%;
          padding: 10px 12px 10px 36px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          color: #e8ecf8;
          font-size: 0.85rem;
        }

        .ft-input-wrapper input:focus, .ft-select-wrapper select:focus, .ft-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* Section Card */
        .ft-section-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .ft-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .ft-section-number {
          font-size: 0.7rem;
          font-weight: 600;
          color: #818cf8;
        }

        .ft-section-title-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 6px;
          color: #e8ecf8;
          font-size: 0.8rem;
          margin-bottom: 10px;
        }

        .ft-field-item {
          margin-bottom: 8px;
        }

        .ft-field-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 6px;
          color: #e8ecf8;
          font-size: 0.8rem;
        }

        .ft-section-actions {
          margin-top: 10px;
        }

        /* Buttons */
        .ft-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ft-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .ft-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .ft-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .ft-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .ft-btn-secondary {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .ft-btn-secondary:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .ft-btn-small {
          padding: 5px 12px;
          font-size: 0.7rem;
        }

        .ft-btn-block {
          width: 100%;
        }

        .ft-icon-btn {
          background: transparent;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .ft-icon-btn.ft-danger {
          color: #f87171;
        }

        .ft-icon-btn.ft-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Modal Footer */
        .ft-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        /* Message */
        .ft-message {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .ft-message-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .ft-message-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Toast */
        .ft-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 200;
          padding: 12px 20px;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          font-size: 0.85rem;
          animation: ft-toastIn 0.3s ease-out;
        }

        @keyframes ft-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .ft-toast-success {
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .ft-toast-error {
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        /* Empty State */
        .ft-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(12, 15, 26, 0.6);
          border-radius: 16px;
        }

        .ft-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }

        .ft-empty-state h4 {
          font-size: 1rem;
          margin-bottom: 8px;
          color: #e8ecf8;
        }

        .ft-empty-state p {
          color: #7a849c;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}