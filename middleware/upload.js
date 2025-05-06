const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}

const upload = multer({ storage: storage
, fileFilter: fileFilter
, limits: { 
    fileSize: 5 * 1024 * 1024 
    }
    
}); // 5 MB limit

module.exports = upload;