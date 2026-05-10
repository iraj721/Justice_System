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
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

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
      setTimeout(() => setMessageStatus(""), 3000);
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
      setTimeout(() => setMessageStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!selectedCase || !noteText) {
      setMessageStatus("❌ Please enter a note");
      setTimeout(() => setMessageStatus(""), 3000);
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
      setTimeout(() => setMessageStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cp-dashboard">
      {/* Case Selector Card */}
      <div className="cp-card cp-fade-up">
        <div className="cp-card-header">
          <div className="cp-card-icon">📋</div>
          <div>
            <h3>Select Case</h3>
            <p>Choose a case to view communication history</p>
          </div>
        </div>
        <div className="cp-select-wrapper">
          <select 
            value={selectedCase} 
            onChange={(e) => setSelectedCase(e.target.value)}
            className="cp-case-select"
          >
            <option value="">-- Select a Case --</option>
            {cases.map((c: any) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
          <span className="cp-select-icon">⚖️</span>
        </div>
      </div>

      {selectedCase && complainantInfo && (
        <>
          {/* Complainant Info Card */}
          <div className="cp-card cp-info-card cp-fade-up">
            <div className="cp-info-header">
              <div className="cp-info-icon">👤</div>
              <div>
                <h3>Complainant Information</h3>
                <p>Contact details for case communication</p>
              </div>
            </div>
            <div className="cp-info-details">
              <div className="cp-info-item">
                <span className="cp-info-label">Full Name:</span>
                <span className="cp-info-value">{complainantInfo.name}</span>
              </div>
              <div className="cp-info-item">
                <span className="cp-info-label">Email Address:</span>
                <span className="cp-info-value">{complainantInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="cp-tabs-container">
            <div className="cp-tabs">
              <button
                className={`cp-tab ${activeTab === "messages" ? "active" : ""}`}
                onClick={() => setActiveTab("messages")}
              >
                <span className="cp-tab-icon">💬</span>
                <span>Messages</span>
                {messages.length > 0 && <span className="cp-tab-badge">{messages.length}</span>}
              </button>
              <button
                className={`cp-tab ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                <span className="cp-tab-icon">📝</span>
                <span>Investigation Notes</span>
                {notes.length > 0 && <span className="cp-tab-badge">{notes.length}</span>}
              </button>
              <button
                className={`cp-tab ${activeTab === "compose" ? "active" : ""}`}
                onClick={() => setActiveTab("compose")}
              >
                <span className="cp-tab-icon">✍️</span>
                <span>Compose Message</span>
              </button>
            </div>
          </div>

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="cp-card cp-fade-up">
              <div className="cp-card-header">
                <div className="cp-card-icon">📬</div>
                <div>
                  <h3>Message History</h3>
                  <p>{messages.length} message{messages.length !== 1 ? 's' : ''} sent</p>
                </div>
              </div>
              
              {messages.length === 0 ? (
                <div className="cp-empty">
                  <div className="cp-empty-icon">💬</div>
                  <h4>No Messages Yet</h4>
                  <p>Send your first message to the complainant</p>
                  <button className="cp-link-btn" onClick={() => setActiveTab("compose")}>
                    Compose Message →
                  </button>
                </div>
              ) : (
                <div className="cp-messages-list">
                  {messages.map((msg, idx) => (
                    <div 
                      key={msg.message_id} 
                      className={`cp-message-card ${hoveredMessage === msg.message_id ? "hovered" : ""}`}
                      onMouseEnter={() => setHoveredMessage(msg.message_id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="cp-message-header">
                        <div className="cp-message-subject">
                          <span className="cp-message-icon">📧</span>
                          <strong>{msg.subject}</strong>
                        </div>
                        <span className="cp-message-date">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="cp-message-body">{msg.message}</p>
                      <div className="cp-message-footer">
                        <span className="cp-message-recipient">
                          To: {msg.to_name} ({msg.to_email})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Investigation Notes Tab */}
          {activeTab === "notes" && (
            <div className="cp-card cp-fade-up">
              <div className="cp-card-header">
                <div className="cp-card-icon">📝</div>
                <div>
                  <h3>Add Investigation Note</h3>
                  <p>Document your investigation progress</p>
                </div>
              </div>

              <div className="cp-add-note">
                <textarea 
                  value={noteText} 
                  onChange={(e) => setNoteText(e.target.value)} 
                  rows={3} 
                  placeholder="Add your investigation notes here..."
                  className="cp-note-input"
                />
                <button className="cp-btn cp-btn-success" onClick={addNote} disabled={loading}>
                  {loading ? "Adding..." : "📝 Add Note"}
                </button>
              </div>

              <div className="cp-divider" />

              <div className="cp-notes-header">
                <h3>📋 Previous Notes</h3>
                <p>{notes.length} note{notes.length !== 1 ? 's' : ''} recorded</p>
              </div>

              {notes.length === 0 ? (
                <div className="cp-empty">
                  <div className="cp-empty-icon">📭</div>
                  <h4>No Notes Added</h4>
                  <p>Start adding investigation notes above</p>
                </div>
              ) : (
                <div className="cp-notes-list">
                  {notes.map((note, idx) => (
                    <div 
                      key={note.note_id} 
                      className={`cp-note-card ${hoveredNote === note.note_id ? "hovered" : ""}`}
                      onMouseEnter={() => setHoveredNote(note.note_id)}
                      onMouseLeave={() => setHoveredNote(null)}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="cp-note-content">
                        <p>{note.note}</p>
                      </div>
                      <div className="cp-note-footer">
                        <span className="cp-note-author">
                          👤 {note.added_by_name}
                        </span>
                        <span className="cp-note-date">
                          📅 {new Date(note.added_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compose Message Tab */}
          {activeTab === "compose" && (
            <div className="cp-card cp-fade-up">
              <div className="cp-card-header">
                <div className="cp-card-icon">✍️</div>
                <div>
                  <h3>Send Message to Complainant</h3>
                  <p>Communicate directly with the complainant</p>
                </div>
              </div>

              {messageStatus && (
                <div className={`cp-message-status ${messageStatus.includes("✅") ? "cp-status-success" : "cp-status-error"}`}>
                  <span>{messageStatus}</span>
                </div>
              )}

              <div className="cp-form">
                <div className="cp-form-group">
                  <label>📧 To</label>
                  <div className="cp-input-wrapper cp-readonly">
                    <span className="cp-input-icon">👤</span>
                    <input 
                      value={recipientEmail} 
                      readOnly 
                      disabled 
                      className="cp-readonly-input"
                    />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label>📝 Subject <span className="cp-required">*</span></label>
                  <div className="cp-input-wrapper">
                    <span className="cp-input-icon">📌</span>
                    <input 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      placeholder="e.g., Request for additional information"
                    />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label>💬 Message <span className="cp-required">*</span></label>
                  <div className="cp-textarea-wrapper">
                    <span className="cp-textarea-icon">📄</span>
                    <textarea 
                      value={messageText} 
                      onChange={(e) => setMessageText(e.target.value)} 
                      rows={6} 
                      placeholder="Write your message here..."
                    />
                  </div>
                </div>

                <div className="cp-form-actions">
                  <button className="cp-btn cp-btn-primary" onClick={sendMessage} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="cp-spinner-small"></span>
                        Sending...
                      </>
                    ) : (
                      "📤 Send Message"
                    )}
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="cp-tips">
                <div className="cp-tips-icon">💡</div>
                <div className="cp-tips-content">
                  <strong>Communication Tips</strong>
                  <p>Keep messages professional and clear. Document all important communications for case records.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        /* Communication Panel Styles - Indigo Theme */
        .cp-dashboard {
          animation: cp-fadeIn 0.4s ease-out;
        }

        @keyframes cp-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cp-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cp-fade-up {
          animation: cp-slideUp 0.5s ease-out backwards;
        }

        /* Cards */
        .cp-card {
          background: rgba(12, 15, 26, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
          transition: all 0.3s;
        }

        .cp-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
        }

        .cp-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .cp-card-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .cp-card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .cp-card-header p {
          font-size: 0.8rem;
          color: #7a849c;
          margin: 0;
        }

        /* Case Select */
        .cp-select-wrapper {
          position: relative;
        }

        .cp-case-select {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          color: #e8ecf8;
          font-size: 0.9rem;
          appearance: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cp-case-select:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cp-select-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        /* Info Card */
        .cp-info-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04));
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .cp-info-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .cp-info-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .cp-info-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin: 0 0 4px 0;
        }

        .cp-info-header p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        .cp-info-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cp-info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(7, 9, 14, 0.5);
          border-radius: 10px;
        }

        .cp-info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a849c;
          min-width: 100px;
        }

        .cp-info-value {
          font-size: 0.85rem;
          color: #e8ecf8;
        }

        /* Tabs */
        .cp-tabs-container {
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 24px;
        }

        .cp-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cp-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #7a849c;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          border-radius: 8px 8px 0 0;
        }

        .cp-tab::after {
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

        .cp-tab:hover {
          color: #e8ecf8;
          background: rgba(99, 102, 241, 0.05);
        }

        .cp-tab.active {
          color: #818cf8;
        }

        .cp-tab.active::after {
          transform: scaleX(1);
        }

        .cp-tab-icon {
          font-size: 1rem;
        }

        .cp-tab-badge {
          background: rgba(99, 102, 241, 0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #818cf8;
        }

        /* Messages List */
        .cp-messages-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cp-message-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cp-slideIn 0.3s ease-out backwards;
        }

        @keyframes cp-slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .cp-message-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
          background: rgba(12, 15, 26, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .cp-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cp-message-subject {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cp-message-icon {
          font-size: 1rem;
        }

        .cp-message-subject strong {
          font-size: 0.9rem;
          color: #e8ecf8;
        }

        .cp-message-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        .cp-message-body {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .cp-message-footer {
          padding-top: 10px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        .cp-message-recipient {
          font-size: 0.7rem;
          color: #3d4459;
        }

        /* Notes Section */
        .cp-add-note {
          margin-bottom: 24px;
        }

        .cp-note-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 12px;
          color: #e8ecf8;
          font-size: 0.85rem;
          resize: vertical;
          margin-bottom: 16px;
        }

        .cp-note-input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cp-divider {
          height: 1px;
          background: rgba(99, 102, 241, 0.1);
          margin: 20px 0;
        }

        .cp-notes-header {
          margin-bottom: 20px;
        }

        .cp-notes-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .cp-notes-header p {
          font-size: 0.75rem;
          color: #7a849c;
        }

        .cp-notes-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cp-note-card {
          background: rgba(7, 9, 14, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s;
          animation: cp-slideIn 0.3s ease-out backwards;
        }

        .cp-note-card.hovered {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(12, 15, 26, 0.8);
        }

        .cp-note-content p {
          font-size: 0.85rem;
          color: #7a849c;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .cp-note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        .cp-note-author,
        .cp-note-date {
          font-size: 0.7rem;
          color: #3d4459;
        }

        /* Form */
        .cp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cp-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cp-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #7a849c;
        }

        .cp-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .cp-input-wrapper {
          position: relative;
        }

        .cp-input-wrapper.cp-readonly {
          opacity: 0.8;
        }

        .cp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .cp-input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
          transition: all 0.3s;
        }

        .cp-input-wrapper input:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cp-readonly-input {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .cp-textarea-wrapper {
          position: relative;
        }

        .cp-textarea-icon {
          position: absolute;
          left: 14px;
          top: 16px;
          font-size: 0.9rem;
          pointer-events: none;
          color: #3d4459;
        }

        .cp-textarea-wrapper textarea {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7, 9, 14, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.85rem;
          resize: vertical;
        }

        .cp-textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .cp-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        /* Buttons */
        .cp-btn {
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cp-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
        }

        .cp-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .cp-btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .cp-btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .cp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cp-link-btn {
          background: none;
          border: none;
          color: #818cf8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .cp-link-btn:hover {
          color: #a5b4fc;
          transform: translateX(4px);
        }

        /* Message Status */
        .cp-message-status {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          animation: cp-statusIn 0.3s ease-out;
        }

        @keyframes cp-statusIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cp-status-success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .cp-status-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Tips */
        .cp-tips {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-top: 24px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 12px;
        }

        .cp-tips-icon {
          font-size: 1.5rem;
        }

        .cp-tips-content strong {
          display: block;
          font-size: 0.85rem;
          color: #e8ecf8;
          margin-bottom: 4px;
        }

        .cp-tips-content p {
          font-size: 0.75rem;
          color: #7a849c;
          margin: 0;
        }

        /* Spinner */
        .cp-spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: cp-spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes cp-spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .cp-empty {
          text-align: center;
          padding: 40px 20px;
        }

        .cp-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .cp-empty h4 {
          font-size: 1rem;
          margin-bottom: 6px;
          color: #e8ecf8;
        }

        .cp-empty p {
          font-size: 0.8rem;
          color: #7a849c;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cp-card {
            padding: 20px;
          }

          .cp-tab {
            padding: 10px 16px;
            font-size: 0.8rem;
          }

          .cp-tab-icon {
            font-size: 0.9rem;
          }

          .cp-message-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .cp-info-details {
            gap: 8px;
          }

          .cp-info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .cp-info-label {
            min-width: auto;
          }

          .cp-form-actions {
            justify-content: stretch;
          }

          .cp-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}