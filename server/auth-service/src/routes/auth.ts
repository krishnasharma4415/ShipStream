import express from 'express';
import { generateAuthUrl } from '../services/oauth';
import { validateGitHubConfig } from '../config/github';
import { authRateLimit, requireAuth } from '../middleware/auth';
import { validateGitHubLogin, validateTokenRefresh, validateLogout } from '../middleware/validation';

const router = express.Router();

router.post('/github/login', authRateLimit, validateGitHubLogin, async (req, res) => {
  try {
    if (!validateGitHubConfig()) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth not properly configured',
        code: 500,
        timestamp: new Date()
      });
    }

    const { url, state } = await generateAuthUrl();
    
    res.json({
      authUrl: url,
      state: state
    });
  } catch (error) {
    res.status(500).json({
      error: 'OAuth Error',
      message: 'Failed to generate authorization URL',
      code: 500,
      timestamp: new Date()
    });
  }
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing code or state parameter',
        code: 400,
        timestamp: new Date()
      });
    }

    const { validateState } = await import('../services/oauth');
    const isValidState = await validateState(state as string);
    
    if (!isValidState) {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'Invalid or expired state parameter',
        code: 400,
        timestamp: new Date()
      });
    }

    const { exchangeCodeForToken, fetchGitHubUser } = await import('../services/github');
    const { createOrUpdateUser } = await import('../services/user');
    const { createSession } = await import('../services/session');
    const { generateJWT } = await import('../services/jwt');
    
    const accessToken = await exchangeCodeForToken(code as string);
    const githubUser = await fetchGitHubUser(accessToken);
    const user = await createOrUpdateUser(githubUser, accessToken);
    const session = await createSession(user);
    const jwtToken = generateJWT(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtToken}&sessionId=${session.sessionId}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'OAuth Error',
      message: 'Failed to process OAuth callback',
      code: 500,
      timestamp: new Date(),
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/logout', validateLogout, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Session ID is required',
        code: 400,
        timestamp: new Date()
      });
    }

    const { deleteSession } = await import('../services/session');
    await deleteSession(sessionId);

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to logout',
      code: 500,
      timestamp: new Date()
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        code: 401,
        timestamp: new Date()
      });
    }

    const token = authHeader.substring(7);
    const { verifyJWT } = await import('../services/jwt');
    const { getUserById } = await import('../services/user');
    
    const payload = verifyJWT(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 401,
        timestamp: new Date()
      });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        code: 404,
        timestamp: new Date()
      });
    }

    res.json({
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get user info',
      code: 500,
      timestamp: new Date()
    });
  }
});

router.post('/refresh', validateTokenRefresh, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required',
        code: 400,
        timestamp: new Date()
      });
    }

    const { refreshJWT } = await import('../services/jwt');
    const newToken = refreshJWT(token);
    
    if (!newToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 401,
        timestamp: new Date()
      });
    }

    res.json({
      token: newToken,
      expiresIn: '24h'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to refresh token',
      code: 500,
      timestamp: new Date()
    });
  }
});

export default router;