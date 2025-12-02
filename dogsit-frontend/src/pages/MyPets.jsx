import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import "@/styles/pages/_myPets.scss";

export default function MyPets() {
  const { user, loading: authLoading } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchPets = async () => {
      try {
        const data = await api.getMyPets();
        setPets(data);
      } catch (err) {
        setError(err.message || "Failed to load pets");
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [user]);

  if (authLoading || loading) {
    return <div className="my-pets__loader">Loading your pets…</div>;
  }
  if (!user) {
    return <div className="my-pets__message">Please log in to see your pets.</div>;
  }
  if (error) {
    return <div className="my-pets__error">{error}</div>;
  }

  return (
    <section className="my-pets">
      <header className="my-pets__header">
        <h1 className="my-pets__title">My Pets</h1>
        <Link to="/pets/new" className="my-pets__add-btn">
          + Add Pet
        </Link>
      </header>

      {pets.length === 0 ? (
        <div className="my-pets__empty-state">
          <p>You don't have any pets yet.</p>
          <Link to="/pets/new" className="btn btn--primary">
            Add Your First Pet
          </Link>
        </div>
      ) : (
        <div className="my-pets__grid">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              to={`/my-pets/${pet.id}`}               // Secure private profile
              className="my-pets__card"
            >
              <div className="my-pets__card-image">
                {pet.images?.[0]?.url ? (
                  <img
                    src={pet.images[0].url}
                    alt={pet.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="my-pets__placeholder">
                    <span>No photo</span>
                  </div>
                )}
              </div>

              <div className="my-pets__card-content">
                <h3 className="my-pets__pet-name">{pet.name}</h3>

                <p className="my-pets__pet-info">
                  {pet.breed || "Unknown breed"} • {pet.sex}{" "}
                  {pet.age ? `• ${pet.age} yo` : "• Age unknown"}
                </p>

                {/* Verification badge */}
                {pet.kennel ? (
                  <div className="my-pets__kennel-badge">
                    <span className="badge badge--success">Verified</span>
                    <span className="my-pets__kennel-name">
                      {pet.kennel.name}
                    </span>
                  </div>
                ) : (
                  <div className="my-pets__kennel-badge">
                    <span className="badge badge--outline">
                      Not verified
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}