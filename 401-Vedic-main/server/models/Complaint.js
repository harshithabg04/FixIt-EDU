const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registerNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Academic', 'Non-Academic'],
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedFaculty: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Employee', // or 'Faculty' if you have a separate model
  required: false
},

  updates:[{
    updatedBy:String,
    comment:String,
    date:{
      type: Date,
      default:Date.now
    }
  }]
  
});

module.exports = mongoose.model('Complaint', complaintSchema);