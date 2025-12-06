import { useState } from "react";
import api from "@/api";

export default function ClubForm({ onCreate }) {
  const [name, setName] = useState("");
  const [membershipType, setMembershipType] = useState("OPEN");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    setSubmitting(true);
    try {
      const created = await api.club.createClub({ name: name.trim(), membershipType });
      setName("");
      if (onCreate) onCreate(created);
    } catch (err) {
      console.error("Create club failed", err);
      setError(err?.response?.data?.error || err.message || "Failed to create club");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="club-form" onSubmit={handleCreate}>
      <div className="field">
        <label>Club name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. City Agility Club" />
      </div>

      <div className="field">
        <label>Membership type</label>
        <select value={membershipType} onChange={(e) => setMembershipType(e.target.value)}>
          <option value="OPEN">Open</option>
          <option value="INVITE">Invite-only</option>
        </select>
      </div>

      {error && <div className="text-error">{error}</div>}

      <button type="submit" disabled={submitting} className="btn">
        {submitting ? "Creating…" : "Create Club"}
      </button>
    </form>
  );
}
