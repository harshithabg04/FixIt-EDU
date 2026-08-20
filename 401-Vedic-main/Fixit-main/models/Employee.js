const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  domain: String,
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Employee', employeeSchema);
