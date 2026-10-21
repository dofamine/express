import MongoStore from "connect-mongo";
import cors from 'cors';
import express from 'express';
import session from "express-session"
import mongoose from "mongoose";

import path from "node:path";
import { fileURLToPath } from 'node:url';
import passport from "passport"

import routes from './routes/index.mjs';
import passportAuth, { requireAuthentication } from "./routes/passport-auth.mjs";
import "./strategies/local.mjs"

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const staticDir = path.join(dirname, '../static');
const dataDir = path.join(dirname, '../data');

const app = express();
const port = process.env.PORT;
mongoose.connect(process.env.MONGODB_URI).then(r => console.log("MongoDB Connected!"));
const sessionCookieName = 'connect.sid';
app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticDir));
app.use(session({
  name: sessionCookieName,
  secret: 'secret',
  saveUninitialized: false,
  resave: false,
  rolling: true,
  cookie: {
    maxAge: 1000 * 60 * 60,
    sameSite: "lax",
  },
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
  })
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('staticDir', staticDir);
app.set('dataDir', dataDir);
app.set('sessionCookieName', sessionCookieName);

app.get('/', (req, res) => {
  console.log(req.session)
  console.log(req.session.id)
  res.sendFile(path.join(staticDir, 'welcome.html'));
})

app.get('/package', (req, res) => {
  res.download('package.json');
})

app.use('/api', requireAuthentication, routes);

app.use('/auth', passportAuth);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  return res.status(status).json({
    error: status < 500 ? error.message : 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${ port }`);
})
