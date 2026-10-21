import crypto from "crypto";
import { Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { userSchema } from "../shcemas/user.mjs";

const router = Router();

router.post('/login',
  checkSchema(userSchema, ['body']),
  async (req, res, next) => {
    const { name, password } = matchedData(req);
    const errors = validationResult(req).array().map(({ msg }) => msg);
    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }
    const users = JSON.parse(await readFile(path.join(req.app.get('dataDir'), 'users.json'), 'utf-8'))
    const user = users.find(user => user.name.trim().toLowerCase() === name.trim().toLowerCase());

    if (!user || user.password !== password) {
      return res.status(404).send({ message: 'Login or password is incorrect' });
    }

    req.session.regenerate(async (e) => {
      if (e) return next(e);
      req.session.user = { id: user.id, name: user.name };
      const updatedUsers = users.map((_user) => _user.id === user.id ? { ..._user, lastSeen: new Date() } : _user);
      await writeFile(path.join(req.app.get('dataDir'), 'users.json'), JSON.stringify(updatedUsers), 'utf-8');
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        res.send(req.session.user);
      })
    })
  })

router.post('/register',
  checkSchema(userSchema, ['body']),
  async (req, res) => {
    const { name, password } = matchedData(req);
    const errors = validationResult(req).array().map(({ msg }) => msg);
    if (errors.length > 0) {
      return res.status(422).json({ errors });
    }

    const users = JSON.parse(await readFile(path.join(req.app.get('dataDir'), 'users.json'), 'utf-8'))
    const user = users.find(user => user.name === name);

    if (user) {
      return res.status(422).send({ message: 'User already exists' });
    }

    const id = crypto.randomUUID();
    users.push({ id, name, password });
    await writeFile(path.join(req.app.get('dataDir'), 'users.json'), JSON.stringify(users), 'utf-8');
    res.send({ id, name });
  })

router.get('/status',
  (req, res) => {
    if (req.session.user) {
      return res.sendStatus(200);
    }
    res.sendStatus(403);
  })

router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie()
    return res.sendStatus(200);
  })
})

export function requireAuthentication(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next()
}

export default router;
