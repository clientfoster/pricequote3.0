const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'quotemaster-pro',
        resource_type: 'auto', // Important for PDFs
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        access_mode: 'public', // Ensure files are publicly accessible
    },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }
    res.send({
        message: 'File uploaded',
        filePath: req.file.path, // Cloudinary URL (usually secure_url)
    });
});

module.exports = router;

