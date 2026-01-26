import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// Root upload directory
const uploadRoot = path.join(__dirname, '../../uploads');

// Ensure root exists
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'misc';

    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'documents';
    }

    const fullPath = path.join(uploadRoot, folder);
    fs.mkdirSync(fullPath, { recursive: true });

    cb(null, fullPath);
  },

  // Create unique filenames
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Early MIME-type filtering
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'));
  }

  cb(null, true);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Export ready-to-use middlewares
export const uploadSingleFile = upload.single('file');

// Optional centralized multer error handler
export const handleMulterError = (
  err: any,
  req: Request,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
};