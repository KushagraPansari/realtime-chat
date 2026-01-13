# Real-Time Chat Backend

Real-time chat application backend built with Node.js, Express, Socket.io, and MongoDB.

## Features

- JWT Authentication
- Real-time messaging with Socket.io
- Online user tracking
- Image uploads (Cloudinary)
- Winston logging

## Tech Stack

- Node.js & Express
- MongoDB Atlas
- Socket.io
- JWT & bcrypt
- Cloudinary

## Quick Start
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your values, then run
npm run dev
```

## Environment Variables

See `.env.example` for all required configuration:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret for JWT signing
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `CLIENT_URL` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (optional, default: info)

## Project Structure
```
src/
├── config/       # App configuration
├── controllers/  # Route handlers
├── middleware/   # Custom middleware
├── models/       # Database models
├── routes/       # API routes
├── utils/        # Utilities
└── index.js      # Entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/update-profile` - Update user profile
- `GET /api/auth/check` - Check authentication status

### Messages
- `GET /api/messages/users` - Get all users for sidebar
- `GET /api/messages/:id` - Get conversation with specific user
- `POST /api/messages/send/:id` - Send message to user

## Socket Events

**Client → Server:**
- `connection` - Connect with userId in query params

**Server → Client:**
- `getOnlineUsers` - List of online user IDs
- `newMessage` - Real-time message notification

## Roadmap

- [ ] Error handling middleware
- [ ] Input validation
- [ ] Rate limiting
- [ ] Group chats
- [ ] Message pagination
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Unit & integration tests
- [ ] Docker support

## Author

**Kushagra Pansari**  
GitHub: [@KushagraPansari](https://github.com/KushagraPansari)

## License

ISC