import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router, type RequestHandler } from 'express';
import { checkSchema, matchedData, validationResult } from 'express-validator';
import { userSchema } from '../schemas/user.js';

interface Credentials {
  name: string;
  password: string;
}

interface FileUser extends Credentials {
  id: string;
  lastSeen?: string | Date;
}

const router = Router();

function getUsersFile(req: Parameters<RequestHandler>[0]): string {
  return path.join(req.app.get('dataDir') as string, 'users.json');
}

async function readUsers(file: string): Promise<FileUser[]> {
  const contents = await readFile(file, 'utf8');
  return JSON.parse(contents) as FileUser[];
}

router.post('/login', ...checkSchema(userSchema, ['body']), async (req, res, next) => {
  const { name, password } = matchedData(req) as Credentials;
  const errors = validationResult(req)
    .array()
    .map(({ msg }) => String(msg));

  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const usersFile = getUsersFile(req);
    const users = await readUsers(usersFile);
    const user = users.find(
      (candidate) =>
        candidate.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    if (!user || user.password !== password) {
      return res.status(404).send({
        message: 'Login or password is incorrect',
      });
    }

    return req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return next(regenerateError);
      }

      req.session.user = { id: user.id, name: user.name };
      const updatedUsers = users.map((candidate) =>
        candidate.id === user.id
          ? { ...candidate, lastSeen: new Date() }
          : candidate,
      );

      void writeFile(usersFile, JSON.stringify(updatedUsers), 'utf8')
        .then(
          () =>
            new Promise<void>((resolve, reject) => {
              req.session.save((saveError) => {
                if (saveError) reject(saveError);
                else resolve();
              });
            }),
        )
        .then(() => res.send(req.session.user))
        .catch(next);
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', ...checkSchema(userSchema, ['body']), async (req, res, next) => {
  const { name, password } = matchedData(req) as Credentials;
  const errors = validationResult(req)
    .array()
    .map(({ msg }) => String(msg));

  if (errors.length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const usersFile = getUsersFile(req);
    const users = await readUsers(usersFile);
    const user = users.find((candidate) => candidate.name === name);

    if (user) {
      return res.status(422).send({ message: 'User already exists' });
    }

    const id = crypto.randomUUID();
    users.push({ id, name, password });
    await writeFile(usersFile, JSON.stringify(users), 'utf8');
    return res.send({ id, name });
  } catch (error) {
    return next(error);
  }
});

router.get('/status', (req, res) => {
  if (req.session.user) {
    return res.sendStatus(200);
  }

  return res.sendStatus(403);
});

router.get('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie(req.app.get('sessionCookieName') as string, { path: '/' });
    return res.sendStatus(200);
  });
});

export const requireAuthentication: RequestHandler = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  return next();
};

export default router;
