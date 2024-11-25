import express from 'express';
import multer from 'multer';
import { sendFileToFlask, sendJsonToFlask } from '../services/flaskService.js';

const router = express.Router();
const upload = multer(); // Multer for handling multipart form data

// Route for image analysis
router.post('/analyze-image', upload.single('file'), async (req, res) => {
    try {
        const result = await sendFileToFlask('analyze-image', req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route for video analysis
router.post('/analyze-video', upload.single('file'), async (req, res) => {
    try {
        const result = await sendFileToFlask('analyze-video', req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route for text analysis
router.post('/analyze-text', async (req, res) => {
    try {
        const result = await sendJsonToFlask('analyze-text', req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route for music generation
router.post('/generate-music', async (req, res) => {
    try {
        const result = await sendJsonToFlask('generate-music', req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
