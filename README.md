# Editor Backend

A Node.js + Express backend for a collaborative canvas editor with real-time features, authentication, and file management.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB
- Google Cloud SDK (for deployment)

### Installation & Running
```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm run start:prod
```

### Environment Setup
Create a `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/editor
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:5173
GCS_BUCKET=your-gcs-bucket-name
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 🚀 Deployment

**Platform:** Google Cloud Run  
**Database:** MongoDB Atlas  
**Storage:** Google Cloud Storage  

### Deploy to Cloud Run
```bash
# Set environment variables
export PROJECT_ID=your-project-id
export REGION=asia-south1
export SERVICE_NAME=editor-backend
export MONGODB_URI='your-production-mongodb-uri'

# Deploy using helper script
./deploy-cloudrun.sh
```

The deployment script automatically:
- Builds Docker image
- Deploys to Cloud Run
- Configures secrets from Google Secret Manager
- Sets up environment variables

## 🔐 Authentication

**Method:** JWT (JSON Web Tokens)  
**Implementation:** Bearer token authentication

### How it works:
1. User registers/logs in via `/api/v1/auth/register` or `/api/v1/auth/login`
2. Server returns JWT token with user info
3. Client includes token in `Authorization: Bearer <token>` header
4. Middleware validates token on protected routes

### Protected Routes:
- All `/api/v1/canvas/*` endpoints require authentication
- WebSocket connections require JWT token

## 🛡️ Security Features

### Rate Limiting
- **express-rate-limit** middleware
- **1000 requests per 15 minutes** per IP
- Applied to all `/api/*` routes
- Cloud Run proxy-aware

### Security Headers
- **Helmet.js** for security headers
- CORS configuration
- Request size limits (10MB)

## 👥 Role-Based Access Control (RBAC)

**Roles:** `owner` > `editor` > `viewer`

### Canvas Access Control:
- **Owner:** Full control, can share with others
- **Editor:** Can edit and share canvas
- **Viewer:** Read-only access
- Access granted via `/api/v1/canvas/share` endpoint

### Implementation:
- Canvas access stored in `canvas_access` collection
- Role hierarchy enforced in middleware
- Automatic owner assignment on canvas creation

## 🔧 Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Request Logger** - Custom logging with request IDs
4. **Rate Limiter** - API rate limiting
5. **Authentication** - JWT token validation
6. **Error Logger** - Error tracking and logging

## 📝 Logging System

**Custom logging middleware** with:
- Request/response logging with unique IDs
- User tracking from JWT tokens
- Performance metrics (response time)
- Error logging with stack traces
- Structured log format with emojis

### Log Levels:
- 📝 **INFO** - Normal operations
- ⚠️ **WARN** - Warnings
- ❌ **ERROR** - Errors

## 🖼️ Image Handling

**Storage:** Google Cloud Storage  
**Upload:** Multer middleware (50MB limit)  
**Access:** Signed URLs (1 hour + 7 days)

### Features:
- File upload via `/api/v1/upload`
- Automatic filename sanitization
- Signed URL generation for secure access
- Support for multiple file types
- Memory-based processing

### Usage:
```bash
# Upload file
curl -X POST /api/v1/upload -F "file=@image.jpg"

# Get signed URLs
curl /api/v1/upload/signed-url/filename.jpg
```

## 🔌 WebSocket Configuration

**Real-time collaboration** using Yjs + WebSocket

### Setup:
- WebSocket server runs on same port as HTTP server
- Uses `@y/websocket-server` for Yjs integration
- Automatic garbage collection enabled

### Connection:
```
ws://localhost:3000?token=JWT_TOKEN&doc=canvas-id
```

### Features:
- Real-time document synchronization
- User presence tracking
- Cursor position sharing
- Automatic persistence to MongoDB
- JWT authentication required

## 🗄️ Database

**MongoDB** with the following collections:

### Collections:
- `canvas_designs` - Canvas data and metadata
- `users` - User accounts and authentication
- `canvas_access` - RBAC permissions
- `comments` - Canvas comments

### Models:
- **CanvasDesign** - Fabric.js canvas state
- **User** - Authentication and user data
- **CanvasAccess** - Permission management
- **Comment** - Collaboration comments

## 📊 API Endpoints

### Base URL: `/api/v1`

**Canvas Management:**
- `POST /canvas` - Create canvas
- `GET /canvas/:id` - Get canvas
- `PATCH /canvas/:id` - Update canvas
- `DELETE /canvas/:id` - Delete canvas
- `POST /canvas/:id/save` - Save canvas

**Collaboration:**
- `GET /canvas/:id/yjs` - Get Yjs state
- `POST /canvas/:id/yjs` - Save Yjs state
- `GET /canvas/:id/users` - Get active users
- `POST /canvas/share` - Share canvas

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

**File Upload:**
- `POST /upload` - Upload file
- `GET /upload/signed-url/:filename` - Get signed URL

## 🧪 Testing

```bash
# Run tests
npm run test

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route handlers
├── middleware/      # Auth, logging, rate limiting
├── models/          # Database models
├── routes/          # API routes
├── utils/           # JWT utilities
└── websocket/       # WebSocket server
```

## 🔧 Development

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run build
```

---

**License:** MIT  
**Author:** kavleeeen