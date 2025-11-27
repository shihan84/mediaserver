# Quick Start Guide

## ✅ Application Status

The OvenMediaEngine Enterprise Frontend is now **RUNNING**!

### Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation (Swagger)**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

### Default Admin Credentials

- **Email**: admin@example.com
- **Password**: Admin123!

⚠️ **Important**: Change the default password immediately after first login!

## Current Status

✅ **Backend Server**: Running on port 3001
✅ **Frontend Server**: Running on port 3000
✅ **Database**: PostgreSQL connected and initialized
✅ **Admin User**: Created and ready to use

## Features Available

1. **User Management** - Create, update, and manage users with role-based access
2. **Channel Management** - Create and configure streaming channels
3. **SCTE-35 Markers** - Full CRUD operations for SCTE-35 markers
4. **Schedule Management** - Channel playout scheduling with recurrence
5. **Stream Monitoring** - Real-time stream metrics and monitoring
6. **Task Tracking** - Background task progress tracking
7. **AI Agent Chat** - Chat interface for system assistance
8. **Dashboard** - Overview of system statistics

## Next Steps

1. **Login**: Navigate to http://localhost:3000 and login with admin credentials
2. **Change Password**: Go to Settings and update your password
3. **Configure OME**: Update OME_API_URL and OME_API_KEY in backend/.env
4. **Create Users**: Add additional users with appropriate roles
5. **Set Up Channels**: Create your first streaming channel
6. **Configure Schedules**: Set up channel playout schedules

## Server Management

### Stop Servers
```bash
# Find and kill processes
pkill -f "tsx watch src/index.ts"  # Backend
pkill -f "vite"                      # Frontend
```

### Restart Backend
```bash
cd /root/omd/ome/backend
npm run dev
```

### Restart Frontend
```bash
cd /root/omd/ome/frontend
npm run dev
```

### View Logs
```bash
# Backend logs
tail -f /root/omd/ome/backend/logs/combined.log
tail -f /root/omd/ome/backend/logs/error.log
```

## Database Management

### Access Database
```bash
psql -U ome_user -d ome_db -h localhost
```

### Run Migrations
```bash
cd /root/omd/ome/backend
npx prisma migrate dev
```

### View Database Schema
```bash
cd /root/omd/ome/backend
npx prisma studio
```

## Troubleshooting

### Backend not starting
- Check if port 3001 is available: `netstat -tlnp | grep 3001`
- Check database connection in `.env`
- View logs: `tail -f backend/logs/combined.log`

### Frontend not starting
- Check if port 3000 is available: `netstat -tlnp | grep 3000`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Database connection issues
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check database credentials in `.env`
- Test connection: `psql -U ome_user -d ome_db -h localhost`

## Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in `.env` with a strong random string
- [ ] Configure CORS_ORIGIN for production
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable Redis password authentication
- [ ] Review and update rate limiting settings

## Support

For detailed documentation, see:
- `README.md` - Project overview
- `INSTALLATION.md` - Installation guide
- `PROJECT_SUMMARY.md` - Feature documentation

