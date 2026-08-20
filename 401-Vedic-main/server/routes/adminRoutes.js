const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Complaint = require('../models/Complaint');
const sendEmail = require('../utils/mailer');
const {allowUserOrAdmin}=require('../middleware/auth')
// ✅ GET: All employees (needed for admin dashboard)
router.get('/all-employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error('Error fetching all employees:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: Pending employees
router.get('/employees/pending', async (req, res) => {
  try {
    const pendingEmployees = await Employee.find({ status: 'pending' });
    res.json(pendingEmployees);
  } catch (err) {
    console.error('Fetch pending employees error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT: Approve employee
router.put('/employees/:id/approve', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = 'approved';
    await employee.save();

    await sendEmail(
      employee.email,
      'Account Approved',
      `<p>Dear ${employee.username},</p>
       <p>Your account has been approved by the admin. You can now log in.</p><br/>
       <p>Regards,<br/>FixIt Team</p>`
    );

    res.json({ message: 'Employee approved successfully', employee });
  } catch (error) {
    console.error('Error approving employee:', error);
    res.status(500).json({ message: 'Error approving employee' });
  }
});

// ✅ PUT: Reject employee
router.put('/employees/:id/reject', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = 'rejected';
    await employee.save();

    await sendEmail(
      employee.email,
      'Account Rejected',
      `<p>Dear ${employee.username},</p>
       <p>Your account registration has been rejected by the admin.</p><br/>
       <p>Regards,<br/>FixIt Team</p>`
    );

    res.json({ message: 'Employee rejected successfully', employee });
  } catch (error) {
    console.error('Error rejecting employee:', error);
    res.status(500).json({ message: 'Error rejecting employee' });
  }
});

// ✅ GET: Complaint stats for dashboard summary cards
router.get('/employees/stats', async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pending = await Employee.countDocuments({ status: 'pending' });
    const approved = await Employee.countDocuments({ status: 'approved' });

    res.json({
      totalComplaints,
      pending,
      approved
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET: All complaints (optional usage)
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/employees/unnotified/count', async (req, res) => {
  try {
    const count = await Employee.countDocuments({ status: 'pending', notified: false });
    res.json({ count });
  } catch (err) {
    console.error('Error getting notification count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Complaint status summary (admin)
router.get('/complaints/status-summary', allowUserOrAdmin, async (req, res) => {
  try {
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const inProgress = await Complaint.countDocuments({ status: 'in-progress' });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });

    res.json({ pending, inProgress, resolved });
  } catch (err) {
    console.error('Error fetching complaint summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;