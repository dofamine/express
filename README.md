# Express TypeScript API

An Express 5 API using MongoDB, Passport local authentication, and server-side
sessions. The application is written in strict TypeScript and emitted as native
Node.js ESM.

## Requirements

- Node.js 20 or newer
- MongoDB

Create a `.env` file with at least:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/express
PORT=3000
SESSION_SECRET=replace-this-in-production
```

## Commands

```sh
npm install       # install runtime and TypeScript dependencies
npm run dev       # run src/index.ts in watch mode
npm run check     # type-check without emitting files
npm run build     # compile TypeScript into dist/
npm start         # run the compiled application
npm test          # run the current validation suite (type-checking)
```

Source imports use `.js` extensions intentionally. With TypeScript's `NodeNext`
module resolution, those specifiers resolve to `.ts` during development and to
the emitted `.js` files in production.
