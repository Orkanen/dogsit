const express = require('express');
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

router.get("/dashboard", authenticateToken, authorizeRoles("owner"),
  (req, res) => {
    res.json({ message: 'Welcome, owner!' });  }
);

module.exports = router;