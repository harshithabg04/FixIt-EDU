const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/mailer'); // ✅ Reuse existing mail sender
const SECRET_KEY = process.env.JWT_SECRET;

// =============================
// Signup Controller (Email OTP)
// =============================
exports.signup = async (req, res) => {
  const { username, email, password, department } = req.body;

  if (!username || !email || !password || !department)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already registered' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email,
      password, // hashing handled by schema
      department,
      otp,
      verified: false,
      otpExpires: Date.now() + 5 * 60 * 1000, // 5 mins validity
    });

    await user.save();

    // Send Email with OTP
    const htmlContent = `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Welcome to FixIt, ${username}!</h2>
        <p>Use the following OTP to verify your account:</p>
        <h1 style="color:#2e6bff; letter-spacing:3px;">${otp}</h1>
        <p>This OTP will expire in <strong>5 minutes</strong>.</p>
        <br/>
        <p>Thank you,<br/>FixIt Support Team</p>
      </div>
    `;

    await sendMail(email, 'Verify your FixIt account', htmlContent);

    res.json({ message: 'OTP sent to your email. Please verify.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

// =============================
// Verify Email OTP Controller
// =============================
exports.verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.otp !== otp || Date.now() > user.otpExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// =============================
// Resend Email OTP Controller
// =============================
exports.resendEmailOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const htmlContent = `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Resend OTP - FixIt</h2>
        <p>Your new OTP is:</p>
        <h1 style="color:#2e6bff; letter-spacing:3px;">${otp}</h1>
        <p>This OTP will expire in <strong>5 minutes</strong>.</p>
        <br/>
        <p>Thank you,<br/>FixIt Support Team</p>
      </div>
    `;

    await sendMail(email, 'Your new OTP from FixIt', htmlContent);

    res.json({ message: 'OTP resent successfully to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Could not resend OTP' });
  }
};

// =============================
// Login Controller
// =============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login Attempt:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      console.log('❌ User not verified');
      return res.status(401).json({ message: 'Please verify OTP before login' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        department: user.department
      },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      username: user.username,
      department: user.department
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};
