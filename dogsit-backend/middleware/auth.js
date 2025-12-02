const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Access token required" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ error: "Invalid token format" });
  }

  const token = authHeader.slice(7).trim(); // ← THIS IS THE KEY LINE

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("[Auth] Token verification failed:", err.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: parseInt(user.id, 10),
      ...user,
    };

    next();
  });
}

function andRestrictToSelf(req, res, next) {
  if (req.user?.id == req.params.id) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized: can only access your own profile" });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, andRestrictToSelf };