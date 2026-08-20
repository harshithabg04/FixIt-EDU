// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'fixit_secret_key';
const Employee = require('../models/Employee');

const adminUser = {
  username: 'admin',
  password: 'admin123'
};

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Get Pending Employee Requests
router.get('/pending-employees', async (req, res) => {
  try {
    const pendingEmployees = await Employee.find({ status: 'pending' });
    res.json(pendingEmployees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending employees' });
  }
});

// Approve Employee
router.patch('/approve-employee/:id', async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ message: 'Employee approved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve employee' });
  }
});

// Reject/Delete Employee
router.delete('/reject-employee/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee rejected and removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject employee' });
  }
});

module.exports = router;
