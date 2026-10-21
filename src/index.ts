import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import routes from './routes/index.js';
import passportAuth, {
  requireAuthentication,
} from './routes/passport-auth.js';
import './strategies/local.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const staticDir = path.join(dirname, '../static');
const dataDir = path.join(dirname, '../data');
const port = process.env.PORT ?? '3000';
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}

await mongoose.connect(mongoUri);
console.log('MongoDB Connected!');

const sessionCookieName = 'connect.sid';
const app = express();

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticDir));
app.use(
  session({
    name: sessionCookieName,
    secret: process.env.SESSION_SECRET ?? 'secret',
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
      sameSite: 'lax',
    },
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
    }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.set('staticDir', staticDir);
app.set('dataDir', dataDir);
app.set('sessionCookieName', sessionCookieName);

app.get('/', (req, res) => {
  console.log(req.session);
  console.log(req.session.id);
  res.sendFile(path.join(staticDir, 'welcome.html'));
});

app.get('/package', (_req, res) => {
  res.download('package.json');
});

app.use('/api', requireAuthentication, routes);
app.use('/auth', passportAuth);

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  const candidate = error as { message?: unknown; status?: unknown };
  const status =
    typeof candidate.status === 'number' &&
    Number.isInteger(candidate.status) &&
    candidate.status >= 400 &&
    candidate.status < 600
      ? candidate.status
      : 500;

  return res.status(status).json({
    error:
      status < 500 && typeof candidate.message === 'string'
        ? candidate.message
        : 'Internal server error',
  });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
