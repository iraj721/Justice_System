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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [message, setMessage] = useState("");

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

  if (loading) {
    return <div className="card">Loading templates...</div>;
  }

  return (
    <div>
      {/* Create Template Button */}
      <div style={{ marginBottom: "16px" }}>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ background: "#10b981", cursor: "pointer" }}>
          {showCreateForm ? "❌ Cancel" : "➕ Create Custom Template"}
        </button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="card">
          <h3>📝 Create Custom Template</h3>
          {message && <p style={{ color: message.includes("✅") ? "#10b981" : "#ef4444" }}>{message}</p>}
          <div className="form-grid">
            <label>Template Name *</label>
            <input value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="e.g., Mobile Device Forensics" />

            <label>Description</label>
            <textarea value={newTemplate.description} onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})} rows={2} placeholder="Template description..." />

            <label>Analysis Type</label>
            <select value={newTemplate.analysis_type} onChange={(e) => setNewTemplate({...newTemplate, analysis_type: e.target.value})}>
              <option value="DIGITAL_FORENSICS">Digital Forensics</option>
              <option value="DNA_ANALYSIS">DNA Analysis</option>
              <option value="FINGERPRINT">Fingerprint</option>
              <option value="BALLISTICS">Ballistics</option>
              <option value="TOXICOLOGY">Toxicology</option>
            </select>

            <label>Sections</label>
            {newTemplate.sections.map((section, idx) => (
              <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                <input 
                  value={section.title} 
                  onChange={(e) => updateSectionTitle(idx, e.target.value)} 
                  placeholder={`Section ${idx + 1} Title`}
                  style={{ width: "100%", marginBottom: "8px", padding: "6px" }}
                />
                {section.fields.map((field, fidx) => (
                  <input 
                    key={fidx}
                    value={field}
                    onChange={(e) => updateField(idx, fidx, e.target.value)}
                    placeholder={`Field ${fidx + 1}`}
                    style={{ width: "100%", marginBottom: "4px", padding: "6px" }}
                  />
                ))}
                <button onClick={() => addField(idx)} style={{ background: "#3b82f6", fontSize: "11px", padding: "4px 8px", marginRight: "8px", cursor: "pointer" }}>+ Add Field</button>
                <button onClick={() => removeSection(idx)} style={{ background: "#ef4444", fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}>Remove Section</button>
              </div>
            ))}
            <button onClick={addSection} style={{ background: "#8b5cf6", cursor: "pointer" }}>+ Add Section</button>

            <button onClick={createTemplate} style={{ background: "#10b981", marginTop: "16px", cursor: "pointer" }}>Create Template</button>
          </div>
        </div>
      )}

      {/* Predefined Templates */}
      <div className="card">
        <h3>📚 Predefined Templates</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {Object.entries(predefinedTemplates).map(([key, template]: [string, any]) => (
            <div key={key} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", cursor: "pointer" }} onClick={() => setSelectedTemplate(selectedTemplate === key ? null : key)}>
              <h4>{template.name}</h4>
              <p style={{ fontSize: "13px", color: "#666" }}>{template.description}</p>
              {selectedTemplate === key && (
                <div style={{ marginTop: "12px" }}>
                  <strong>Sections:</strong>
                  <ul style={{ marginTop: "8px", fontSize: "12px" }}>
                    {template.sections.map((section: any, idx: number) => (
                      <li key={idx}>{section.title}</li>
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
        <div className="card">
          <h3>📝 My Custom Templates</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {myTemplates.map((template) => (
              <div key={template.template_id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <h4>{template.name}</h4>
                <p style={{ fontSize: "13px", color: "#666" }}>{template.description}</p>
                <p style={{ fontSize: "11px", color: "#999" }}>Created by {template.created_by_name} on {new Date(template.created_at).toLocaleDateString()}</p>
                <details>
                  <summary style={{ cursor: "pointer", fontSize: "12px", color: "#3b82f6" }}>View Sections</summary>
                  <ul style={{ marginTop: "8px", fontSize: "11px" }}>
                    {template.sections.map((section, idx) => (
                      <li key={idx}><strong>{section.title}</strong> - {section.fields.join(", ")}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}