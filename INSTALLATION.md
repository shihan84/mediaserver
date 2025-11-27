# Installation Guide

This guide provides step-by-step instructions for installing and setting up the OvenMediaEngine Enterprise Frontend.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- **PostgreSQL** 14.0 or higher
- **Redis** 6.0 or higher (optional, for caching and session management)

## System Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Disk**: Minimum 5GB free space
- **Network**: Ports 3000 (frontend), 3001 (backend), 5432 (PostgreSQL), 6379 (Redis)

## Step 1: Install Node.js

If Node.js is not installed:

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE ome_db;
CREATE USER ome_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ome_db TO ome_user;
\q
```

## Step 3: Install Redis (Optional but Recommended)

```bash
# Ubuntu/Debian
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
```

## Step 4: Clone and Setup Project

```bash
# Navigate to project directory
cd /root/omd/ome

# Install root dependencies
npm install
```

## Step 5: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Generate a strong secret key
- `REDIS_HOST` and `REDIS_PORT`: Redis connection details
- `OME_API_URL`: Your OvenMediaEngine API URL
- `OME_API_KEY`: Your OME API key (if required)

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial admin user
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePassword123! npm run seed
```

## Step 6: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## Step 7: Start the Application

### Option 1: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Run from Root (if using workspaces)

```bash
cd /root/omd/ome
npm run dev
```

## Step 8: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

## Step 9: Initial Login

Use the credentials you set during seeding:
- **Email**: admin@example.com (or your ADMIN_EMAIL)
- **Password**: SecurePassword123! (or your ADMIN_PASSWORD)

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U ome_user -d ome_db -h localhost
```

### Redis Connection Issues

```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues

```bash
# Ensure proper permissions
sudo chown -R $USER:$USER /root/omd/ome
chmod -R 755 /root/omd/ome
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Build the frontend: `cd frontend && npm run build`
3. Build the backend: `cd backend && npm run build`
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start dist/index.js --name ome-backend
   ```
5. Use a reverse proxy (nginx) for the frontend
6. Set up SSL/TLS certificates
7. Configure firewall rules
8. Set up log rotation
9. Configure automatic backups

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable PostgreSQL SSL
- [ ] Configure Redis password
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up SSL/TLS
- [ ] Enable audit logging
- [ ] Regular security updates

## Next Steps

- Review the [README.md](./README.md) for feature documentation
- Check API documentation at `/api-docs`
- Configure OvenMediaEngine integration
- Set up monitoring and alerts
- Configure backup strategy


