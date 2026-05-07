import express, { Application, Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database';
import { initSocket } from './config/socket';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/session';
import questionRoutes from './routes/question';
import pollRoutes from './routes/poll';
import assignmentRoutes from './routes/assignment';
import submissionRoutes from './routes/submission';
import guestRoutes from './routes/guest';
import uploadRoutes from './routes/upload';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Ensure uploads directory exists in backend root
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creating static uploads directory at:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize express app
const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/guest', guestRoutes); // Public routes for guest join
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Vi-SlideS API is running with Real-time support',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Real-time Socket.io initialized`);
});

export default app;
