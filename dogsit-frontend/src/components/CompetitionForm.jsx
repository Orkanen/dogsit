import { useEffect, useState } from "react";
import api from "@/api";
import "@/styles/components/_competitionForm.scss";

export default function CompetitionForm({ clubId: propClubId = null, ownedClubs = [], onSave = () => {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clubs, setClubs] = useState(Array.isArray(ownedClubs) ? ownedClubs.slice() : []);
  const [clubId, setClubId] = useState(propClubId || (ownedClubs[0]?.id ?? ""));
  const [startAt, setStartAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load club if needed
  useEffect(() => {
    let mounted = true;
    if (!propClubId || clubs.some(c => Number(c.id) === Number(propClubId))) return;

    const loadClub = async () => {
      try {
        const clubData = await api.club.getClubById(propClubId);
        if (mounted && clubData) {
          setClubs(prev => [...prev, { id: clubData.id, name: clubData.name }]);
          setClubId(clubData.id);
        }
      } catch (err) {
        console.error("Failed to load club", err);
      }
    };
    loadClub();
    return () => { mounted = false; };
  }, [propClubId, clubs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) return setMessage("Title is required");
    if (!clubId) return setMessage("Please select a club");

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        issuerType: "CLUB",
        issuerId: Number(clubId),
        startAt: startAt ? new Date(startAt).toISOString() : null,
      };

      await api.competitions.create(payload);
      setMessage("Competition created successfully!");

      if (onSave) await onSave();
      setTitle("");
      setDescription("");
      setStartAt("");
    } catch (err) {
      setMessage(err.message || "Failed to create competition");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="competition-form" onSubmit={handleSubmit}>
      <div className="competition-form__field">
        <label className="competition-form__label">Club</label>
        <select
          value={clubId || ""}
          onChange={(e) => setClubId(e.target.value)}
          className="competition-form__select"
        >
          <option value="">Select a club</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="competition-form__field">
        <label className="competition-form__label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="competition-form__input"
          placeholder="e.g. National Agility Championship 2025"
          required
        />
      </div>

      <div className="competition-form__field">
        <label className="competition-form__label">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="competition-form__textarea"
          rows={4}
          placeholder="Tell us about this competition..."
        />
      </div>

      <div className="competition-form__field">
        <label className="competition-form__label">Start Date & Time</label>
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="competition-form__input"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="competition-form__submit"
      >
        {submitting ? "Creating…" : "Create Competition"}
      </button>

      {message && (
        <p className={`competition-form__message ${message.includes("success") ? "competition-form__message--success" : "competition-form__message--error"}`}>
          {message}
        </p>
      )}
    </form>
  );
}