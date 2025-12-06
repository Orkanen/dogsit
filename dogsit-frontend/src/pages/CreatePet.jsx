import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_createPet.scss";

export default function CreatePet() {
  const navigate = useNavigate();

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
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kennels, setKennels] = useState([]);
  const [myKennels, setMyKennels] = useState([]);

  // Load kennels on mount
  useEffect(() => {
    const loadKennels = async () => {
      try {
        const [all, mine] = await Promise.all([
          api.kennel.getKennels(),
          api.kenel.getMyKennels(),
        ]);
        setKennels(all);
        setMyKennels(mine.map(k => k.id));
      } catch (err) {
        console.error("Failed to load kennels");
      }
    };
    loadKennels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
        const img = await api.image.uploadImage(fd);
        imageId = img.id;
      }

      const petData = {
        ...form,
        age: form.age ? Number(form.age) : null,
        kennelId: form.kennelId ? Number(form.kennelId) : null,
      };

      // CASE 1: User owns the selected kennel → auto-verify (no request needed)
      if (form.kennelId && myKennels.includes(Number(form.kennelId))) {
        const pet = await api.pet.createPet(petData);
        if (imageId) await api.image.attachImageToPet(pet.id, imageId);
        navigate(`/pets/${pet.id}`);
        return;
      }

      // CASE 2: Selected a kennel they don't own → create pet + auto-send request
      if (form.kennelId) {
        const pet = await api.pet.createPet({ ...petData, kennelId: null });
        if (imageId) await api.image.attachImageToPet(pet.id, imageId);

        try {
          await api.kennel.requestPetLink(
            Number(form.kennelId),
            pet.id,
            `This pet (${form.name}) was born in your kennel. Please verify.`
          );
          alert("Pet created! Verification request sent to the kennel.");
        } catch (reqErr) {
          alert("Pet created, but failed to send verification request. You can request it later from Edit Pet.");
        }
        navigate(`/pets/${pet.id}`);
        return;
      }

      // CASE 3: No kennel selected → normal creation
      const pet = await api.pet.createPet(petData);
      if (imageId) await api.image.attachImageToPet(pet.id, imageId);
      navigate(`/pets/${pet.id}`);

    } catch (err) {
      setError(err.message || "Failed to create pet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="create-pet">
      <header className="create-pet__header">
        <h1 className="create-pet__title">Add New Pet</h1>
        <Link to="/pets/my" className="create-pet__back">Back to My Pets</Link>
      </header>

      <form onSubmit={handleSubmit} className="create-pet__form">
        {/* Image */}
        <div className="create-pet__image-section">
          {preview ? (
            <img src={preview} alt="Preview" className="create-pet__preview" />
          ) : (
            <div className="create-pet__placeholder">Pet photo</div>
          )}
          <label className="create-pet__image-label">
            Upload Photo
            <input type="file" accept="image/*" onChange={handleImage} />
          </label>
        </div>

        {error && <p className="create-pet__error">{error}</p>}

        <div className="create-pet__fields">
          <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} required className="create-pet__input" />

          <select name="species" value={form.species} onChange={handleChange} className="create-pet__input create-pet__select">
            <option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option>
          </select>

          <input name="breed" placeholder="Breed" value={form.breed} onChange={handleChange} className="create-pet__input" />
          <input name="color" placeholder="Color" value={form.color} onChange={handleChange} className="create-pet__input" />

          <div className="create-pet__radio-group">
            <label className="create-pet__radio">
              <input type="radio" name="sex" value="MALE" checked={form.sex === "MALE"} onChange={handleChange} />
              <span>Male</span>
            </label>
            <label className="create-pet__radio">
              <input type="radio" name="sex" value="FEMALE" checked={form.sex === "FEMALE"} onChange={handleChange} />
              <span>Female</span>
            </label>
          </div>

          <input name="age" type="number" placeholder="Age ( strument)" value={form.age} onChange={handleChange} className="create-pet__input" min="0" max="30" />

          {/* KENNEL OF ORIGIN – Smart Dropdown */}
          <div className="create-pet__kennel-section">
            <label className="create-pet__label">
              <strong>Kennel of Origin (Optional)</strong><br />
              <span className="create-pet__hint">
                Was this pet born in a registered kennel?
              </span>
            </label>

            <select
              name="kennelId"
              value={form.kennelId}
              onChange={handleChange}
              className="create-pet__input create-pet__select"
            >
              <option value="">— Not from a registered kennel —</option>
              {kennels.map(k => {
                const isMine = myKennels.includes(k.id);
                return (
                  <option key={k.id} value={k.id}>
                    {k.name} {k.location && `(${k.location})`}
                    {isMine && " ← Your Kennel"}
                  </option>
                );
              })}
            </select>

            {form.kennelId && myKennels.includes(Number(form.kennelId)) && (
              <p className="create-pet__auto-verify">
                This pet will be automatically verified (you own this kennel)
              </p>
            )}
            {form.kennelId && !myKennels.includes(Number(form.kennelId)) && (
              <p className="create-pet__pending-verify">
                A verification request will be sent to the kennel owner
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="create-pet__submit">
          {saving ? "Creating…" : "Create Pet"}
        </button>
      </form>
    </section>
  );
}