# ChirpTalks Server

A secure real-time chat application backend built with Node.js, Express, Socket.io, and MongoDB.

## Features

- 🔐 Secure authentication with JWT
- 💬 Real-time messaging with Socket.io
- 🛡️ Security headers and CORS protection
- ⚡ Rate limiting to prevent abuse
- 📊 Request logging and monitoring
- 🚀 Graceful shutdown handling
- 🏥 Health check endpoints
- 🔄 Environment variable validation

## Setup

1. Create a `.env` file in the `server` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/chirptalks

# Client URL for CORS (update this for production)
CLIENT_URL=http://localhost:3000

# JWT Secret (generate a strong secret for production)
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## API Endpoints

- `GET /` - Server status
- `GET /health` - Health check with MongoDB status
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

## Socket.io Events

- `connection` - User connects
- `disconnect` - User disconnects
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room

## Security Features

- ✅ Environment variable validation
- ✅ Secure CORS configuration
- ✅ Rate limiting (100 requests per 15 minutes per IP)
- ✅ Security headers (XSS protection, content type options, etc.)
- ✅ Request size limits (10MB)
- ✅ Graceful shutdown handling
- ✅ Error handling and logging
- ✅ MongoDB connection error handling

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |
| `CLIENT_URL` | Frontend URL for CORS | No | http://localhost:3000 |

## Development

The server includes comprehensive logging and error handling for development. Check the console for detailed logs with emojis for easy identification:

- 🚀 Server startup
- ✅ Successful operations
- ❌ Errors and warnings
- 🔌 Socket connections
- 👥 Room management

## Error Handling

The server now includes comprehensive error handling:

- **MongoDB Connection**: Proper async/await handling with graceful shutdown
- **JWT Authentication**: Better token validation and error messages
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Enhanced validation for user inputs
- **Logging**: Detailed error logging for debugging 