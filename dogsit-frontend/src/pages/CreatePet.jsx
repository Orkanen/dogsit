import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

export default function CreatePet() {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      let imageId = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("alt", `${form.name}'s photo`);
        const img = await api.uploadImage(fd);
        imageId = img.id;
      }

      const pet = await api.createPet({
        ...form,
        age: form.age ? +form.age : null,
      });

      if (imageId) await api.attachImageToPet(pet.id, imageId);

      navigate(`/pets/${pet.id}`);
    } catch (err) {
      setError(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2>Add New Pet</h2>

      {preview && (
        <div style={{ marginBottom: "1rem", textAlign: "center" }}>
          <img
            src={preview}
            alt="Preview"
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
        Photo
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          style={{ display: "block", marginTop: "0.25rem" }}
        />
      </label>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={inputStyle} required />
        <select name="species" value={form.species} onChange={handleChange} style={inputStyle}>
          <option>Dog</option>
          <option>Cat</option>
          <option>Rabbit</option>
          <option>Bird</option>
          <option>Other</option>
        </select>
        <input name="breed" placeholder="Breed" value={form.breed} onChange={handleChange} style={inputStyle} />
        <input name="color" placeholder="Color" value={form.color} onChange={handleChange} style={inputStyle} />
        <div style={{ margin: "0.5rem 0" }}>
          <label style={{ marginRight: "1rem" }}>
            <input type="radio" name="sex" value="MALE" checked={form.sex === "MALE"} onChange={handleChange} /> Male
          </label>
          <label>
            <input type="radio" name="sex" value="FEMALE" checked={form.sex === "FEMALE"} onChange={handleChange} /> Female
          </label>
        </div>
        <input name="age" type="number" placeholder="Age (years)" value={form.age} onChange={handleChange} style={inputStyle} />

        <button type="submit" style={buttonStyle} disabled={saving}>
          {saving ? "Creating..." : "Create Pet"}
        </button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <Link to="/pets/my" style={linkStyle}>
          Back to My Pets
        </Link>
      </div>
    </div>
  );
}