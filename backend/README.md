# Real-Time Chat Backend

Production-ready real-time chat application backend with WebSocket support, comprehensive testing, and Docker containerization.

## 🚀 Features

### Core Features
- ✅ **JWT Authentication** - Secure auth with httpOnly cookies
- ✅ **Real-time Messaging** - WebSocket communication via Socket.io
- ✅ **Group Chats** - Create groups with role-based permissions (admin/member)
- ✅ **Message Reactions** - Like/emoji reactions on messages
- ✅ **Message Editing** - Edit messages within 15-minute window
- ✅ **Soft Delete** - Delete messages without permanent removal
- ✅ **Read Receipts** - Track message read status
- ✅ **Typing Indicators** - Real-time typing status (1-on-1 and groups)
- ✅ **Online Tracking** - See who's online in real-time
- ✅ **Image Uploads** - Upload images via Cloudinary
- ✅ **Message Pagination** - Cursor-based pagination for performance

### Production Features
- ✅ **Comprehensive Testing** - 92 tests with 100% pass rate
- ✅ **Docker Support** - Full containerization with Docker Compose
- ✅ **Redis Integration** - Scalable session management and rate limiting
- ✅ **Rate Limiting** - Prevent API abuse with Redis-backed limits
- ✅ **Input Validation** - Joi schema validation for all endpoints
- ✅ **Error Handling** - Custom error classes with proper HTTP codes
- ✅ **Security Headers** - Helmet.js for security best practices
- ✅ **Response Compression** - Gzip compression for better performance
- ✅ **Request Timeouts** - Prevent hanging requests
- ✅ **Performance Logging** - Track slow queries and errors
- ✅ **Environment Validation** - Validate config on startup

## 🛠️ Tech Stack

**Core:**
- Node.js 20 & Express
- MongoDB with Mongoose ODM
- Socket.io for WebSockets
- Redis for caching & sessions

**Security:**
- JWT & bcrypt
- Helmet.js
- Joi validation
- Rate limiting
- CORS

**DevOps:**
- Docker & Docker Compose
- Multi-stage builds
- Health checks
- Volume persistence

**Testing:**
- Jest (92 tests)
- Supertest
- MongoDB Memory Server

## 📦 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional - falls back to in-memory)
- Cloudinary account

### Using Docker (Recommended)
```bash
# Development with hot reload
npm run docker:dev

# Production
npm run docker:prod

# View logs
npm run docker:logs

# Stop containers
npm run docker:dev:down
```

Access the API at `http://localhost:5001`

### Manual Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your actual values

# Start development server
npm run dev

# Run tests
npm test
```

## 🔧 Environment Variables

Required variables (see `.env.example`):
```env
# Server
NODE_ENV=development
PORT=5001

# Database
MONGODB_URI=mongodb://localhost:27017/realtime_chat

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Client
CLIENT_URL=http://localhost:5173

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📁 Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration (DB, Redis, Socket.io, env validation)
│   ├── controllers/     # Route handlers (auth, messages, groups)
│   ├── middleware/      # Custom middleware (auth, logging, rate limiting)
│   ├── models/          # Mongoose schemas (User, Message, Group)
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions & custom errors
│   ├── validators/      # Joi validation schemas
│   └── index.js         # Application entry point
├── tests/
│   ├── integration/     # API endpoint tests (53 tests)
│   ├── unit/            # Validation & error tests (39 tests)
│   ├── setup.js         # Test configuration
│   └── testUtils.js     # Test helper functions
├── Dockerfile           # Production Docker image
├── Dockerfile.dev       # Development Docker image
├── docker-compose.yml   # Production compose
└── docker-compose.dev.yml # Development compose
```

## 🔌 API Documentation

Base URL: `http://localhost:5001/api/v1`

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "password123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Check Auth Status
```http
GET /api/v1/auth/check
Cookie: jwt_T=<token>
```

#### Update Profile
```http
PUT /api/v1/auth/updateProfile
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "profilePic": "base64_image_data"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Cookie: jwt_T=<token>
```

### Message Endpoints

