const express = require('express');
const betterAuthController = require('../controllers/better-auth.controller');
const { requireAuth } = require('../middleware/betterAuth');
const { loginLimiter } = require('../middleware/security');

const router = express.Router();

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in user
 *     description: Authenticate user with email/username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               username:
 *                 type: string
 *                 example: "john.doe"
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *             oneOf:
 *               - required: [email, password]
 *               - required: [username, password]
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sign in successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [MEMBER, ADMIN]
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED]
 *                     is_active:
 *                       type: boolean
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
router.post('/signin', loginLimiter, betterAuthController.signIn);

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out user
 *     description: Sign out the current user and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sign out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sign out successful"
 *       401:
 *         description: Unauthorized
 */
router.post('/signout', requireAuth, betterAuthController.signOut);

// Only signin and signout routes remain for a clean base

module.exports = router;
