import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/index";
import { useAuth } from "../context/AuthContext";
import "@/styles/pages/_profile.scss";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (Number(id) !== user.id) {
      setError("You can only edit your own profile.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data);

        const editableRoles = data.roles?.filter((r) =>
          ["owner", "sitter"].includes(r)
        ) || [];

        setForm({
          firstName: data.profile?.firstName || "",
          lastName: data.profile?.lastName || "",
          bio: data.profile?.bio || "",
          location: data.profile?.location || "",
          dogBreed: data.profile?.dogBreed || "",
          servicesOffered: data.profile?.servicesOffered || "",
          roles: editableRoles,
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
        if (err.message?.includes("401")) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user?.id, navigate]);

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

      alert("Profile saved beautifully!");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile__loader">Loading your profile…</div>;
  if (error && !profile) return <div className="profile__error">{error}</div>;

  const roles = [
    { value: "owner", label: "Dog Owner", },
    { value: "sitter", label: "Dog Sitter", },
  ];

  return (
    <section className="profile">
      <header className="profile__header">
        <h1 className="profile__title">Your Profile</h1>
        <Link to="/" className="profile__home-link">
          Back to Home
        </Link>
      </header>

      <div className="profile__card">
        <div className="profile__info">
          <p className="profile__email">
            <strong>Email:</strong> {profile?.email}
          </p>
          <p className="profile__roles">
            <strong>Current Roles:</strong>{" "}
            {profile?.roles?.length
              ? profile.roles
                  .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
                  .join(" & ")
              : "None yet"}
          </p>
        </div>

        {error && <div className="profile__error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="profile__form">
          <div className="profile__fields">
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="profile__input"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="profile__input"
            />
            <textarea
              name="bio"
              placeholder="Tell us about yourself and your love for dogs…"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="profile__textarea"
            />
            <input
              name="location"
              placeholder="Your city or area"
              value={form.location}
              onChange={handleChange}
              className="profile__input"
            />
            <input
              name="dogBreed"
              placeholder="Your dog's breed (if you're an owner)"
              value={form.dogBreed}
              onChange={handleChange}
              className="profile__input"
            />
            <input
              name="servicesOffered"
              placeholder="Services you offer (if you're a sitter)"
              value={form.servicesOffered}
              onChange={handleChange}
              className="profile__input"
            />
          </div>

          <div className="profile__roles-section">
            <h3 className="profile__roles-title">Your Role(s)</h3>
            <p className="profile__roles-subtitle">
              Select all that apply
            </p>

            <div className="profile__roles-list">
              <label className="profile__role-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.roles.includes("owner")}
                  onChange={() => toggleRole("owner")}
                />
                <span className="profile__role-custom-checkbox" />
                <span className="profile__role-text">Dog Owner</span>
              </label>

              <label className="profile__role-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.roles.includes("sitter")}
                  onChange={() => toggleRole("sitter")}
                />
                <span className="profile__role-custom-checkbox" />
                <span className="profile__role-text">Dog Sitter</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={saving} className="profile__submit">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>
    </section>
  );
}