#### Get User List (Sidebar)
```http
GET /api/v1/messages/users
Cookie: jwt_T=<token>
```

#### Get Conversation
```http
GET /api/v1/messages/:userId?cursor=<messageId>&limit=50
Cookie: jwt_T=<token>
```

#### Send Message
```http
POST /api/v1/messages/send/:userId
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "text": "Hello!",
  "image": "base64_image_data" // optional
}
```

#### Edit Message
```http
PUT /api/v1/messages/:messageId
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "text": "Updated message"
}
```

#### Delete Message
```http
DELETE /api/v1/messages/:messageId
Cookie: jwt_T=<token>
```

#### Add Reaction
```http
POST /api/v1/messages/:messageId/reaction
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

#### Mark as Read
```http
POST /api/v1/messages/:userId/read
Cookie: jwt_T=<token>
```

### Group Endpoints

#### Create Group
```http
POST /api/v1/groups
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "name": "Team Chat",
  "description": "Our team group",
  "memberIds": ["userId1", "userId2"]
}
```

#### Get User's Groups
```http
GET /api/v1/groups
Cookie: jwt_T=<token>
```

#### Get Group Details
```http
GET /api/v1/groups/:groupId
Cookie: jwt_T=<token>
```

#### Add Members (Admin Only)
```http
POST /api/v1/groups/:groupId/members
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "memberIds": ["userId3", "userId4"]
}
```

#### Remove Member (Admin Only)
```http
DELETE /api/v1/groups/:groupId/members/:memberId
Cookie: jwt_T=<token>
```

#### Leave Group
```http
POST /api/v1/groups/:groupId/leave
Cookie: jwt_T=<token>
```

#### Delete Group (Creator Only)
```http
DELETE /api/v1/groups/:groupId
Cookie: jwt_T=<token>
```

#### Send Group Message
```http
POST /api/v1/messages/group/:groupId
Cookie: jwt_T=<token>
Content-Type: application/json

{
  "text": "Hello group!",
  "image": "base64_image_data" // optional
}
```

#### Get Group Messages
```http
GET /api/v1/messages/group/:groupId/messages?cursor=<messageId>&limit=50
Cookie: jwt_T=<token>
```

## 🔌 Socket.io Events

### Connection
```javascript
const socket = io('http://localhost:5001', {
  query: { userId: 'user123' }
});
```

### Client → Server Events
```javascript
// Typing in 1-on-1 chat
socket.emit('typing', { receiverId: 'user456', isTyping: true });

// Typing in group
socket.emit('groupTyping', { groupId: 'group123', isTyping: true });

// Join group room
socket.emit('joinGroup', 'group123');

// Leave group room
socket.emit('leaveGroup', 'group123');
```

### Server → Client Events
```javascript
// Online users list
socket.on('getOnlineUsers', (userIds) => {
  console.log('Online users:', userIds);
});

// New message
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});

// New group message
socket.on('newGroupMessage', (message) => {
  console.log('New group message:', message);
});

// User typing (1-on-1)
socket.on('userTyping', ({ userId, isTyping }) => {
  console.log(`User ${userId} is typing: ${isTyping}`);
});

// User typing (group)
socket.on('userGroupTyping', ({ userId, groupId, isTyping }) => {
  console.log(`User ${userId} typing in ${groupId}: ${isTyping}`);
});

// Message edited
socket.on('messageEdited', ({ messageId, text, editedAt }) => {
  console.log('Message edited:', messageId);
});

// Message deleted
socket.on('messageDeleted', ({ messageId, deletedAt }) => {
  console.log('Message deleted:', messageId);
});

// Reaction added/removed
socket.on('messageReaction', ({ messageId, userId, emoji, action }) => {
  console.log('Reaction:', action, emoji);
});

// Messages read
socket.on('messagesRead', ({ readBy, readAt }) => {
  console.log('Messages read by:', readBy);
});
```

## 🧪 Testing
```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Stats
- **Total:** 92 tests
- **Unit:** 39 tests (validation schemas, custom errors)
- **Integration:** 53 tests (API endpoints)
- **Pass Rate:** 100%
- **Test Isolation:** MongoDB Memory Server

