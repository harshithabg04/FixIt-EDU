const Employee = require('../models/Employee');
const Complaint = require('../models/Complaint');
const Otp = require('../models/otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const sendEmail = require('../utils/mailer');
const SECRET_KEY = process.env.JWT_SECRET; // replace in production with process.env.SECRET_KEY

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akashalpha55@gmail.com',
    pass: 'npjg haxv tdfk bvlu' // use your Gmail app password
  }
});

// ✅ REQUEST OTP
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: 'akashalpha55@gmail.com',
      to: email,
      subject: 'FixIt - OTP Verification',
      text:` Your OTP is: ${otp}\n Best Regards - FixIt team`
    });

    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

// ✅ VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const entry = await Otp.findOne({ email });
    if (!entry) return res.status(400).json({ message: 'OTP not found. Request again.' });

    if (entry.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await Otp.deleteOne({ email });
    
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'OTP verification failed.' });
  }
};

// ✅ SIGNUP (After OTP Verified)
exports.signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      department,
      employeeCategory,
      professorType
    } = req.body;

    const collegeIdCardUrl = req.file?.filename;

    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      username,
      email,
      password: hashedPassword,
      department,
      employeeCategory,
      professorType,
      collegeIdCardUrl,
      status: 'pending',
      verified: true // Marked true since OTP done before
    });
    await employee.save();

    await transporter.sendMail({
      from: 'akashalpha55@gmail.com',
      to: email,
      subject: 'FixIt - Registration Received',
      text:` Hi ${username},\n\nWe received your registration. Please wait for admin approval.\n\n- FixIt Team`
    });
    // Send notification email to admin
await sendEmail(
  'akashalpha55@gmail.com', // Replace with actual admin email
  'New Employee Signup Request',
  `<p>Hello Admin,</p>
   <p>A new employee has signed up and is awaiting your approval:</p>
   <ul>
     <li><strong>Username:</strong> ${employee.username}</li>
     <li><strong>Email:</strong> ${employee.email}</li>
     <li><strong>Department:</strong> ${employee.department}</li>
   </ul>
   <p>Please review the request in your admin dashboard.</p>
   <br/>
   <p>Regards,<br/>Fixit System</p>`
);
    res.status(201).json({ message: 'Signup successful. Await admin approval.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed.' });
  }
};

// ✅ 
function captalizeFirst(str){
      return str.charAt(0).toUpperCase()+str.slice(1).toLowerCase();
    }
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

    if (!employee) return res.status(401).json({ message: 'Invalid credentials' });

    // ❌ Remove this check:
    // if (!employee.verified) return res.status(401).json({ message: 'Please verify OTP before login' });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (employee.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }

    const token = jwt.sign({
      userId: employee._id,
      email: employee.email,
      username: employee.username,
      category: captalizeFirst(employee.employeeCategory),
      department: employee.department
    }, SECRET_KEY, { expiresIn: '2h' });
    console.log('Token Payload:', {
  userId: employee._id,
  email: employee.email,
  username: employee.username,
  category: captalizeFirst(employee.employeeCategory),
  department: employee.department
});
    res.json({
      token,
      employeeCategory: employee.employeeCategory,
      department: employee.department
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};
// ✅ GET COMPLAINTS BY DEPARTMENT & CATEGORY
exports.getDepartmentComplaints = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const complaints = await Complaint.find({
      department: decoded.department,
      category: decoded.category
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ message: 'Could not fetch complaints.' });
  }
};

// ✅ UPDATE COMPLAINT STATUS & RESPONSE
exports.updateComplaintResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.status === 'Resolved') {
  return res.status(400).json({ message: 'Resolved complaints cannot be modified.' });
}

complaint.status = status;
complaint.response = response;
await complaint.save();

    await transporter.sendMail({
      from: 'akashalpha55@gmail.com',
      to: complaint.userEmail,
      subject: 'FixIt - Complaint Status Updated',
      text: `Dear Student,\n\nYour complaint status is now:\nStatus: ${status}\nResponse: ${response || 'No message'}\n\n- FixIt Team`
    });

    res.json({ message: 'Complaint updated and user notified.' });
  } catch (err) {
    console.error('Update response error:', err);
    res.status(500).json({ message: 'Could not update complaint.' });
  }
};
