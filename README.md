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

Create a `.env` file in the root directory (see `.env.example` for reference):

```env
# Server Configuration
PORT=3000
WEBSOCKET_PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/editor
DB_NAME=editor

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Required Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `WEBSOCKET_PORT` - WebSocket server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

## API Endpoints

### Base URL
```
/api/v1
```

### Canvas Endpoints

#### 1. Create Canvas Design
- **POST** `/api/v1/canvas`
- Create a new blank canvas design
- **Request Body:**
  ```json
  {
    "metadata": {
      "title": "My Design"
    }
  }
  ```

#### 2. Save Canvas Design
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

#### 3. Get Canvas Design
- **GET** `/api/v1/canvas/:id`
- Retrieve a saved canvas design by ID
- **URL Parameters:** `id` (UUID)

#### 4. Update Canvas Design
- **PATCH** `/api/v1/canvas/:id`
- Update an existing canvas design
- **URL Parameters:** `id` (UUID)

#### 5. List All Canvas Designs
- **GET** `/api/v1/canvas`
- Get a list of all saved canvas designs
- **Query Parameters:** `limit` (default: 50), `offset` (default: 0)

#### 6. Delete Canvas Design
- **DELETE** `/api/v1/canvas/:id`
- Delete a canvas design by ID
- **URL Parameters:** `id` (UUID)

### Collaboration Endpoints (Real-time Editing)

#### 7. Get Yjs Document State
- **GET** `/api/v1/canvas/:id/yjs`
- Get the Yjs document state for real-time collaboration
- **URL Parameters:** `id` (UUID)
- **Response:**
  ```json
  {
    "success": true,
    "yjsState": [...],
    "hasData": true,
    "fromMemory": true
  }
  ```

#### 8. Save Yjs Document State
- **POST** `/api/v1/canvas/:id/yjs`
- Save Yjs document state to database
- **URL Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "yjsState": [123, 45, 67, ...]
  }
  ```

#### 9. Get Active Users
- **GET** `/api/v1/canvas/:id/users`
- Get list of active users editing the canvas
- **URL Parameters:** `id` (UUID)
- **Response:**
  ```json
  {
    "success": true,
    "users": [
      {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "color": "#FF6B6B",
        "cursor": null
      }
    ],
    "count": 1
  }
  ```

#### 10. Force Save
- **POST** `/api/v1/canvas/:id/save`
- Force save the current in-memory Yjs state to database
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

## WebSocket Connection

The backend supports real-time collaboration through WebSocket connections. Connect to the WebSocket server using:

```
ws://localhost:3001?token=YOUR_JWT_TOKEN&doc=canvas-id
```

### Connection Parameters

- `token` - JWT authentication token (required)
- `doc` - Canvas document ID (required)

### Example WebSocket Client

```javascript
const WebSocket = require('ws');

const token = 'your-jwt-token';
const docId = 'your-canvas-id';

const ws = new WebSocket(`ws://localhost:3001?token=${token}&doc=${docId}`);

ws.on('open', () => {
  console.log('Connected to collaboration server');
});

ws.on('message', (data) => {
  console.log('Received message:', data);
});

ws.on('close', () => {
  console.log('Disconnected from collaboration server');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### How it Works

1. **Yjs Documents** - Each canvas has an in-memory Yjs document that syncs changes in real-time
2. **Automatic Persistence** - Documents are saved to MongoDB every 10 seconds
3. **User Presence** - Active users are tracked and visible to all collaborators
4. **Cursor Tracking** - User cursors are synchronized across clients
5. **Token-based Auth** - All connections require JWT authentication

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
| userId | String | User ID (owner of the canvas) |
| designData | Object | Fabric.js canvas state (JSON) |
| metadata | Object | Design metadata (title, dates, version) |
| yjsState | Binary | Yjs document state for real-time collaboration |
| lastSaved | Date | Last time the Yjs state was saved to database |

## License

MIT
