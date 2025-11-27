# OvenMediaEngine Enterprise Frontend

Enterprise-grade full-stack frontend for OvenMediaEngine with comprehensive management capabilities.

## Features

- **User Management**: Role-based access control (Admin, Operator, Viewer)
- **Channel Management**: Create, configure, and manage streaming channels
- **SCTE-35 Support**: Full CRUD operations for SCTE-35 markers
- **Schedule Management**: Channel playout scheduling with recurrence support
- **Real-time Monitoring**: Stream metrics and progress tracking via WebSocket
- **Task Management**: Background task tracking with progress persistence
- **AI Agent Chat**: Context-aware chat interface for system assistance
- **Security**: JWT authentication, rate limiting, audit logging
- **API Documentation**: OpenAPI/Swagger documentation

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript
- Prisma ORM with PostgreSQL
- WebSocket (ws) for real-time communication
- Redis for session management and caching
- Winston for logging
- JWT for authentication

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- Shadcn/ui components
- React Query for data fetching
- Zustand for state management
- React Router for navigation
- Socket.io client for WebSocket

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the backend:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ome_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
# For production with domain, use:
# CORS_ORIGIN=https://obe.imagetv.in

# OvenMediaEngine API
OME_API_URL=http://localhost:8081
OME_API_KEY=your-ome-api-key

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Production Deployment with Domain

### Configuring for Domain: `obe.imagetv.in`

When deploying with a custom domain, update the following:

#### Backend Configuration

1. **Update CORS_ORIGIN in backend/.env:**
```env
CORS_ORIGIN=https://obe.imagetv.in
NODE_ENV=production
```

2. **Set NODE_ENV to production** to enable production optimizations.

#### Frontend Configuration

The frontend automatically detects the environment and uses the correct URLs:
- **Development**: Uses `localhost` for API and WebSocket connections
- **Production**: Uses the same host/domain as the frontend (automatically detected)

#### Reverse Proxy Setup (Nginx Example)

If using Nginx as a reverse proxy, configure it as follows:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name obe.imagetv.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name obe.imagetv.in;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend (React build)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Building Frontend for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` directory, ready to be served by your web server.

## API Documentation

Once the backend is running, access the Swagger documentation at:
`http://localhost:3001/api-docs`

## Default Admin User

After running migrations, create an admin user via the API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "SecurePassword123!",
    "role": "ADMIN"
  }'
```

## Project Structure

```
ome/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   ├── utils/           # Utilities (logger, validation, etc.)
│   │   ├── services/        # Redis, config backup
│   │   ├── websocket/       # WebSocket server
│   │   └── config/          # Configuration files
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout components
│   │   ├── lib/             # Utilities and API client
│   │   └── store/            # State management
│   └── package.json
└── README.md
```

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure WebSocket connections
- Comprehensive audit logging
- Password hashing with bcrypt

## License

Proprietary - All rights reserved


