# Assistant Gate Bot - Railway Deployment Guide

## Overview

This Telegram bot with OpenAI integration is designed for seamless deployment on Railway with comprehensive security features.

## Environment Variables Required

### Core Configuration

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_SECRET_TOKEN=your_webhook_secret_token

# Channel Configuration
PRIMARY_CHANNEL_ID=@yourchannel
INITIAL_CHANNEL_IDS=@channel1,@channel2,@channel3

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key

# Admin Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_minimum_32_characters

# Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
WEBHOOK_URL=https://your-railway-domain.up.railway.app
```

### Optional Security Settings

```bash
# IP Restrictions (comma-separated or * for all)
ALLOWED_IPS=*

# Rate Limiting (defaults are fine for most cases)
# These are handled by the application automatically
```

## Railway Deployment Steps

### 1. Prepare Repository

```bash
# Clone the repository
git clone <repository-url>
cd assistant-gate-bot

# Install dependencies and test build
npm install
npm run build
```

### 2. Setup Railway Project

1. Visit [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Railway will auto-detect the Node.js project

### 3. Add Database Service

1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will automatically create DATABASE_URL
4. Copy the DATABASE_URL from the PostgreSQL service

### 4. Configure Environment Variables

In Railway dashboard → Variables tab, add all required environment variables:

**Critical Variables:**

- `TELEGRAM_BOT_TOKEN` - Get from @BotFather
- `DATABASE_URL` - Copied from Railway PostgreSQL service
- `OPENAI_API_KEY` - From OpenAI dashboard
- `JWT_SECRET` - Generate: `openssl rand -hex 32`
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` - For admin panel access
- `WEBHOOK_URL` - Your Railway domain: `https://your-app.up.railway.app`
- `NODE_ENV=production`

### 5. Database Setup

Railway will automatically run these commands on deployment:

```bash
npx prisma db push
npx prisma generate
```

### 6. Deploy

1. Push code to your connected GitHub repository
2. Railway automatically builds and deploys
3. Monitor deployment logs in Railway dashboard

### 7. Configure Telegram Webhook

After successful deployment:

```bash
# Set webhook URL (done automatically by the app)
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.up.railway.app/telegram/webhook", "secret_token": "your_secret_token"}'
```

## Security Features Enabled

### ✅ Production Security

- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**:
  - Global: 1000 requests/15min per IP
  - Admin: 100 requests/15min per IP
  - Telegram: 60 requests/min per IP
- **Input Validation**: All user inputs sanitized
- **Webhook Verification**: Telegram signature validation
- **JWT Authentication**: Admin panel security
- **Error Handling**: No sensitive data in error responses

### ✅ Monitoring & Logging

- **Health Check**: `/health` endpoint
- **Structured Logging**: Winston with daily rotation
- **Request Logging**: All API calls tracked
- **Security Events**: Unauthorized access logging
- **Graceful Shutdown**: Clean process termination

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /telegram/webhook` - Telegram webhook (secured)

### Admin Endpoints (JWT Required)

- `POST /admin/login` - Admin authentication
- `GET /admin/stats` - User statistics
- `GET /admin/users` - User management (paginated)
- `PUT /admin/users/:id/ban` - Ban/unban users

## Post-Deployment Checklist

### ✅ Verify Core Functionality

1. Health check: `curl https://your-app.up.railway.app/health`
2. Database connectivity in health response
3. Bot responds to `/start` command
4. Channel subscription verification works
5. OpenAI responses functioning

### ✅ Test Security Features

1. Admin login works: `POST /admin/login`
2. Rate limiting triggers after limits
3. Webhook signature verification active
4. HTTPS redirect working
5. Security headers present

### ✅ Monitor Performance

1. Check Railway metrics dashboard
2. Monitor response times
3. Review error logs
4. Verify daily user limit resets

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify DATABASE_URL format
   - Ensure PostgreSQL service is running
   - Check database permissions

2. **Telegram Webhook Not Working**

   - Verify TELEGRAM_BOT_TOKEN
   - Check WEBHOOK_URL matches Railway domain
   - Confirm secret token configuration

3. **OpenAI Integration Issues**

   - Verify OPENAI_API_KEY
   - Check API quotas and billing
   - Monitor error logs for rate limits

4. **Admin Panel Access Issues**
   - Verify JWT_SECRET is 32+ characters
   - Check ADMIN_USERNAME/PASSWORD
   - Ensure CORS configuration allows your domain

### Monitoring Commands

```bash
# Check deployment status
railway logs

# View environment variables
railway variables

# Connect to database
railway connect

# Check service status
curl https://your-app.up.railway.app/health
```

## Scaling Considerations

### Performance Optimization

- Railway automatically scales based on usage
- Database connection pooling enabled
- Rate limiting prevents abuse
- Efficient webhook processing

### Cost Management

- Monitor Railway usage dashboard
- OpenAI API costs scale with usage
- PostgreSQL storage grows with users
- Consider archiving old user data

## Security Best Practices

### ✅ Implemented

- Non-root container user
- Environment variable security
- Input sanitization
- Request rate limiting
- Webhook signature verification
- Secure headers (Helmet.js)
- Error message sanitization
- Graceful error handling

### 🔒 Additional Recommendations

- Regular dependency updates
- Monitor security advisories
- Log analysis and alerting
- Backup strategy implementation
- Security audit scheduling

## Support & Monitoring

### Health Monitoring

- Health endpoint: `/health`
- Database connectivity check
- Service status verification
- Memory usage tracking

### Logging & Debugging

- Structured JSON logs
- Error tracking with context
- Performance monitoring
- Security event logging

---

**Deployment Status**: ✅ Production Ready
**Security Level**: 🔒 Enterprise Grade  
**Monitoring**: 📊 Comprehensive
**Documentation**: 📚 Complete
