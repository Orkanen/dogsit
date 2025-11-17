import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

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

export default function EditPet() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    color: "",
    sex: "MALE",
    age: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------------------------------
  // Load existing pet
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchPet = async () => {
      try {
        const pet = await api.getPet(id);
        setForm({
          name: pet.name,
          species: pet.species,
          breed: pet.breed || "",
          color: pet.color || "",
          sex: pet.sex,
          age: pet.age || "",
        });
        setPreview(pet.images?.[0]?.url || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  // -----------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // 1. Upload new image (if any)
      let imageId = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("alt", `${form.name}'s photo`);
        const img = await api.uploadImage(formData);
        imageId = img.id;
      }

      // 2. Update pet data
      await api.updatePet(id, {
        ...form,
        age: form.age ? +form.age : null,
      });

      // 3. Attach image (if uploaded)
      if (imageId) {
        await api.attachImageToPet(id, imageId);
      }

      navigate(`/pets/${id}`);
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
  if (error && !preview) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2>Edit Pet</h2>

      {/* Image preview + upload */}
      {preview && (
        <div style={{ marginBottom: "1rem", textAlign: "center" }}>
          <img
            src={preview}
            alt="Pet"
            style={{
              maxWidth: "150px",
              maxHeight: "150px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        </div>
      )}
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Change Photo
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          style={{ display: "block", marginTop: "0.25rem" }}
        />
      </label>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
          required
        />
        <select
          name="species"
          value={form.species}
          onChange={handleChange}
          style={inputStyle}
        >
          <option>Dog</option>
          <option>Cat</option>
          <option>Rabbit</option>
          <option>Bird</option>
          <option>Other</option>
        </select>
        <input
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="color"
          placeholder="Color"
          value={form.color}
          onChange={handleChange}
          style={inputStyle}
        />
        <div style={{ margin: "0.5rem 0" }}>
          <label style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              name="sex"
              value="MALE"
              checked={form.sex === "MALE"}
              onChange={handleChange}
            />{" "}
            Male
          </label>
          <label>
            <input
              type="radio"
              name="sex"
              value="FEMALE"
              checked={form.sex === "FEMALE"}
              onChange={handleChange}
            />{" "}
            Female
          </label>
        </div>
        <input
          name="age"
          type="number"
          placeholder="Age (years)"
          value={form.age}
          onChange={handleChange}
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? "Saving..." : "Save Pet"}
        </button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <Link to={`/pets/${id}`} style={linkStyle}>
          Back to Pet
        </Link>
      </div>
    </div>
  );
}