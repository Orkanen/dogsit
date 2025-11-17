import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function KennelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kennel, setKennel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [allKennels, myKennels] = await Promise.all([
          api.getKennels(),
          api.getMyKennels()
        ]);
        const found = allKennels.find(k => k.id === parseInt(id));
        if (!found) return setLoading(false);

        setKennel(found);
        const myKennel = myKennels.find(k => k.id === found.id);
        if (myKennel) {
          setIsOwner(myKennel.myRole === "OWNER");
          setIsMember(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRequest = async () => {
    if (confirm("Send membership request?")) {
      await api.requestKennelMembership(id, "I'd love to join your kennel!");
      alert("Request sent!");
      navigate("/kennel/dashboard");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!kennel) return <div>Kennel not found</div>;

  return (
    <div style={{ maxWidth: "64rem", margin: "2rem auto", padding: "2rem" }}>
      <Link to="/kennel" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
        ← All Kennels
      </Link>

      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "2rem 0" }}>
        {kennel.name}
      </h1>
      <p style={{ color: "#6b7280" }}>{kennel.location || "No location set"}</p>

      <div style={{ margin: "1.5rem 0", fontSize: "1.125rem" }}>
        <strong>{kennel.memberCount || 0}</strong> Members •{" "}
        <strong>{kennel.dogCount || 0}</strong> Dogs
      </div>

      {isOwner && (
        <div style={{ padding: "1rem", background: "#f0fdf4", borderRadius: "0.5rem", margin: "1rem 0" }}>
          You are the OWNER of this kennel
        </div>
      )}

      {!isMember && !isOwner && (
        <button
          onClick={handleRequest}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#1f2937",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "1rem"
          }}
        >
          Request to Join Kennel
        </button>
      )}
    </div>
  );
}