import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api";

export default function ClubCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Club name is required");

    setLoading(true);
    try {
      const club = await api.club.createClub({
        name: form.name.trim(),
        location: form.location.trim() || null,
      });

      alert("Club created! You are now the OWNER.");
      navigate(`/club/${club.id}`);
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to create club");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "48rem", margin: "2rem auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Create Your Club
        </h1>
        <p style={{ color: "#6b7280" }}>Build your community.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            Club Name <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Nordic Working Dog Club"
            required
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>
            Location (City, Country)
          </label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Stockholm, Sweden"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 2rem",
              background: loading ? "#9ca3af" : "#1f2937",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Creating..." : "Create Club"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "0.75rem 2rem",
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
