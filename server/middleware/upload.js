const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Local disk storage (fallback when Cloudinary not configured)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

const storage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        let folderPath = 'resolvex/complaints';
        if (file.fieldname === 'proofImages') {
          folderPath = 'resolvex/proofs';
        }
        const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
        const isVideo = ['mp4', 'avi', 'mov', 'mkv'].includes(fileExt);
        return {
          folder: folderPath,
          resource_type: isVideo ? 'video' : 'auto',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };
      },
    })
  : diskStorage;

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

module.exports = upload;
