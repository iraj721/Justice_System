// frontend/src/features/dashboard/EmergencySOS.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/services/apiClient";

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export function EmergencySOS({
  token,
  cases,
}: {
  token: string;
  cases: any[];
}) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
  });
  const [selectedCase, setSelectedCase] = useState("");
  const [location, setLocation] = useState("");
  const [sosMessage, setSosMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingSOS, setSendingSOS] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadContacts();
    getCurrentLocation();
  }, []);

  async function loadContacts() {
    try {
      const data = await apiRequest<EmergencyContact[]>("/emergency/contacts", {
        token,
      });
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(
            `${position.coords.latitude}, ${position.coords.longitude}`,
          );
        },
        () => {
          setLocation("Location unavailable - please enter manually");
        },
      );
    }
  }

  async function handleAddContact() {
    if (!newContact.name || !newContact.relationship || !newContact.phone) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    try {
      await apiRequest("/emergency/contacts/add", {
        method: "POST",
        token,
        body: newContact,
      });
      setMessage("✅ Emergency contact added");
      setNewContact({ name: "", relationship: "", phone: "", email: "" });
      loadContacts();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to add contact");
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm("Delete this emergency contact?")) return;

    try {
      await apiRequest(`/emergency/contacts/${contactId}`, {
        method: "DELETE",
        token,
      });
      loadContacts();
    } catch (err) {
      setMessage("❌ Failed to delete");
    }
  }

  // frontend/src/features/dashboard/EmergencySOS.tsx
  // Replace the handleSendSOS function with this:

  async function handleSendSOS() {
    if (contacts.length === 0) {
      setMessage("❌ Please add emergency contacts first");
      return;
    }

    setSendingSOS(true);
    try {
      const result = await apiRequest<any>("/emergency/sos", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase || null,
          location: location || "Location unknown",
          message: sosMessage || "Emergency! Please contact me immediately.",
        },
      });
      const alertCount = result?.alerts_sent?.length || 0;
      setMessage(`✅ SOS sent to ${alertCount} contacts! Help is on the way.`);
      setSosMessage("");
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("❌ Failed to send SOS");
    } finally {
      setSendingSOS(false);
    }
  }

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div>
      {/* SOS Button - Prominent */}
      <div
        className="card"
        style={{
          textAlign: "center",
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          border: "2px solid #ef4444",
        }}
      >
        <h2 style={{ color: "#991b1b", marginBottom: "16px" }}>
          🚨 EMERGENCY SOS
        </h2>
        <p style={{ color: "#7f1d1d", marginBottom: "24px" }}>
          Press this button only in real emergencies. Your emergency contacts
          will be notified immediately.
        </p>
        <button
          onClick={handleSendSOS}
          disabled={sendingSOS || contacts.length === 0}
          style={{
            background: "#ef4444",
            color: "white",
            fontSize: "24px",
            padding: "20px 40px",
            borderRadius: "50px",
            cursor: "pointer",
            border: "none",
            animation: "pulse 1s infinite",
          }}
        >
          {sendingSOS ? "📡 Sending SOS..." : "🚨 SEND SOS ALERT 🚨"}
        </button>
        {contacts.length === 0 && (
          <p style={{ color: "#991b1b", marginTop: "16px" }}>
            ⚠️ Add emergency contacts below to enable SOS
          </p>
        )}
      </div>

      {/* SOS Form */}
      <div className="card">
        <h3>📋 SOS Details (Optional)</h3>
        <div className="form-grid">
          <label>📍 Current Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Auto-detected or enter manually"
          />
          <button
            onClick={getCurrentLocation}
            style={{ background: "#3b82f6", cursor: "pointer" }}
          >
            📍 Get Current Location
          </button>

          <label>📝 Additional Message</label>
          <textarea
            value={sosMessage}
            onChange={(e) => setSosMessage(e.target.value)}
            rows={3}
            placeholder="Any additional information..."
          />

          <label>⚖️ Related Case (Optional)</label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
          >
            <option value="">-- Select Related Case --</option>
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Emergency Contact */}
      <div className="card">
        <h3>➕ Add Emergency Contact</h3>
        {message && (
          <div
            style={{
              padding: "12px",
              background: message.includes("✅") ? "#d1fae5" : "#fee2e2",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            {message}
          </div>
        )}

        <div className="form-grid">
          <label>Full Name *</label>
          <input
            value={newContact.name}
            onChange={(e) =>
              setNewContact({ ...newContact, name: e.target.value })
            }
            placeholder="e.g., Ahmad Raza"
          />

          <label>Relationship *</label>
          <input
            value={newContact.relationship}
            onChange={(e) =>
              setNewContact({ ...newContact, relationship: e.target.value })
            }
            placeholder="e.g., Brother, Father, Friend"
          />

          <label>Phone Number *</label>
          <input
            value={newContact.phone}
            onChange={(e) =>
              setNewContact({ ...newContact, phone: e.target.value })
            }
            placeholder="0300-1234567"
          />

          <label>Email (Optional)</label>
          <input
            value={newContact.email}
            onChange={(e) =>
              setNewContact({ ...newContact, email: e.target.value })
            }
            placeholder="email@example.com"
          />

          <button
            onClick={handleAddContact}
            style={{ background: "#10b981", cursor: "pointer" }}
          >
            ➕ Add Contact
          </button>
        </div>
      </div>

      {/* Emergency Contacts List */}
      <div className="card">
        <h3>👥 Your Emergency Contacts ({contacts.length})</h3>
        {contacts.length === 0 ? (
          <p>
            No emergency contacts added. Add at least one contact to enable SOS
            feature.
          </p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>{contact.name}</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {contact.relationship}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  📞 {contact.phone}
                </div>
                {contact.email && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    📧 {contact.email}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteContact(contact.id)}
                style={{
                  background: "#ef4444",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                🗑️ Remove
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
