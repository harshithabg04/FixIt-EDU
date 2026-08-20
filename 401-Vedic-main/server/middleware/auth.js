const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Make sure this path is correct
const SECRET_KEY = process.env.JWT_SECRET || 'fixit_secret_key';
const Employee = require('../models/Employee');
require('dotenv').config();
// 🟦 Middleware for Regular User
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token - user not found' });

    req.user = {
      userId: user._id,
      email: user.email,
      username: user.username,
      department: user.department 
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 🟧 Middleware for Employee (not admin)

const authenticateEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const employee = await Employee.findById(decoded.userId);
    if (!employee)
      return res.status(401).json({ message: 'Employee not found or unauthorized' });

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      department: decoded.department, // ✅ Use from token
      category: decoded.category,     // ✅ Use from token (already capitalized)
      role: 'employee',
    };
    console.log('department',req.user.department);
    console.log('category',req.user.category);

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 🟥 Middleware for Admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this route' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};


// ✅ Allow both authenticated users and admins (for analytics etc.)
const allowUserOrAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded Token (allowUserOrAdmin):', decoded);

    // Handle Admin (based on role instead of domain)
    if (decoded.role === 'admin') {
      req.user = {
        username: decoded.username,
        role: decoded.role
      };
      return next();
    }

    // Handle Regular User
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token user' });

    req.user = {
      _id: user._id,
      email: user.email,
      username: user.username,
      domain: user.domain
    };
    next();
  } catch (err) {
    console.error('Error in allowUserOrAdmin:', err.message);
    return res.status(403).json({ message: 'Token invalid or expired' });
  }
};
const allowUserOrAdminOrEmployee= (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'employee' || req.user.role === 'user')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden - Not authorized' });
};


module.exports={
  authenticateUser,
  authenticateEmployee,
  authenticateAdmin,
  allowUserOrAdmin,
  allowUserOrAdminOrEmployee
}
