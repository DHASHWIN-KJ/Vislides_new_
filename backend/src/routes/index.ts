import { Router } from 'express';
import { googleLogin, setRole, me } from '../controllers/authController';
import { createSession, getSession, joinSession, updateSessionStatus } from '../controllers/sessionController';
import { submitQuestion, getQuestionsForSession, answerQuestion } from '../controllers/questionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Auth Routes
router.post('/auth/google', googleLogin);
router.post('/auth/role', requireAuth, setRole);
router.get('/auth/me', requireAuth, me);

// Session Routes
router.post('/sessions', requireAuth, createSession);
router.get('/sessions/:sessionId', requireAuth, getSession);
router.get('/sessions/join/:sessionCode', requireAuth, joinSession);
router.patch('/sessions/:sessionId/status', requireAuth, updateSessionStatus);

// Question Routes
router.post('/questions', requireAuth, submitQuestion);
router.get('/questions/session/:sessionId', requireAuth, getQuestionsForSession);
router.patch('/questions/:questionId/answer', requireAuth, answerQuestion);

export default router;
