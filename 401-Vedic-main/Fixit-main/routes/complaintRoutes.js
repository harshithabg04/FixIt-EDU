const express = require('express');
const router = express.Router();
const upload = require('../cloudConfig');
const { createComplaint } = require('../controllers/complaintController');

// Complaint submission (public)
router.post('/', upload.single('photo'), createComplaint);

module.exports = router;
