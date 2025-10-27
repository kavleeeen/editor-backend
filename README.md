# Editor Backend

A Node.js + Express backend application for the canvas editor project.

## Description

Express.js TypeScript backend with MongoDB support for saving and retrieving canvas designs from a Fabric.js editor application.

## Requirements

- Node.js >= 18.20.0
- npm >= 8.x
- MongoDB

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
# development (with hot reload)
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
├── config/            # Configuration (database, etc.)
├── controllers/       # Route controllers
├── models/           # Database models
├── routes/           # API routes
└── index.ts         # App entry point
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/editor
DB_NAME=editor
```

## API Endpoints

### Base URL
```
/api/v1
```

### Canvas Endpoints

#### 1. Save Canvas Design
- **POST** `/api/v1/canvas/:id/save`
- Save or update a canvas design
- **URL Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "designData": {
      "version": "6.7.1",
      "objects": [...],
      "background": "white"
    },
    "metadata": {
      "title": "My Design"
    }
  }
  ```

#### 2. Get Canvas Design
- **GET** `/api/v1/canvas/:id`
- Retrieve a saved canvas design by ID
- **URL Parameters:** `id` (UUID)

#### 3. List All Canvas Designs
- **GET** `/api/v1/canvas`
- Get a list of all saved canvas designs
- **Query Parameters:** `limit` (default: 50), `offset` (default: 0)

#### 4. Delete Canvas Design
- **DELETE** `/api/v1/canvas/:id`
- Delete a canvas design by ID
- **URL Parameters:** `id` (UUID)

### Other Endpoints

- **GET** `/` - API information
- **GET** `/health` - Health check

## Example Usage

### Save Canvas Design

```bash
curl -X POST http://localhost:3000/api/v1/canvas/12345678-1234-1234-1234-123456789abc/save \
  -H "Content-Type: application/json" \
  -d '{
    "designData": {"version":"6.7.1","objects":[],"background":"white"},
    "metadata": {"title":"Test Design"}
  }'
```

### Get Canvas Design

```bash
curl http://localhost:3000/api/v1/canvas/12345678-1234-1234-1234-123456789abc
```

### List All Canvases

```bash
curl http://localhost:3000/api/v1/canvas?limit=10&offset=0
```

### Delete Canvas

```bash
curl -X DELETE http://localhost:3000/api/v1/canvas/12345678-1234-1234-1234-123456789abc
```

## Test

```bash
# unit tests
npm run test

# test coverage
npm run test:cov
```

## Database Schema

### Collection: `canvas_designs`

| Field | Type | Description |
|-------|------|-------------|
| _id | String | UUID identifier (PRIMARY KEY) |
| designData | Object | Fabric.js canvas state (JSON) |
| metadata | Object | Design metadata (title, dates, version) |

## License

MIT
