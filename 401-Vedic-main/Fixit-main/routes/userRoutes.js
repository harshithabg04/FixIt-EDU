// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../cloudConfig');
const Complaint = require('../models/Complaint');

// Submit complaint (with photo upload)
router.post('/complaints', upload.single('photo'), async (req, res) => {
  try {
    const { title, description, location, userName, userEmail, domain } = req.body;
    if (!domain) return res.status(400).json({ message: 'Domain is required' });

    let photoUrl = '';
    if (req.file) photoUrl = req.file.path;

    const complaint = new Complaint({
      title,
      description,
      location,
      userName,
      userEmail,
      domain,
      photoUrl,
      status: 'Open',
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error });
  }
});

// Get complaints by user email
router.get('/complaints/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email query param required' });
  try {
    const complaints = await Complaint.find({ userEmail: email });
    res.json(complaints);
  } catch {
    res.status(500).json({ message: 'Error fetching user complaints' });
  }
});

module.exports = router;
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});
