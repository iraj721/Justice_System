// frontend/src/pages/roles/Investigator/components/CommunicationPanel.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

type Message = {
  message_id: string;
  case_id: string;
  case_number: string;
  subject: string;
  message: string;
  from_email: string;
  from_name: string;
  to_email: string;
  to_name: string;
  created_at: string;
  status: string;
};

type InvestigationNote = {
  note_id: string;
  note: string;
  added_by: string;
  added_by_name: string;
  added_at: string;
};

export function CommunicationPanel({ token, cases, caseId }: { token: string; cases: any[]; caseId?: string }) {
  const [selectedCase, setSelectedCase] = useState(caseId || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<InvestigationNote[]>([]);
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [complainantInfo, setComplainantInfo] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [messageStatus, setMessageStatus] = useState("");

  useEffect(() => {
    if (selectedCase) {
      loadMessages();
      loadNotes();
      loadComplainantInfo();
    }
  }, [selectedCase]);

  async function loadMessages() {
    try {
      const data = await apiRequest<Message[]>(`/investigator/comm/messages/${selectedCase}`, { token });
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadNotes() {
    try {
      const data = await apiRequest<InvestigationNote[]>(`/investigator/comm/notes/${selectedCase}`, { token });
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadComplainantInfo() {
    const caseData = cases.find((c: any) => c.case_id === selectedCase);
    if (caseData) {
      try {
        const firData = await apiRequest<any>(`/fir/${caseData.fir_id}`, { token });
        setComplainantInfo({
          name: firData.complainant_name,
          email: firData.complainant_email
        });
        setRecipientEmail(firData.complainant_email);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function sendMessage() {
    if (!selectedCase || !subject || !messageText) {
      setMessageStatus("❌ Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/investigator/comm/send-message", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          subject,
          message: messageText,
          recipient_email: recipientEmail
        }
      });
      setMessageStatus("✅ Message sent successfully!");
      setSubject("");
      setMessageText("");
      loadMessages();
      setTimeout(() => setMessageStatus(""), 3000);
    } catch (err) {
      setMessageStatus("❌ Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!selectedCase || !noteText) {
      setMessageStatus("❌ Please enter a note");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/investigator/comm/add-note", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase,
          note: noteText
        }
      });
      setMessageStatus("✅ Note added!");
      setNoteText("");
      loadNotes();
      setTimeout(() => setMessageStatus(""), 3000);
    } catch (err) {
      setMessageStatus("❌ Failed to add note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Case Selector */}
      <div className="card">
        <label>Select Case</label>
        <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "8px" }}>
          <option value="">-- Select a Case --</option>
          {cases.map((c: any) => (
            <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
          ))}
        </select>
      </div>

      {selectedCase && complainantInfo && (
        <>
          {/* Complainant Info */}
          <div className="card" style={{ background: "#eff6ff" }}>
            <h3>👤 Complainant Information</h3>
            <p><strong>Name:</strong> {complainantInfo.name}</p>
            <p><strong>Email:</strong> {complainantInfo.email}</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
            <button onClick={() => setActiveTab("messages")} style={{ background: activeTab === "messages" ? "#3b82f6" : "transparent", color: activeTab === "messages" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              💬 Messages ({messages.length})
            </button>
            <button onClick={() => setActiveTab("notes")} style={{ background: activeTab === "notes" ? "#3b82f6" : "transparent", color: activeTab === "notes" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              📝 Investigation Notes ({notes.length})
            </button>
            <button onClick={() => setActiveTab("compose")} style={{ background: activeTab === "compose" ? "#3b82f6" : "transparent", color: activeTab === "compose" ? "white" : "#64748b", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              ✍️ Compose Message
            </button>
          </div>

          {/* Messages List */}
          {activeTab === "messages" && (
            <div className="card">
              <h3>📬 Message History</h3>
              {messages.length === 0 ? (
                <p>No messages sent yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.message_id} style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                      <strong>{msg.subject}</strong>
                      <span style={{ fontSize: "11px", color: "#999" }}>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>{msg.message}</p>
                    <div style={{ fontSize: "11px", color: "#999" }}>To: {msg.to_name} ({msg.to_email})</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Investigation Notes */}
          {activeTab === "notes" && (
            <div className="card">
              <h3>📝 Add Investigation Note</h3>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Add your investigation notes here..." style={{ width: "100%", padding: "8px", marginBottom: "12px" }} />
              <button onClick={addNote} disabled={loading} style={{ background: "#10b981", cursor: "pointer" }}>Add Note</button>

              <hr style={{ margin: "16px 0" }} />
              <h3>📋 Previous Notes</h3>
              {notes.length === 0 ? (
                <p>No notes added yet.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.note_id} style={{ borderLeft: "3px solid #f59e0b", paddingLeft: "12px", marginBottom: "12px" }}>
                    <p style={{ margin: 0 }}>{note.note}</p>
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Added by {note.added_by_name} on {new Date(note.added_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Compose Message */}
          {activeTab === "compose" && (
            <div className="card">
              <h3>✍️ Send Message to Complainant</h3>
              {messageStatus && <p style={{ color: messageStatus.includes("✅") ? "#10b981" : "#ef4444" }}>{messageStatus}</p>}
              <div className="form-grid">
                <label>To</label>
                <input value={recipientEmail} readOnly disabled style={{ background: "#f3f4f6" }} />

                <label>Subject *</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Request for additional information" />

                <label>Message *</label>
                <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={5} placeholder="Write your message here..." />

                <button onClick={sendMessage} disabled={loading} style={{ background: "#3b82f6", cursor: "pointer" }}>
                  {loading ? "Sending..." : "📤 Send Message"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}