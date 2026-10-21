import { Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import passport from "passport";
import { UserDBModel } from "../mongoose/schemas/user.mjs";
import { userSchema } from "../shcemas/user.mjs";
import { hashPassword } from "../utils/password.mjs";

const router = Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        error: info?.message ?? 'Invalid username or password',
      });
    }

    req.logIn(user, error => {
      if (error) {
        return next(error);
      }

      return res.status(200).json(user);
    });
  })(req, res, next);
});

router.post('/register',
  ...checkSchema(userSchema, ['body']),
  async (req, res) => {
    const data = matchedData(req);
    const errors = validationResult(req).array().map(({ msg }) => msg);
    if (errors.length) {
      return res.status(422).json({ errors });
    }

    try {
      const password = await hashPassword(String(data.password))
      const newUser = new UserDBModel({ ...data, password });
      const savedUser = await newUser.save();
      savedUser.password = undefined;
      return res.status(201).json(savedUser);
    } catch (err) {
      return res.status(400).send({ message: 'User already exists' })
    }
  })

router.get('/status',
  (req, res) => {
    if (req.user) {
      return res.sendStatus(200);
    }
    res.sendStatus(401);
  })

router.post('/logout', (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) {
      return next(logoutError);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie(req.app.get('sessionCookieName'), { path: '/' });
      return res.sendStatus(200);
    });
  });
})

export function requireAuthentication(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  return next();
}

export default router;
