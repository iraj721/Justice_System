import { useEffect, useState } from "react";
import { apiRequest } from "../../../../shared/services/apiClient";

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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [sosMessage, setSosMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingSOS, setSendingSOS] = useState(false);
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"sos" | "contacts">("sos");
  const [isPulsing, setIsPulsing] = useState(true);

  // Toast notification function
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadContacts();
    const timer = setTimeout(() => setIsPulsing(false), 5000);
    return () => clearTimeout(timer);
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
      setTimeout(() => setLoading(false), 500);
    }
  }

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    setMessage("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocation("Location unavailable - please enter manually");
      setLocationLoading(false);
      showToast("Geolocation not supported", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setLocation(locationString);
        setLocationError("");
        setLocationLoading(false);
        showToast("📍 Location detected successfully!", "success");
        setMessage("📍 Location detected!");
        setTimeout(() => setMessage(""), 2000);
      },
      (error) => {
        let errorMsg = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg =
              "Location permission denied. Please enable location access in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg =
              "Location information unavailable. Please enter manually.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out. Please try again.";
            break;
          default:
            errorMsg = "Could not get location. Please enter manually.";
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
        showToast(errorMsg, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  async function getLocationFromIP() {
    setLocationLoading(true);
    setMessage("");
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const locationString = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;
        setLocation(locationString);
        setLocationError("");
        setMessage("📍 Location detected via IP!");
        showToast("Location detected via IP", "success");
        setTimeout(() => setMessage(""), 2000);
      } else {
        throw new Error("No location data");
      }
    } catch (err) {
      setLocationError("Could not detect location automatically");
      showToast("Could not detect location automatically", "error");
    } finally {
      setLocationLoading(false);
    }
  }

  async function handleAddContact() {
    if (
      !newContact.name ||
      !newContact.relationship ||
      !newContact.phone ||
      !newContact.email
    ) {
      showToast("Please fill all required fields", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContact.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      await apiRequest("/emergency/contacts/add", {
        method: "POST",
        token,
        body: {
          name: newContact.name,
          relationship: newContact.relationship,
          phone: newContact.phone,
          email: newContact.email || null,
        },
      });
      showToast("Emergency contact added successfully", "success");
      setNewContact({ name: "", relationship: "", phone: "", email: "" });
      loadContacts();
    } catch (err) {
      console.error("Add contact error:", err);
      showToast("Failed to add contact", "error");
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm("Are you sure you want to remove this emergency contact?"))
      return;

    try {
      await apiRequest(`/emergency/contacts/${contactId}`, {
        method: "DELETE",
        token,
      });
      loadContacts();
      showToast("Contact removed", "success");
    } catch (err) {
      showToast("Failed to delete contact", "error");
    }
  }

  async function handleSendSOS() {
    if (contacts.length === 0) {
      showToast("Please add emergency contacts first", "error");
      return;
    }

    // Get current location if not already set
    let finalLocation = location;
    if (
      !finalLocation ||
      finalLocation === "" ||
      finalLocation === "Location unavailable - please enter manually"
    ) {
      setLocationLoading(true);
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          },
        );
        finalLocation = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setLocation(finalLocation);
        setLocationError("");
      } catch (err) {
        console.error("Location error:", err);
        finalLocation = "Location unavailable - please enter manually";
        setLocation(finalLocation);
        showToast("Could not get location. Please enter manually.", "error");
      } finally {
        setLocationLoading(false);
      }
    }

    if (
      !finalLocation ||
      finalLocation === "Location unavailable - please enter manually"
    ) {
      showToast("Please enter your location manually", "error");
      return;
    }

    setSendingSOS(true);
    try {
      const result = await apiRequest<any>("/emergency/sos", {
        method: "POST",
        token,
        body: {
          case_id: selectedCase || null,
          location: finalLocation,
          message: sosMessage || "Emergency! Please contact me immediately.",
        },
      });

      const alertCount = result?.alerts_sent?.length || 0;
      showToast(
        `SOS sent to ${alertCount} contact${alertCount !== 1 ? "s" : ""}!`,
        "success",
      );
      setSosMessage("");
    } catch (err) {
      console.error("SOS error:", err);
      showToast("Failed to send SOS. Please try again.", "error");
    } finally {
      setSendingSOS(false);
    }
  }

  if (loading) {
    return (
      <div className="sos-loading">
        <div className="sos-shimmer-card">
          <div className="sos-shimmer"></div>
        </div>
        <div className="sos-shimmer-card">
          <div className="sos-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sos-dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`sos-toast sos-toast-${toastMessage.type}`}>
          <div className="sos-toast-inner">
            <span className="sos-toast-icon">
              {toastMessage.type === "success" ? "✅" : "❌"}
            </span>
            <span className="sos-toast-message">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="sos-tabs-container">
        <div className="sos-tabs">
          <button
            className={`sos-tab ${activeTab === "sos" ? "active sos-active" : ""}`}
            onClick={() => setActiveTab("sos")}
          >
            <span className="sos-tab-icon">🚨</span>
            <span>SOS Emergency</span>
          </button>
          <button
            className={`sos-tab ${activeTab === "contacts" ? "active contacts-active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            <span className="sos-tab-icon">👥</span>
            <span>Emergency Contacts</span>
            {contacts.length > 0 && (
              <span className="sos-tab-badge">{contacts.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* SOS Tab */}
      {activeTab === "sos" && (
        <div className="sos-container sos-fade-up">
          <div className="sos-alert-card">
            <div className="sos-alert-icon">🚨</div>
            <h2 className="sos-alert-title">EMERGENCY SOS</h2>
            <p className="sos-alert-description">
              Press this button only in real emergencies. Your emergency
              contacts will be notified immediately with your location.
            </p>
            <button
              className={`sos-alert-btn ${isPulsing ? "pulsing" : ""}`}
              onClick={handleSendSOS}
              disabled={sendingSOS || contacts.length === 0}
            >
              {sendingSOS ? (
                <>
                  <span className="sos-spinner"></span>
                  Sending SOS...
                </>
              ) : (
                <>
                  <span className="sos-btn-icon">🚨</span>
                  SEND SOS ALERT
                </>
              )}
            </button>
            {contacts.length === 0 && (
              <div className="sos-alert-warning">
                ⚠️ Add emergency contacts in the "Contacts" tab to enable SOS
              </div>
            )}
          </div>

          {/* SOS Details Form */}
          <div className="sos-details-card">
            <div className="sos-details-header">
              <h3>SOS Details</h3>
              <p>Provide additional information to help responders</p>
            </div>

            <div className="sos-form">
              <div className="sos-form-group">
                <label>⚖️ Related Case</label>
                <div className="sos-select-wrapper">
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
                  <span className="sos-select-icon">📋</span>
                </div>
              </div>

              {/* LOCATION SECTION - ADDED BACK */}
              <div className="sos-form-group">
                <label>📍 Current Location</label>
                <div className="sos-location-input">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Click 'Get Location' to auto-detect or enter manually"
                    className={locationError ? "sos-location-error" : ""}
                  />
                  <button
                    className="sos-location-btn"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <>
                        <span className="sos-btn-spinner"></span>
                        Detecting...
                      </>
                    ) : (
                      "📍 Get Location"
                    )}
                  </button>
                </div>
                {locationError && (
                  <div className="sos-location-hint">
                    <span className="sos-location-hint-icon">⚠️</span>
                    <span>{locationError}</span>
                    <button
                      className="sos-location-hint-btn"
                      onClick={getLocationFromIP}
                    >
                      Try IP Location
                    </button>
                  </div>
                )}
                {!locationError &&
                  location &&
                  !location.includes("unavailable") && (
                    <div className="sos-location-success">
                      ✓ Location: {location}
                    </div>
                  )}
              </div>

              <div className="sos-form-group">
                <label>📝 Additional Message</label>
                <textarea
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  rows={3}
                  placeholder="Any additional information that could help..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="sos-contacts-container sos-fade-up">
          <div className="sos-add-contact-card">
            <div className="sos-add-contact-header">
              <h3>➕ Add Emergency Contact</h3>
              <p>Add trusted people who will be notified during emergencies</p>
            </div>

            <div className="sos-add-form">
              <div className="sos-form-row">
                <div className="sos-form-group">
                  <label>
                    Full Name <span className="sos-required">*</span>
                  </label>
                  <div className="sos-input-wrapper">
                    <span className="sos-input-icon">👤</span>
                    <input
                      value={newContact.name}
                      onChange={(e) =>
                        setNewContact({ ...newContact, name: e.target.value })
                      }
                      placeholder="e.g., Ahmad Raza"
                    />
                  </div>
                </div>
                <div className="sos-form-group">
                  <label>
                    Relationship <span className="sos-required">*</span>
                  </label>
                  <div className="sos-input-wrapper">
                    <span className="sos-input-icon">🤝</span>
                    <input
                      value={newContact.relationship}
                      onChange={(e) =>
                        setNewContact({
                          ...newContact,
                          relationship: e.target.value,
                        })
                      }
                      placeholder="e.g., Brother, Father, Friend"
                    />
                  </div>
                </div>
              </div>

              <div className="sos-form-row">
                <div className="sos-form-group">
                  <label>
                    Phone Number <span className="sos-required">*</span>
                  </label>
                  <div className="sos-input-wrapper">
                    <span className="sos-input-icon">📞</span>
                    <input
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value })
                      }
                      placeholder="0300-1234567"
                    />
                  </div>
                </div>
                <div className="sos-form-group">
                  <label>
                    Email <span className="sos-required">*</span>
                  </label>
                  <div className="sos-input-wrapper">
                    <span className="sos-input-icon">📧</span>
                    <input
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact({ ...newContact, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <button className="sos-add-btn" onClick={handleAddContact}>
                ➕ Add Emergency Contact
              </button>
            </div>
          </div>

          <div className="sos-contacts-list-card">
            <div className="sos-contacts-header">
              <h3>👥 Your Emergency Contacts</h3>
              <p>
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}{" "}
                added
              </p>
            </div>

            {contacts.length === 0 ? (
              <div className="sos-empty">
                <div className="sos-empty-icon">📭</div>
                <h4>No Emergency Contacts</h4>
                <p>Add at least one contact to enable the SOS feature</p>
              </div>
            ) : (
              <div className="sos-contacts-list">
                {contacts.map((contact, idx) => (
                  <div
                    key={contact.id}
                    className="sos-contact-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="sos-contact-info">
                      <div className="sos-contact-avatar">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="sos-contact-details">
                        <strong>{contact.name}</strong>
                        <span className="sos-contact-relation">
                          {contact.relationship}
                        </span>
                        <div className="sos-contact-meta">
                          <span>📞 {contact.phone}</span>
                          {contact.email && <span>📧 {contact.email}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      className="sos-contact-delete"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="sos-tips">
              <div className="sos-tips-icon">💡</div>
              <div className="sos-tips-content">
                <strong>Emergency Tips</strong>
                <p>
                  Keep your emergency contacts updated. In case of emergency,
                  stay calm and share your exact location.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sos-dashboard {
          padding: 24px;
          animation: sos-fadeIn 0.4s ease-out;
        }

        @keyframes sos-fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sos-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sos-fade-up {
          animation: sos-slideUp 0.5s ease-out backwards;
        }

        @keyframes sos-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .sos-toast {
          position: fixed;
          top: 90px;
          right: 20px;
          z-index: 1000;
          background: rgba(12, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          padding: 12px 20px;
          min-width: 260px;
          animation: sos-toastIn 0.3s ease-out;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        @keyframes sos-toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .sos-toast-success {
          border-left: 3px solid #10b981;
        }
        .sos-toast-success .sos-toast-icon { color: #10b981; }
        .sos-toast-error {
          border-left: 3px solid #ef4444;
        }
        .sos-toast-error .sos-toast-icon { color: #ef4444; }

        .sos-toast-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sos-toast-icon { font-size: 1.1rem; }
        .sos-toast-message { font-size: 0.85rem; color: #e8ecf8; }

        .sos-loading { padding: 24px; }
        .sos-shimmer-card {
          background: rgba(12,15,26,0.5);
          border-radius: 12px;
          height: 120px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .sos-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent);
          animation: sos-shimmer 1.5s infinite;
        }
        @keyframes sos-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .sos-tabs-container {
          border-bottom: 1px solid rgba(99,102,241,0.15);
          margin-bottom: 28px;
        }
        .sos-tabs { display: flex; gap: 8px; }
        .sos-tab {
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
        .sos-tab::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          transition: transform 0.3s ease;
        }
        .sos-tab:hover { color: #e8ecf8; background: rgba(99,102,241,0.05); }
        .sos-tab.active::after { transform: scaleX(1); }
        .sos-tab.sos-active { color: #ef4444; }
        .sos-tab.sos-active::after { background: #ef4444; }
        .sos-tab.contacts-active { color: #818cf8; }
        .sos-tab.contacts-active::after { background: #6366f1; }
        .sos-tab-icon { font-size: 1.1rem; }
        .sos-tab-badge {
          background: rgba(99,102,241,0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          margin-left: 8px;
          color: #818cf8;
        }

        .sos-alert-card {
          background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06));
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          margin-bottom: 24px;
        }
        .sos-alert-icon { font-size: 4rem; margin-bottom: 16px; }
        .sos-alert-title { font-size: 1.6rem; font-weight: 800; color: #ef4444; margin-bottom: 12px; letter-spacing: 1px; }
        .sos-alert-description { color: #7a849c; margin-bottom: 28px; max-width: 500px; margin: 0 auto 28px; font-size: 0.9rem; }
        .sos-alert-btn {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: none;
          padding: 16px 40px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .sos-alert-btn.pulsing { animation: sos-pulse 1.5s infinite; }
        .sos-alert-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(239,68,68,0.4); }
        .sos-alert-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sos-alert-warning { margin-top: 20px; padding: 10px; background: rgba(239,68,68,0.08); border-radius: 8px; color: #f87171; font-size: 0.8rem; }

        .sos-details-card {
          background: rgba(12,15,26,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 16px;
          padding: 28px;
        }
        .sos-details-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .sos-details-header h3 { font-size: 1.1rem; font-weight: 600; color: #e8ecf8; margin-bottom: 6px; }
        .sos-details-header p { font-size: 0.8rem; color: #7a849c; }

        .sos-form { display: flex; flex-direction: column; gap: 20px; }
        .sos-form-group { display: flex; flex-direction: column; gap: 8px; }
        .sos-form-group label { font-size: 0.8rem; font-weight: 600; color: #7a849c; }
        .sos-required { color: #ef4444; margin-left: 2px; }

        .sos-location-input { display: flex; gap: 12px; flex-wrap: wrap; }
        .sos-location-input input {
          flex: 2;
          padding: 12px 16px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
        }
        .sos-location-input input:focus { outline: none; border-color: #6366f1; }
        .sos-location-input input.sos-location-error { border-color: #ef4444; }
        .sos-location-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sos-location-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .sos-location-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sos-location-success { font-size: 0.7rem; color: #22c55e; padding: 6px 12px; background: rgba(34,197,94,0.08); border-radius: 8px; }
        .sos-location-hint { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.7rem; color: #f87171; padding: 8px 12px; background: rgba(239,68,68,0.08); border-radius: 8px; }
        .sos-location-hint-btn { background: none; border: 1px solid rgba(99,102,241,0.3); color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer; }

        .sos-form-group textarea {
          padding: 12px 16px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          resize: vertical;
        }
        .sos-select-wrapper { position: relative; }
        .sos-select-wrapper select {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
          appearance: none;
          cursor: pointer;
        }
        .sos-select-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          color: #3d4459;
        }

        .sos-contacts-container { display: flex; flex-direction: column; gap: 24px; }
        .sos-add-contact-card, .sos-contacts-list-card {
          background: rgba(12,15,26,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 16px;
          padding: 28px;
        }
        .sos-add-contact-header, .sos-contacts-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .sos-add-contact-header h3, .sos-contacts-header h3 { font-size: 1.1rem; font-weight: 600; color: #e8ecf8; margin-bottom: 6px; }
        .sos-add-contact-header p, .sos-contacts-header p { font-size: 0.8rem; color: #7a849c; }

        .sos-add-form { display: flex; flex-direction: column; gap: 20px; }
        .sos-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sos-input-wrapper { position: relative; }
        .sos-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #3d4459;
        }
        .sos-input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(7,9,14,0.6);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          color: #e8ecf8;
          font-size: 0.9rem;
        }
        .sos-add-btn {
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
        .sos-add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }

        .sos-contacts-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .sos-contact-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px;
          background: rgba(7,9,14,0.5);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
          transition: all 0.3s;
          animation: sos-slideIn 0.3s ease-out backwards;
        }
        @keyframes sos-slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .sos-contact-card:hover { border-color: rgba(99,102,241,0.3); background: rgba(12,15,26,0.8); transform: translateY(-2px); }
        .sos-contact-info { display: flex; gap: 14px; align-items: center; }
        .sos-contact-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
        }
        .sos-contact-details { display: flex; flex-direction: column; gap: 4px; }
        .sos-contact-details strong { font-size: 0.9rem; color: #e8ecf8; }
        .sos-contact-relation { font-size: 0.7rem; color: #7a849c; }
        .sos-contact-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.7rem; color: #3d4459; }
        .sos-contact-delete {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }
        .sos-contact-delete:hover { background: rgba(239,68,68,0.2); transform: translateY(-1px); }

        .sos-tips { display: flex; gap: 16px; padding: 16px; background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.12); border-radius: 12px; margin-top: 8px; }
        .sos-tips-icon { font-size: 1.5rem; }
        .sos-tips-content strong { display: block; font-size: 0.85rem; color: #e8ecf8; margin-bottom: 4px; }
        .sos-tips-content p { font-size: 0.75rem; color: #7a849c; margin: 0; }

        .sos-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: sos-spin 0.6s linear infinite;
          margin-right: 8px;
        }
        @keyframes sos-spin { to { transform: rotate(360deg); } }
        .sos-btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: sos-spin 0.6s linear infinite;
        }

        .sos-empty { text-align: center; padding: 40px 20px; }
        .sos-empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
        .sos-empty h4 { font-size: 1rem; margin-bottom: 6px; color: #e8ecf8; }
        .sos-empty p { font-size: 0.8rem; color: #7a849c; }

        @media (max-width: 768px) {
          .sos-dashboard { padding: 16px; }
          .sos-tab { padding: 12px 20px; font-size: 0.85rem; }
          .sos-alert-card { padding: 24px; }
          .sos-alert-title { font-size: 1.3rem; }
          .sos-alert-btn { padding: 14px 32px; font-size: 0.9rem; }
          .sos-form-row { grid-template-columns: 1fr; }
          .sos-location-input { flex-direction: column; }
          .sos-location-btn { justify-content: center; }
          .sos-contact-card { flex-direction: column; align-items: flex-start; }
          .sos-contact-delete { align-self: flex-end; }
          .sos-toast { top: auto; bottom: 80px; right: 10px; left: 10px; }
        }
        @media (max-width: 480px) {
          .sos-tab { padding: 10px 16px; font-size: 0.75rem; }
        }
      `}</style>
    </div>
  );
}