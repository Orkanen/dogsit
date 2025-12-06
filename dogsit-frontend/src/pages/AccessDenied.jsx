// src/pages/AccessDenied.jsx
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to view this page.
        </p>
        <div className="space-x-4">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </Link>
          <Link
            to="/profile/you" // or whatever your profile route is
            className="inline-block px-6 py-3 border border-gray-300 rounded hover:bg-gray-50"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}