const express = require('express');
const { authenticateToken, andRestrictToSelf} = require("../middleware/auth");
const router = express.Router();

router.get("/:id", authenticateToken, andRestrictToSelf, (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, email: req.user.email });
  }
);

module.exports = router;