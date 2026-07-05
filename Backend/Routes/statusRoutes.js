const express = require('express');
const router = express.Router();
const Status = require('../models/Status');

router.post('/add', async (req, res) => {
  try {
    const { userId, username, vibeBadge, statusText } = req.body;
    if (!userId || !username || !statusText) return res.status(400).json({ error: "Missing required fields" });

    const newStatus = new Status({ userId, username, vibeBadge, statusText });
    const savedStatus = await newStatus.save();
    res.status(201).json(savedStatus);
  } catch (err) {
    res.status(500).json({ error: "Server error saving status" });
  }
});

router.get('/feed', async (req, res) => {
  try {
    const feed = await Status.find().sort({ createdAt: -1 });
    res.status(200).json(feed);
  } catch (err) {
    res.status(500).json({ error: "Server error fetching feed" });
  }
});

module.exports = router;