// cloudConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getUploadMiddleware(folderName = 'uploads') {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const fullPath = path.join(__dirname, '..', folderName);
      fs.mkdirSync(fullPath, { recursive: true });
      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });

  return multer({ storage });
}

module.exports = getUploadMiddleware;
