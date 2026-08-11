import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define upload directories
const uploadPath = path.resolve(process.env.UPLOAD_PATH || './uploads');
const videosPath = path.join(uploadPath, 'videos');
const imagesPath = path.join(uploadPath, 'images');
const packagesPath = path.join(uploadPath, 'packages');

// Ensure directories exist
[videosPath, imagesPath, packagesPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage - using mimetype to determine destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check the file's mimetype to determine where to save
    if (file.mimetype.startsWith('video/')) {
      console.log(`🎬 Saving video to: ${videosPath}`);
      cb(null, videosPath);
    } else if (file.mimetype.startsWith('image/')) {
      console.log(`🖼️ Saving image to: ${imagesPath}`);
      cb(null, imagesPath);
    } else {
      console.log(`📁 Saving to default: ${imagesPath}`);
      cb(null, imagesPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const finalName = uniqueSuffix + '-' + sanitizedName;
    console.log(`📄 Saving as: ${finalName}`);
    cb(null, finalName);
  }
});

// Create multer instance
export const upload = multer({
  storage,
  limits: { 
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Export upload fields for different use cases
export const galleryUploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

export const packageUpload = upload.single('packageImage'); // kept for backward compatibility but no longer used directly

export const bulkUpload = upload.array('files', 50);

// Export paths for use in routes
export const uploadPaths = {
  uploadPath,
  videosPath,
  imagesPath,
  packagesPath
};