import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/api";
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

    availability: [],
    pricePerDay: "",
    publicEmail: "",
    publicPhone: "",
    sitterDescription: "",

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
        const data = await api.profile.getProfile();
        setProfile(data);

        const currentRoles = data.roles || [];

        setForm({
          firstName: data.profile?.firstName || "",
          lastName: data.profile?.lastName || "",
          bio: data.profile?.bio || "",
          location: data.profile?.location || "",

          availability: Array.isArray(data.profile?.availability)
            ? data.profile.availability
            : [],

          pricePerDay: data.profile?.pricePerDay || "",
          publicEmail: data.profile?.publicEmail || "",
          publicPhone: data.profile?.publicPhone || "",
          sitterDescription: data.profile?.sitterDescription || "",

          roles: currentRoles.filter(r => ["owner", "sitter"].includes(r)),
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

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleRole = role => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const toggleAvailability = period => {
    if (!isSitter) return; // prevent changes when not sitter
    setForm(prev => {
      const current = prev.availability || [];
      return {
        ...prev,
        availability: current.includes(period)
          ? current.filter(p => p !== period)
          : [...current, period],
      };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await api.profile.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        location: form.location,

        availability: isSitter ? form.availability : [],
        pricePerDay: isSitter && form.pricePerDay ? Number(form.pricePerDay) : null,
        publicEmail: isSitter ? form.publicEmail || null : null,
        publicPhone: isSitter ? form.publicPhone || null : null,
        sitterDescription: isSitter ? form.sitterDescription || null : null,
      });

      await api.profile.updateUserRoles(form.roles);

      alert("Profile saved beautifully!");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const isSitter = form.roles.includes("sitter");
  const sitterFieldsDisabled = !isSitter;

  if (loading) return <div className="profile__loader">Loading your profile…</div>;
  if (error && !profile) return <div className="profile__error">{error}</div>;

  return (
    <section className="profile">
      <header className="profile__header">
        <h1 className="profile__title">Your Profile</h1>
        <Link to="/" className="profile__home-link">Back to Home</Link>
      </header>

      <div className="profile__card">
        <div className="profile__info">
          <p className="profile__email"><strong>Email (login):</strong> {profile?.email}</p>
          <p className="profile__roles">
            <strong>Current Roles:</strong>{" "}
            {profile?.roles?.length
              ? profile.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(" & ")
              : "None yet"}
          </p>
        </div>

        {error && <div className="profile__error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="profile__form">
          <div className="profile__fields">
            <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="profile__input" />
            <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className="profile__input" />
            <textarea name="bio" placeholder="Tell us about yourself…" value={form.bio} onChange={handleChange} rows={4} className="profile__textarea" />
            <input name="location" placeholder="City / Area" value={form.location} onChange={handleChange} className="profile__input" />
          </div>

          <div className="profile__roles-section">
            <h3 className="profile__roles-title">Your Role(s)</h3>
            <p className="profile__roles-subtitle">Select all that apply</p>

            <div className="profile__roles-list">
              <label className="profile__role-checkbox-label">
                <input type="checkbox" checked={form.roles.includes("owner")} onChange={() => toggleRole("owner")} />
                <span className="profile__role-custom-checkbox" />
                <span className="profile__role-text">Dog Owner</span>
              </label>

              <label className="profile__role-checkbox-label">
                <input type="checkbox" checked={form.roles.includes("sitter")} onChange={() => toggleRole("sitter")} />
                <span className="profile__role-custom-checkbox" />
                <span className="profile__role-text">Dog Sitter</span>
              </label>
            </div>
          </div>

          {/* SITTER FIELDS — always visible, grayed out when not sitter */}
          <div className={`profile__sitter-section ${sitterFieldsDisabled ? "profile__sitter-section--disabled" : ""}`}>
            <h3 className="profile__sitter-title">Sitter Information (public)</h3>

            <div className="profile__sitter-grid">
              {/* Left column: Availability */}
              <div className="profile__sitter-availability">
                <p className="profile__label">Available times</p>
                <div className="profile__availability-list">
                  {["MORNING", "DAY", "NIGHT"].map(period => (
                    <label key={period} className="profile__checkbox-label profile__checkbox-label--vertical">
                      <input
                        type="checkbox"
                        checked={form.availability.includes(period)}
                        onChange={() => toggleAvailability(period)}
                        disabled={sitterFieldsDisabled}
                      />
                      <span className="profile__custom-checkbox"></span>
                      <span>{period.charAt(0) + period.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Right column: Price, email, phone */}
              <div className="profile__sitter-details">
                <input
                  name="pricePerDay"
                  type="number"
                  placeholder="Price per day (€)"
                  value={form.pricePerDay}
                  onChange={handleChange}
                  disabled={sitterFieldsDisabled}
                  className="profile__input"
                />

                <input
                  name="publicEmail"
                  type="email"
                  placeholder="Public contact email (optional)"
                  value={form.publicEmail}
                  onChange={handleChange}
                  disabled={sitterFieldsDisabled}
                  className="profile__input"
                />

                <input
                  name="publicPhone"
                  placeholder="Public phone number (optional)"
                  value={form.publicPhone}
                  onChange={handleChange}
                  disabled={sitterFieldsDisabled}
                  className="profile__input"
                />
              </div>
            </div>

            {/* Full-width description below */}
            <textarea
              name="sitterDescription"
              placeholder={sitterFieldsDisabled ? "Become a sitter to add a description" : "Describe your sitting style, house rules, experience…"}
              value={form.sitterDescription}
              onChange={handleChange}
              rows={6}
              disabled={sitterFieldsDisabled}
              className="profile__textarea profile__textarea--full"
            />
          </div>

          <button type="submit" disabled={saving} className="profile__submit">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>
    </section>
  );
}