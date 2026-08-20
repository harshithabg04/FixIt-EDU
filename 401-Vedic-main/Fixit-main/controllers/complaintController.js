// controllers/complaintController.js
const Complaint = require('../models/Complaint');

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, location, userName, userEmail, domain } = req.body;
    let photoUrl = '';
    if (req.file) photoUrl = req.file.path;

    const complaint = new Complaint({
      title,
      description,
      location,
      userName,
      userEmail,
      domain,
      photoUrl,
      status: 'Open',
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch {
    res.status(500).json({ message: 'Error fetching complaints' });
  }
};

exports.getComplaintsByDomain = async (req, res) => {
  try {
    const complaints = await Complaint.find({ domain: req.user.domain });
    res.json(complaints);
  } catch {
    res.status(500).json({ message: 'Error fetching domain complaints' });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.domain !== req.user.domain) {
      return res.status(403).json({ message: 'Unauthorized domain update' });
    }

    complaint.status = status;
    await complaint.save();
    res.json(complaint);
  } catch {
    res.status(500).json({ message: 'Status update failed' });
  }
};
