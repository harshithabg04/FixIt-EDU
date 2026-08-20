const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const upload = require('./cloudConfig');
const sendSMS=require('./utils/sendSMS');
const Complaint = require('./models/Complaint');
const User = require('./models/user');
const router = express.Router();

const { authenticateUser, authenticateEmployee, authenticateAdmin } = require('./middleware/auth');
 // ✅ Import correctly

// Import routes
const userRoutes = require('./routes/userRoutes'); 
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
dotenv.config();
connectDB(); // Connect MongoDB

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'fixit_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
app.use('/api/complaints', require('./routes/complaintRoutes'));
// Use routes
app.use('/api/admin', adminRoutes); // ✅ Secure admin routes
app.use('/api/employee', employeeRoutes);
app.use('/api/user',userRoutes) // ✅ Secure employee routes
// Admin Login (simple logic)
const adminUser = { username: 'admin', password: 'admin123' };

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// User Signup
app.post('/api/user/signup', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { phone }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      phone,
      password,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    });

    await user.save();

    // Send OTP via SMS
    await sendSMS(phone, otp); // Make sure this function is defined and working

    res.status(201).json({ message: 'OTP sent to your phone. Please verify.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
});

app.post('/api/user/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    console.log("OTP matched. Setting verified = true for", phone);
    user.verified = true;
    await user.save();
    console.log("User updated with verified = true");


    return res.status(200).json({ message: 'OTP Verified. You can now login.' });
  } catch (err) {
    console.error('OTP verification error:', err.message);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});


// User Login

app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Optional: Add verified check if OTP is used
    console.log('User verified status:', user.verified);

     if (!user.verified) return res.status(401).json({ message: 'OTP verification pending' });
     

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Submit Complaint (for employee)
app.post(
  '/api/complaints',
  authenticateUser, // ✅ ADD THIS
  (req, res, next) => {
    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      upload.single('photo')(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  },
  async (req, res) => {
    try {
      const { title, description, location, domain } = req.body;
      if (!domain) return res.status(400).json({ message: 'Domain required' });

      const photoUrl = req.file ? req.file.path : null;

      const complaint = new Complaint({
        title,
        description,
        location,
        userName: req.user.username,
        userEmail: req.user.email || '',
        domain,
        status: 'Open',
        photoUrl,
      });

      await complaint.save();
      res.status(201).json({ message: 'Complaint created', complaint });
    } catch (error) {
      console.error('Complaint error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin: Get All Complaints
app.get('/api/complaints', async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
});

// Employee: Get Domain-wise Complaints
app.get('/api/employee/complaints', authenticateEmployee, async (req, res) => {
  const complaints = await Complaint.find({ domain: req.user.domain });
  res.json(complaints);
});

// Employee: Update Complaint Status
app.patch('/api/complaints/:id/status',authenticateEmployee, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const complaint = await Complaint.findById(id);
  if (!complaint || complaint.domain !== req.user.domain)
    return res.status(403).json({ message: 'Unauthorized' });

  complaint.status = status;
  await complaint.save();
  res.json(complaint);
});

// Get All Complaint Domains
app.get('/api/sectors', async (req, res) => {
  const domains = await Complaint.distinct('domain');
  res.json(domains);
});

// Serve frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
