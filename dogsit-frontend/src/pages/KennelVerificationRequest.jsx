import { useState } from "react";
import api from "@/api";

export default function KennelVerificationRequest({ petId, currentKennelId, onSuccess }) {
  const [selectedKennel, setSelectedKennel] = useState("");
  const [kennels, setKennels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadKennels = async () => {
    try {
      const list = await api.kennel.getKennels();
      // Exclude the kennel the pet is already linked to
      setKennels(list.filter(k => k.id !== currentKennelId));
    } catch (err) {
      alert("Failed to load kennels");
    }
  };

  const handleRequest = async () => {
    if (!selectedKennel) return alert("Please select a kennel");

    if (!confirm(`Send verification request to "${kennels.find(k => k.id == selectedKennel)?.name}"?`)) return;

    try {
      setLoading(true);
      await api.kennels.requestPetLink(Number(selectedKennel), petId, message.trim());
      alert("Request sent! The kennel owner will review it.");
      onSuccess?.();
    } catch (err) {
      alert(err.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  if (currentKennelId) {
    return (
      <div className="kennel-verification">
        <p>This pet is already officially verified by a kennel.</p>
      </div>
    );
  }

  return (
    <div className="kennel-verification">
      <h3>Request Official Kennel Verification</h3>
      <p>
        If this dog was born in or registered with a kennel, you can request an official link.
        The kennel owner must approve it.
      </p>

      <button
        type="button"
        onClick={loadKennels}
        className="kennel-verification__trigger"
      >
        + Request Verification from a Kennel
      </button>

      {kennels.length > 0 && (
        <div className="kennel-verification__form">
          <select
            value={selectedKennel}
            onChange={(e) => setSelectedKennel(e.target.value)}
            className="kennel-verification__select"
          >
            <option value="">Select a kennel…</option>
            {kennels.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.location || "No location"})
              </option>
            ))}
          </select>

          <textarea
            placeholder="Optional message to the kennel owner (e.g. litter date, parents, etc.)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="kennel-verification__message"
          />

          <button
            type="button"
            onClick={handleRequest}
            disabled={loading || !selectedKennel}
            className="kennel-verification__submit"
          >
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      )}
    </div>
  );
}