import { Link } from "react-router-dom";

const linkStyle = { color: "#1d4ed8", textDecoration: "underline", fontWeight: "500" };

export default function Home() {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "null") : null;

  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Dog/Sit</h1>
      <p style={{ marginBottom: "2rem", color: "#4b5563" }}>
        Find the perfect sitter for your dog.
      </p>

      {user ? (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link to="/kennels" style={linkStyle}>Browse Kennels</Link>
          <Link to="/matches" style={linkStyle}>My Matches</Link>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/register" style={linkStyle}>Register</Link>
        </div>
      )}
    </div>
  );
}