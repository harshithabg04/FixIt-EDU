
const mongoose = require('mongoose');
const employeeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true  // ❌ previously true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  professorType: {
    type: String,
    enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'Others'],
    required: false
  },
  employeeCategory: {
    type: String,
    enum: ['Academic', 'Non-Academic'],
    required: false
  },
  department: {
    type: String,
    required: false
  },
  collegeIdCardUrl: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  otp: String,
  otpExpires: Date,
  verified: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });
module.exports=mongoose.model('Employee',employeeSchema);