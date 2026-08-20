const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sendMail=require('../utils/mailer')
const employeeController = require('../controllers/employeeController');
const Complaint = require('../models/Complaint');
const User = require('../models/user'); 
const {authenticateEmployee}=require('../middleware/auth')
const Employee=require('../models/Employee')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// Auth Routes
router.post('/request-otp', employeeController.requestOtp);
router.post('/verify-otp', employeeController.verifyOtp);

// Signup/Login
router.post('/signup', upload.single('collegeIdCard'), employeeController.signup);
router.post('/login', employeeController.login);



// GET employee profile
router.get('/profile', authenticateEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/assigned-complaints', authenticateEmployee, async (req, res) => {
  try {
    let complaints = [];

    if (req.user.employeeCategory === 'Non-Academic') {
      // Show all Non-Academic complaints regardless of department
      complaints = await Complaint.find({ category: 'Non-Academic' });
    } else {
      // Academic: show only by department + category
      complaints = await Complaint.find({
        department: req.user.department,
        category: req.user.category
      });
    }

    res.json(complaints);
  } catch (err) {
    console.error('Assigned complaints fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update complaint status (Employee only)
router.put('/update-status/:id', authenticateEmployee,upload.single('image'), async (req, res) => {
  try {
    const { status, response } = req.body;
    const { id } = req.params;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.status === 'Resolved') {
      return res.status(403).json({ message: 'Already resolved. Cannot change status.' });
    }

    complaint.status = status;
    complaint.response = response || '';
    if (req.file) complaint.responseImage = req.file.path;

    await complaint.save();

    // Send email to user
    await sendMail( // <-- Changed from transporter.sendMail
    complaint.userEmail, // `to` parameter
    `FixIt - Complaint ${status}`, // `subject` parameter
    `Your complaint on ${complaint.domain} is marked as ${status}. Response: ${response || 'N/A'} - Regards\n FixIt team`,
    );

    res.json({ message: 'Complaint updated and user notified', complaint });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// routes/employeeRoutes.js
router.get('/faculty-list', async (req, res) => {
  try {
    const facultyList = await Employee.find({
      employeeCategory: 'Academic',
      status: 'approved'
    }).select('username _id department professorType');

    res.json(facultyList);
  } catch (err) {
    console.error('Error fetching faculty list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/employee/non-academic
// server/routes/facultyRoutes.js (or employeeRoutes.js)
router.get('/non-academic-faculty', async (req, res) => {
  try {
    const faculty = await Employee.find({
      employeeCategory: 'Non-academic',
      status: 'approved',
      verified: true
    });

    res.json(faculty);
  } catch (err) {
    console.error('Error fetching non-academic faculty:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/non-academic-complaints', authenticateEmployee, async (req, res) => {
  const complaints = await Complaint.find({ 
    assignedFaculty: req.user.id, 
    category: 'non-academic' 
  });
  res.json(complaints);
});




module.exports = router;