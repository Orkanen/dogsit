import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function CreatePet() {
  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    color: "",
    sex: "MALE",
    age: "",
    kennelId: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    setImageFile(e.target.files[0]);
  };

  // ← MUST BE async
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);

    try {
      let imageId = null;

      // 1. Upload image
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("alt", `${form.name}'s photo`);

        const img = await api.uploadImage(formData);
        imageId = img.id;
      }

      // 2. Create pet
      const pet = await api.createPet({
        ...form,
        age: form.age ? parseInt(form.age) : null,
        kennelId: form.kennelId ? parseInt(form.kennelId) : null,
      });

      // 3. Attach image
      if (imageId) {
        await api.attachImageToPet(pet.id, imageId);
      }

      navigate(`/pets/${pet.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Pet</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <select
          name="species"
          value={form.species}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option>Dog</option>
          <option>Cat</option>
          <option>Rabbit</option>
          <option>Other</option>
        </select>

        <input
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          name="color"
          placeholder="Color"
          value={form.color}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <select
          name="sex"
          value={form.sex}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <input
          name="age"
          type="number"
          placeholder="Age (years)"
          value={form.age}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          name="kennelId"
          type="number"
          placeholder="Kennel ID (optional)"
          value={form.kennelId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div>
          <label className="block mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Saving..." : "Create Pet"}
        </button>
      </form>
    </div>
  );
}