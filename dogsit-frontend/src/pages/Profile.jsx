import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/index";

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  margin: "0.5rem 0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "1rem",
};
const buttonStyle = {
  width: "100%",
  padding: "0.75rem",
  marginTop: "1rem",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "1rem",
};
const linkStyle = { color: "#1d4ed8", textDecoration: "underline", fontWeight: "500" };

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    dogBreed: "",
    servicesOffered: "",
    roles: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------------------------------
  // Load profile + roles
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (Number(id) !== currentUser.id) {
      setError("Access denied.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data);

        const editable = data.roles?.filter((r) =>
          ["owner", "sitter"].includes(r)
        ) || [];

        setForm({
          firstName: data.profile?.firstName || "",
          lastName: data.profile?.lastName || "",
          bio: data.profile?.bio || "",
          location: data.profile?.location || "",
          dogBreed: data.profile?.dogBreed || "",
          servicesOffered: data.profile?.servicesOffered || "",
          roles: editable,
        });
      } catch (err) {
        setError(err.message);
        if (err.message.includes("401")) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser?.id, navigate]);

  // -----------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        location: form.location,
        dogBreed: form.dogBreed,
        servicesOffered: form.servicesOffered,
      });

      await api.updateUserRoles(form.roles);

      alert("Profile & roles saved!");
    } catch (err) {
        setError(err.message || "Failed to save");
    } finally {
        setSaving(false);
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (error && !profile)
    return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  const editableRoles = [
    { value: "owner", label: "Owner" },
    { value: "sitter", label: "Sitter" },
  ];

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2>Edit Profile</h2>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>

      {/* ROLES — DIRECT FROM BACKEND, NO MAPPING */}
      <p>
        <strong>Roles:</strong>{" "}
        {profile.roles?.length
          ? profile.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")
          : "None"}
      </p>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} style={inputStyle} />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} style={inputStyle} />
        <textarea name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} style={{ ...inputStyle, height: "100px" }} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={inputStyle} />
        <input name="dogBreed" placeholder="Dog Breed" value={form.dogBreed} onChange={handleChange} style={inputStyle} />
        <input name="servicesOffered" placeholder="Services" value={form.servicesOffered} onChange={handleChange} style={inputStyle} />

        <div style={{ margin: "1rem 0" }}>
          <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
            Select your roles
          </p>
          {editableRoles.map(({ value, label }) => (
            <label
              key={value}
              style={{ display: "block", margin: "0.4rem 0", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={form.roles.includes(value)}
                onChange={() => toggleRole(value)}
                style={{ marginRight: "0.5rem" }}
              />
              {label}
            </label>
          ))}
        </div>

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <Link to="/" style={linkStyle}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}