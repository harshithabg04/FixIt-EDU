const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const upload = require('./cloudConfig');
const Complaint = require('./models/Complaint');
const Employee = require('./models/Employee');

dotenv.config();

const app = express();
const SECRET_KEY = 'fixit_secret_key';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// Middleware for admin and employee auth
function auth(role) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      if (role === 'employee' && !decoded.domain) return res.status(403).json({ message: 'Not authorized' });
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid token' });
    }
  }
}

// Static Admin Credentials
const adminUser = { username: 'admin', password: 'admin123' };

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// Employee Login
app.post('/api/employee/login', async (req, res) => {
  const { username, password } = req.body;
  const employee = await Employee.findOne({ username });
  if (!employee || employee.password !== password)
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ username, domain: employee.domain }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Raise Complaint
app.post('/api/complaints', upload.single('photo'), async (req, res) => {
  const { title, description, location, userName, userEmail, domain } = req.body;
  if (!domain) return res.status(400).json({ message: 'Domain required' });

  const photoUrl = req.file ? req.file.path : '';
  const complaint = new Complaint({ title, description, location, userName, userEmail, domain, photoUrl, status: 'Open' });
  await complaint.save();
  res.status(201).json({ message: 'Complaint created', complaint });
});

// Admin: Get All Complaints
app.get('/api/complaints', auth('admin'), async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
});

// Employee: Get Complaints in Domain
app.get('/api/employee/complaints', auth('employee'), async (req, res) => {
  const complaints = await Complaint.find({ domain: req.user.domain });
  res.json(complaints);
});

// Employee: Update Complaint Status
app.patch('/api/complaints/:id/status', auth('employee'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const complaint = await Complaint.findById(id);
  if (!complaint || complaint.domain !== req.user.domain)
    return res.status(403).json({ message: 'Unauthorized' });

  complaint.status = status;
  await complaint.save();
  res.json(complaint);
});

// Fetch All Domains (for frontend)
app.get('/api/sectors', async (req, res) => {
  const domains = await Complaint.distinct('domain');
  res.json(domains);
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
