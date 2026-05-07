import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Ensure uploads directory exists in backend root
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creating uploads directory at:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        console.log('💾 Saving file as:', filename);
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
    console.log('📥 Incoming file upload:', file.originalname, file.mimetype);
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        console.warn('❌ Rejected file (not a PDF):', file.mimetype);
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// @route   POST /api/upload/pdf
// @desc    Upload a PDF file (Teacher only)
router.post('/pdf', protect, authorize('Teacher'), upload.single('pdf'), (req: any, res: any) => {
    console.log('🎯 PDF Upload route hit');
    if (!req.file) {
        console.error('❌ No file received in req.file');
        return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('✅ PDF Upload Success:', fileUrl);
    res.status(200).json({
        success: true,
        data: {
            url: fileUrl,
            filename: req.file.originalname
        }
    });
});

export default router;
