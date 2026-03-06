const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/* 🔒 TOKEN CHECK */
const protect = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

/* ================= PROFILE ================= */

/* GET PROFILE */
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

/* UPDATE PROFILE IMAGE */
router.put('/profile-image', protect, async (req, res) => {
  const { image } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage: image },
    { new: true }
  );

  res.json(user);
});

module.exports = router;