### Test Structure
```
tests/
├── integration/
│   ├── auth.test.js      # 12 tests - Authentication flows
│   ├── messages.test.js  # 13 tests - Message operations
│   └── groups.test.js    # 28 tests - Group management
└── unit/
    ├── validation.test.js # 28 tests - Joi schemas
    └── errors.test.js     # 11 tests - Custom error classes
```

## 🐳 Docker

### Architecture
- **MongoDB** - Database container
- **Redis** - Cache/session container
- **Backend** - Node.js API container

### Development Mode
```bash
# Start with hot reload
npm run docker:dev

# Features:
# - Nodemon auto-restart
# - Volume mounting for live code changes
# - Debug logging enabled
# - All dev dependencies included
```

### Production Mode
```bash
# Build optimized image
npm run docker:prod

# Features:
# - Multi-stage build (smaller image)
# - Production-only dependencies
# - Non-root user for security
# - Health checks enabled
# - Compressed layers
```

### Useful Commands
```bash
# View backend logs
npm run docker:logs

# Stop and remove containers
npm run docker:dev:down

# Clean all Docker resources
npm run docker:clean

# Access running container
docker exec -it chat-backend-dev sh
```

## 🔒 Security Features

- ✅ **Helmet.js** - Security headers (XSS, clickjacking, etc.)
- ✅ **CORS** - Configured for frontend origin only
- ✅ **Rate Limiting** - 100 requests per 15 minutes (Redis-backed)
- ✅ **JWT** - httpOnly cookies (prevents XSS attacks)
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Input Validation** - Joi schemas on all endpoints
- ✅ **Request Timeouts** - 30-second timeout to prevent hanging
- ✅ **Error Sanitization** - No stack traces in production
- ✅ **Non-root Docker** - Containers run as unprivileged user

## 📊 Performance Optimizations

- ✅ **Response Compression** - Gzip compression for all responses
- ✅ **Redis Caching** - Rate limit store, online users, sessions
- ✅ **Connection Pooling** - Mongoose connection pooling
- ✅ **Cursor Pagination** - Efficient message retrieval
- ✅ **Index Optimization** - MongoDB indexes on frequent queries
- ✅ **Slow Query Logging** - Logs requests >1 second
- ✅ **Lazy Loading** - Socket.io events only when needed

## 🚀 Deployment

### Deploy to Render.com (Free Tier)

1. **Create Render account** - https://render.com

2. **Create Web Service**
   - Connect GitHub repository
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`

3. **Add Environment Variables** in Render dashboard:
```
   NODE_ENV=production
   MONGODB_URI=<your-atlas-uri>
   JWT_SECRET=<random-secret>
   CLOUDINARY_CLOUD_NAME=<your-cloud>
   CLOUDINARY_API_KEY=<your-key>
   CLOUDINARY_API_SECRET=<your-secret>
   CLIENT_URL=<your-frontend-url>
   REDIS_HOST=<optional>
   REDIS_PORT=6379
```

4. **Deploy!**

### Deploy with Docker
```bash
# Build production image
docker build -t chat-backend -f Dockerfile .

# Run container
docker run -d \
  -p 5001:5001 \
  --env-file .env \
  --name chat-api \
  chat-backend

# Or use docker-compose
docker-compose up -d
```

## 📈 Monitoring & Logs

### Health Check
```bash
curl http://localhost:5001/api/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-02T12:00:00.000Z",
  "uptime": 12345.67,
  "environment": "production"
}
```

### Logs
```bash
# View all logs
docker logs chat-backend

# Follow logs
docker logs -f chat-backend

# Last 100 lines
docker logs --tail 100 chat-backend
```

## 👨‍💻 Author

**Kushagra Pansari**  
- GitHub: [@KushagraPansari](https://github.com/KushagraPansari)
- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]

## 📄 License

ISC License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 Notes

- Redis is optional - application falls back to in-memory storage
- Image uploads require Cloudinary credentials
- MongoDB Atlas free tier is sufficient for development
- Tests require no external services (uses in-memory MongoDB)