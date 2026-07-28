import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.env.UPLOAD_PATH || './uploads');
const galleryDir = path.join(uploadDir, 'gallery');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail' || file.fieldname === 'image') {
      cb(null, thumbnailsDir);
    } else if (file.fieldname === 'video') {
      cb(null, galleryDir);
    } else {
      cb(null, galleryDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('image') ? '.jpg' : '.mp4');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

  if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  } else if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, MOV, and WebM videos are allowed'));
    }
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10
  }
});
