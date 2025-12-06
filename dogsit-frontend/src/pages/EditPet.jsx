import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/api";
import "@/styles/pages/_editPet.scss";

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

  // Kennel verification state
  const [kennels, setKennels] = useState([]);
  const [petKennelId, setPetKennelId] = useState(null); // null = not verified
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [selectedKennelId, setSelectedKennelId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  // Load pet data
  useEffect(() => {
    const fetchPet = async () => {
      try {
        const pet = await api.pet.getPet(id);
        setForm({
          name: pet.name || "",
          species: pet.species || "Dog",
          breed: pet.breed || "",
          color: pet.color || "",
          sex: pet.sex || "MALE",
          age: pet.age || "",
        });
        setPreview(pet.images?.[0]?.url || null);
        setPetKennelId(pet.kennelId || null); // Track current kennel
      } catch (err) {
        setError(err.message || "Failed to load pet");
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  // Load kennels + check for pending request
  useEffect(() => {
    const loadVerificationData = async () => {
      try {
        const [allKennels, requests] = await Promise.all([
          api.kennel.getKennels(),
          api.kennel.getKennelRequests(), // Only returns requests for kennels you own
        ]);

        setKennels(allKennels);

        // Check if this pet has a pending request (from any kennel)
        const pending = requests.find(
          (r) => r.type === "PET_LINK" && r.pet.id === parseInt(id) && r.status === "PENDING"
        );
        if (pending) {
          setHasPendingRequest(true);
        }
      } catch (err) {
        console.error("Failed to load kennel data:", err);
      }
    };

    if (!loading) {
      loadVerificationData();
    }
  }, [id, loading]);

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
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("alt", `${form.name}'s photo`);
        const img = await api.image.uploadImage(formData);
        imageId = img.id;
      }

      await api.pet.updatePet(id, {
        ...form,
        age: form.age ? Number(form.age) : null,
      });

      if (imageId) {
        await api.image.attachImageToPet(id, imageId);
      }

      navigate(`/pets/${id}`);
    } catch (err) {
      setError(err.message || "Failed to save pet");
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationRequest = async () => {
    if (!selectedKennelId) return;
    if (!confirm("Send verification request to this kennel?")) return;

    setRequestLoading(true);
    setRequestError("");

    try {
      await api.kennel.requestPetLink(
        Number(selectedKennelId),
        Number(id),
        `Please verify that ${form.name} was born/registered in your kennel.`
      );
      setHasPendingRequest(true);
      alert("Verification request sent! The kennel owner will review it.");
      setSelectedKennelId("");
    } catch (err) {
      setRequestError(err.message || "Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return <div className="edit-pet__loader">Loading pet…</div>;
  if (error && !preview) return <div className="edit-pet__error">Failed to load pet</div>;

  return (
    <section className="edit-pet">
      <header className="edit-pet__header">
        <h1 className="edit-pet__title">Edit Pet</h1>
        <Link to={`/pets/${id}`} className="edit-pet__back">
          Back to Pet
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="edit-pet__form">
        {/* Image Upload */}
        <div className="edit-pet__image-section">
          {preview ? (
            <img src={preview} alt="Pet preview" className="edit-pet__preview" />
          ) : (
            <div className="edit-pet__placeholder">No photo</div>
          )}
          <label className="edit-pet__image-label">
            Change Photo
            <input type="file" accept="image/*" onChange={handleImage} />
          </label>
        </div>

        {error && <p className="edit-pet__error-msg">{error}</p>}

        {/* Form Fields */}
        <div className="edit-pet__fields">
          <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} required className="edit-pet__input" />
          <select name="species" value={form.species} onChange={handleChange} className="edit-pet__input edit-pet__select">
            <option>Dog</option>
            <option>Cat</option>
            <option>Rabbit</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
          <input name="breed" placeholder="Breed" value={form.breed} onChange={handleChange} className="edit-pet__input" />
          <input name="color" placeholder="Color" value={form.color} onChange={handleChange} className="edit-pet__input" />
          <div className="edit-pet__radio-group">
            <label className="edit-pet__radio">
              <input type="radio" name="sex" value="MALE" checked={form.sex === "MALE"} onChange={handleChange} />
              <span>Male</span>
            </label>
            <label className="edit-pet__radio">
              <input type="radio" name="sex" value="FEMALE" checked={form.sex === "FEMALE"} onChange={handleChange} />
              <span>Female</span>
            </label>
          </div>
          <input name="age" type="number" placeholder="Age (years)" value={form.age} onChange={handleChange} className="edit-pet__input" min="0" max="30" />
        </div>

        {/* Kennel Verification Section */}
        <div className="edit-pet__kennel-verification">
          <h3>Official Kennel of Origin</h3>

          {petKennelId ? (
            <p className="edit-pet__status success">
              This pet is officially verified and registered with a kennel.
            </p>
          ) : hasPendingRequest ? (
            <p className="edit-pet__status warning">
              Verification request pending… The kennel owner is reviewing.
            </p>
          ) : (
            <>
              <p>
                Was <strong>{form.name || "this pet"}</strong> born in a registered kennel? 
                Select the kennel below to request official verification.
              </p>

              <select
                value={selectedKennelId}
                onChange={(e) => setSelectedKennelId(e.target.value)}
                className="edit-pet__input edit-pet__select"
                disabled={requestLoading}
              >
                <option value="">Select kennel of origin…</option>
                {kennels.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} {k.location ? `(${k.location})` : ""}
                  </option>
                ))}
              </select>

              {selectedKennelId && (
                <button
                  type="button"
                  onClick={handleVerificationRequest}
                  disabled={requestLoading}
                  className="edit-pet__verification-btn"
                >
                  {requestLoading ? "Sending Request…" : "Request Official Verification"}
                </button>
              )}

              {requestError && <p className="edit-pet__error-msg">{requestError}</p>}
            </>
          )}
        </div>

        <button type="submit" disabled={saving} className="edit-pet__submit">
          {saving ? "Saving…" : "Save Pet"}
        </button>
      </form>
    </section>
  );
}