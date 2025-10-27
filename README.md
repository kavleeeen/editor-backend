# Editor Backend

A Node.js + Express backend application for the editor project.

## Description

Express.js TypeScript backend with MongoDB support.

## Requirements

- Node.js >= 18.20.0
- npm >= 8.x
- MongoDB (optional, for database features)

If you're using nvm, you can automatically switch to the correct Node version:
```bash
nvm use
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start:dev

# or
npm run dev

# production mode
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── controllers/      # Route controllers
├── routes/           # API routes
├── services/         # Business logic
├── models/           # Database models
├── utils/            # Utility functions
└── index.ts         # App entry point
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api` - Main API endpoint

## Test

```bash
# unit tests
npm run test

# test coverage
npm run test:cov
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/editor
NODE_ENV=development
```

## License

MIT
