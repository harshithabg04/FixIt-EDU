const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const {
  authenticateUser,
  authenticateAdmin,
  authenticateEmployee,
  allowUserOrAdmin,
  allowUserOrAdminOrEmployee
} = require('../middleware/auth');

const getUploadMiddleware = require('../cloudConfig');
const upload = getUploadMiddleware('uploads/complaints');

// 🎯 Controllers
const {
  createAcademicComplaint,
  createNonAcademicComplaint,
  getComplaintCount,
  getMyComplaints,
  getAllComplaints,
  getComplaintsByDomain,
  updateComplaintStatus
} = require('../controllers/complaintController');

// ✅ Academic complaint
router.post('/academic', authenticateUser, upload.single('image'), createAcademicComplaint);

// ✅ Non-Academic complaint
router.post('/non-academic', authenticateUser, upload.single('image'), createNonAcademicComplaint);

// ✅ Get user's complaints
router.get('/my-complaints', authenticateUser, getMyComplaints);

// ✅ Get complaint count (admin/user)
router.get('/count', allowUserOrAdmin, getComplaintCount);

// ✅ Get all complaints (admin only)
router.get('/', authenticateAdmin, getAllComplaints);

// ✅ Get complaints based on domain (employee dashboard)
router.get('/by-domain', authenticateUser, getComplaintsByDomain);

// ✅ Update complaint status
router.put('/update-status/:id', authenticateUser, updateComplaintStatus);
// Summary of complaints by status
router.get('/status-summary', async (req, res) => {
  try {
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const inProgress = await Complaint.countDocuments({ status: 'in-progress' });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });

    res.json({
      pending,
      inProgress,
      resolved
    });
  } catch (error) {
    console.error('Error fetching complaint summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/complaints/:id/status', allowUserOrAdminOrEmployee, updateComplaintStatus);


module.exports = router;