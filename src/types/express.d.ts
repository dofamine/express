import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      name: string;
      lastSeen: Date;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      name: string;
    };
  }
}

export {};
