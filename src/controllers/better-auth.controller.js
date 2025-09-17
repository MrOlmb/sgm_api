const { auth } = require('../utils/auth');
const prisma = require('../config/database');
const logger = require('../config/logger');
const ErrorHandler = require('../utils/errorHandler');

class BetterAuthController {
  async signIn(req, res) {
    try {
      const { email, password, username } = req.body;

      // Validate required fields
      if ((!email && !username) || !password) {
        const validationError = ErrorHandler.createBusinessError(
          'Email/username and password are required',
          'MISSING_CREDENTIALS',
          400,
          ['Provide email or username and password']
        );
        const context = {
          operation: 'user_signin',
          user_id: 'anonymous'
        };
        return ErrorHandler.formatBusinessError(validationError, res, context);
      }

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email?.toLowerCase() },
            { username: username }
          ]
        }
      });

      if (!user) {
        const authError = new Error('Invalid credentials');
        authError.code = 'INVALID_CREDENTIALS';
        authError.status = 401;
        const context = {
          operation: 'user_signin',
          user_id: 'anonymous'
        };
        return ErrorHandler.formatAuthError(authError, res, context);
      }

      // Check if user is active
      if (!user.is_active) {
        const businessError = ErrorHandler.createBusinessError(
          'Account is deactivated',
          'ACCOUNT_DEACTIVATED',
          403,
          ['Contact an administrator to reactivate your account']
        );
        const context = {
          operation: 'account_status_check',
          user_id: user.id
        };
        return ErrorHandler.formatBusinessError(businessError, res, context);
      }

      // Sign in with better-auth (forward Set-Cookie headers)
      const signInResponse = await auth.api.signInEmail({
        body: {
          email: user.email,
          password
        },
        asResponse: true,
        headers: req.headers
      });

      // Forward session cookies to the client
      try {
        const setCookies = typeof signInResponse.headers.getSetCookie === 'function'
          ? signInResponse.headers.getSetCookie()
          : (signInResponse.headers.get('set-cookie') ? [signInResponse.headers.get('set-cookie')] : []);
        if (setCookies && setCookies.length > 0) {
          res.setHeader('Set-Cookie', setCookies);
        }
      } catch (_) {}

      const result = await signInResponse.json();

      if (!result?.user || !result?.session) {
        const authError = new Error('Invalid credentials');
        authError.code = 'INVALID_CREDENTIALS';
        authError.status = 401;
        const context = {
          operation: 'user_signin',
          user_id: user.id
        };
        return ErrorHandler.formatAuthError(authError, res, context);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login: new Date() }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'USER_SIGNIN',
          details: {
            email: user.email,
            username: user.username
          },
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        }
      });

      logger.info('User signed in successfully', {
        user_id: user.id,
        email: user.email
      });

      res.json({
        message: 'Sign in successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          username: result.user.username,
          role: result.user.role,
          status: result.user.status,
          is_active: result.user.is_active
        },
        session: {
          id: result.session.id,
          expiresAt: result.session.expiresAt
        }
      });

    } catch (error) {
      const context = {
        operation: 'user_signin',
        user_id: 'anonymous'
      };
      return ErrorHandler.handleError(error, res, context);
    }
  }

  async signOut(req, res) {
    try {
      const sessionId = req.session?.id;

      if (sessionId) {
        // Sign out with better-auth (forward Set-Cookie headers)
        const signOutResponse = await auth.api.signOut({
          headers: req.headers,
          asResponse: true
        });
        try {
          const setCookies = typeof signOutResponse.headers.getSetCookie === 'function'
            ? signOutResponse.headers.getSetCookie()
            : (signOutResponse.headers.get('set-cookie') ? [signOutResponse.headers.get('set-cookie')] : []);
          if (setCookies && setCookies.length > 0) {
            res.setHeader('Set-Cookie', setCookies);
          }
        } catch (_) {}

        // Create audit log
        await prisma.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'USER_SIGNOUT',
            details: {},
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          }
        });

        logger.info('User signed out successfully', {
          user_id: req.user.id
        });
      }

      res.json({
        message: 'Sign out successful'
      });

    } catch (error) {
      const context = {
        operation: 'user_signout',
        user_id: req.user?.id
      };
      return ErrorHandler.handleError(error, res, context);
    }
  }
}

module.exports = new BetterAuthController();
