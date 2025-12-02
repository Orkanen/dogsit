import { Link } from "react-router-dom";
import "@/styles/pages/_home.scss";

export default function Home() {
  const token = localStorage.getItem("token");

  return (
    <div className="home-page">
      <h1 className="home-page__title">Dog/Sit</h1>
      <p className="home-page__subtitle">
        Find the perfect sitter for your dog — or become one.
      </p>

      <div className="home-page__actions">
        {token ? (
          <>
            <Link to="/kennels">Browse Kennels</Link>
            <Link to="/matches">My Matches</Link>
            <Link to="/sitters">Find Sitters</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}