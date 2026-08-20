// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'fixit_secret_key';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.username === 'admin') {
        req.user = decoded;
        return next();
      } else {
        return res.status(403).json({ message: 'Not admin' });
      }
    } catch {
      return res.status(403).json({ message: 'Invalid token' });
    }
  }
  return res.status(401).json({ message: 'No token provided' });
}

function authenticateEmployee(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      return next();
    } catch {
      return res.status(403).json({ message: 'Invalid token' });
    }
  }
  return res.status(401).json({ message: 'No token provided' });
}

module.exports = {
  authenticateAdmin,
  authenticateEmployee,
};
