import { Router, type RequestHandler } from 'express';
import { checkSchema, matchedData, validationResult } from 'express-validator';
import passport from 'passport';
import { UserDBModel } from '../mongoose/schemas/user.js';
import { userSchema } from '../schemas/user.js';
import { hashPassword } from '../utils/password.js';

interface Credentials {
  name: string;
  password: string;
}

const router = Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (error: unknown, user?: Express.User | false | null, info?: object | string | Array<string | undefined>) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      const message =
        typeof info === 'object' &&
        info !== null &&
        !Array.isArray(info) &&
        'message' in info &&
        typeof info.message === 'string'
          ? info.message
          : 'Invalid username or password';

      return res.status(401).json({
        error: message,
      });
    }

    return req.logIn(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }

      return res.status(200).json(user);
    });
  })(req, res, next);
});

router.post('/register', ...checkSchema(userSchema, ['body']), async (req, res) => {
  const data = matchedData(req) as Credentials;
  const errors = validationResult(req)
    .array()
    .map(({ msg }) => String(msg));

  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const password = await hashPassword(data.password);
    const newUser = new UserDBModel({ ...data, password });
    const savedUser = await newUser.save();
    savedUser.set('password', undefined);
    return res.status(201).json(savedUser);
  } catch {
    return res.status(400).send({ message: 'User already exists' });
  }
});

router.get('/status', (req, res) => {
  if (req.user) {
    return res.sendStatus(200);
  }

  return res.sendStatus(401);
});

router.post('/logout', (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) {
      return next(logoutError);
    }

    return req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie(req.app.get('sessionCookieName') as string, { path: '/' });
      return res.sendStatus(200);
    });
  });
});

export const requireAuthentication: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  return next();
};

export default router;
