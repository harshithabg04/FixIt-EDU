const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  domain: String,
  userName: String,
  userEmail: String,
  photoUrl: String,
  status: { type: String, default: 'Open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
