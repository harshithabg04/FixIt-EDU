const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getComplaintsByDomain, updateComplaintStatus } = require('../controllers/complaintController');
const { authenticateEmployee } = require('../middleware/auth');

// Employee Login (public)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const Employee = require('../models/Employee');
  try {
    const employee = await Employee.findOne({ username });
    if (!employee || employee.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username, domain: employee.domain }, 'fixit_secret_key', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee protected route: Get complaints by domain
router.get('/complaints', authenticateEmployee, getComplaintsByDomain);

// Employee protected route: Update complaint status
router.patch('/complaints/:id/status', authenticateEmployee, updateComplaintStatus);

module.exports = router;
// routes/employeeRoutes.js
router.post('/signup', async (req, res) => {
  const { username, email, password, domain } = req.body;

  const existing = await Employee.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const employee = new Employee({ username, email, password, domain, status: "pending" });
  await employee.save();

  res.json({ message: "Request submitted. Wait for admin approval." });
});
