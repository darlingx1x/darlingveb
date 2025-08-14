# Deployment Guide for Render.com

## Overview
This guide will help you deploy the Telegram Login + Quotes API to Render.com with persistent SQLite storage.

## Prerequisites
- Render.com account
- Telegram Bot Token (from @BotFather)
- GitHub repository with this code

## Step 1: Telegram Bot Setup

1. **Create a Telegram Bot**:
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Choose a name and username (e.g., `darlinxloginbot`)
   - Save the bot token

2. **Configure Bot Settings**:
   - Send `/setdomain` to @BotFather
   - Set domain to `darlingveb.onrender.com`
   - Send `/setcommands` and add:
     ```
     start - Start the bot
     help - Show help
     ```

## Step 2: Render.com Setup

### Create Web Service
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

### Service Configuration
- **Name**: `darlingveb-quotes`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run migrate`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### Environment Variables
Add these environment variables in Render Dashboard:

```
NODE_ENV=production
SESSION_SECRET=<generate_a_strong_random_secret>
TELEGRAM_BOT_TOKEN=<your_bot_token_from_botfather>
TELEGRAM_API_ID=1128987
TELEGRAM_API_HASH=8bf3240bbd1f38eb006b9213da7235a9
WEBHOOK_SECRET=<generate_random_secret>
WEBHOOK_URL=https://darlingveb.onrender.com/webhook
DISK_PATH=/var/data
GITHUB_BD_REPO=https://github.com/darlingx1x/bd.git
GITHUB_PAT=<optional_github_pat>
```

### Persistent Disk
1. In Render Dashboard, go to "Disks"
2. Click "Create Disk"
3. Configure:
   - **Name**: `quotes-data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB
   - **Attach to**: Your web service

## Step 3: Local Development

### Install Dependencies
```bash
npm install
```

### Environment Setup
1. Copy `config.env.example` to `.env`
2. Update the values with your actual credentials

### Run Locally
```bash
npm run dev
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get quotes
curl http://localhost:3000/api/quotes

# Check user session
curl http://localhost:3000/api/me
```

## Step 4: Database Operations

### Initialize Database
```bash
npm run migrate
```

### Seed from GitHub (Optional)
```bash
npm run seed:bd
```

This expects a `quotes.json` file in your GitHub repository with format:
```json
{
  "quotes": [
    {
      "text": "Your quote text",
      "author": "Author name",
      "username": "user123",
      "userId": "123456789",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Step 5: Testing

### Manual Testing
1. Visit `https://darlingveb.onrender.com/quotes.html`
2. Click the Telegram Login widget
3. Authorize with your Telegram account
4. Add a test quote
5. Verify it appears in the list
6. Test delete functionality

### API Testing
```bash
# Test health endpoint
curl https://darlingveb.onrender.com/health

# Test quotes endpoint
curl https://darlingveb.onrender.com/api/quotes

# Test authentication (requires valid Telegram auth)
curl -X POST https://darlingveb.onrender.com/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"id":"123","hash":"abc","auth_date":"1234567890"}'
```

## Step 6: Monitoring

### Render Dashboard
- Monitor logs in Render Dashboard
- Check disk usage
- Monitor service health

### Health Checks
- Endpoint: `GET /health`
- Expected response: `{"ok": true}`
- Render will use this for automatic health monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check if disk is properly mounted
   - Verify `DISK_PATH` environment variable
   - Check disk permissions

2. **Telegram Auth Failures**:
   - Verify bot token is correct
   - Check domain configuration in BotFather
   - Ensure bot is active

3. **Session Issues**:
   - Verify `SESSION_SECRET` is set
   - Check cookie settings in production
   - Ensure HTTPS is working

4. **Static Files Not Loading**:
   - Check if files are in `/public/` directory
   - Verify static middleware configuration
   - Check file permissions

### Logs
Check Render logs for detailed error information:
```bash
# In Render Dashboard → Logs
# Or via Render CLI
render logs --service your-service-name
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Telegram Auth**: Always verify HMAC signatures
3. **Session Security**: Use strong session secrets
4. **Rate Limiting**: Consider adding rate limiting for production
5. **HTTPS**: Render provides automatic HTTPS

## Performance Optimization

1. **Database**: SQLite with WAL mode for better concurrency
2. **Static Files**: Proper caching headers
3. **Compression**: Express compression middleware
4. **Monitoring**: Regular health checks

## Backup Strategy

1. **Database**: SQLite file is on persistent disk
2. **GitHub Integration**: Optional seeding from GitHub repo
3. **Manual Backup**: Download SQLite file from Render disk

## Support

For issues:
1. Check Render logs
2. Verify environment variables
3. Test locally first
4. Check Telegram bot configuration

## Next Steps

1. **Custom Domain**: Configure custom domain in Render
2. **SSL Certificate**: Automatic with Render
3. **Monitoring**: Set up external monitoring
4. **Backup**: Implement automated backup strategy 