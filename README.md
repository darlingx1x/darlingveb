# DarlingX Quotes API

A modern quotes sharing platform with Telegram Login integration, built for Render.com deployment.

## Features

- 🔐 **Telegram Login**: Secure authentication using Telegram Login Widget
- 💾 **SQLite Database**: Persistent storage on Render Disk
- 🚀 **Render.com Ready**: Optimized for Render deployment
- 📱 **Responsive UI**: Clean, modern interface
- 🔒 **Secure**: HMAC verification, secure sessions, HTTPS ready
- 📊 **Health Monitoring**: Built-in health checks for Render

## Quick Start

### Prerequisites
- Node.js >= 18
- Telegram Bot Token (from @BotFather)
- Render.com account

### Local Development

1. **Clone and Install**:
   ```bash
   git clone <your-repo>
   cd darlingveb-main
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp config.env.example .env
   # Edit .env with your Telegram bot token and other settings
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Visit**: http://localhost:3000/quotes.html

### Database Operations

```bash
# Initialize database
npm run migrate

# Seed from GitHub (optional)
npm run seed:bd
```

## API Endpoints

### Authentication
- `POST /api/auth/telegram` - Telegram Login
- `POST /api/logout` - Logout user
- `GET /api/me` - Get current user

### Quotes
- `GET /api/quotes` - Get all quotes
- `POST /api/quotes` - Add new quote (requires auth)
- `DELETE /api/quotes/:id` - Delete quote (requires auth)

### System
- `GET /health` - Health check for Render

## Project Structure

```
darlingveb-main/
├── server.js              # Main ESM server
├── package.json           # Dependencies and scripts
├── src/
│   └── db.js             # SQLite database setup
├── public/               # Static files
│   ├── quotes.html       # Main quotes page
│   ├── index.html        # Landing page
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── fonts/            # Font files
├── scripts/
│   ├── migrate.js        # Database initialization
│   └── seed-from-github.js # GitHub seeding
├── config.env.example    # Environment variables template
└── server/               # Existing server (untouched)
```

## Deployment

### Render.com Setup

1. **Create Web Service**:
   - Connect GitHub repository
   - Build Command: `npm install && npm run migrate`
   - Start Command: `npm start`
   - Health Check Path: `/health`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   SESSION_SECRET=<strong_random_secret>
   TELEGRAM_BOT_TOKEN=<your_bot_token>
   DISK_PATH=/var/data
   ```

3. **Persistent Disk**:
   - Create 1GB disk
   - Mount at `/var/data`
   - Attach to web service

4. **Telegram Bot Configuration**:
   - Set domain to `your-app.onrender.com`
   - Configure bot commands

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Security

- **Telegram Auth**: HMAC-SHA256 verification of widget data
- **Session Security**: HttpOnly cookies, secure in production
- **Database**: SQLite with WAL mode for concurrency
- **Environment**: No hardcoded secrets

## Development

### Scripts
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm run migrate` - Initialize database
- `npm run seed:bd` - Seed from GitHub

### Environment Variables
See `config.env.example` for all required variables.

### Database Schema
```sql
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT,
  userId TEXT NOT NULL,
  username TEXT,
  createdAt TEXT NOT NULL
);
```

## Testing

### Manual Testing
1. Visit `/quotes.html`
2. Click Telegram Login widget
3. Authorize with Telegram
4. Add and delete quotes
5. Test logout functionality

### API Testing
```bash
# Health check
curl https://your-app.onrender.com/health

# Get quotes
curl https://your-app.onrender.com/api/quotes

# Check user session
curl https://your-app.onrender.com/api/me
```

## Monitoring

- **Health Checks**: `/health` endpoint for Render monitoring
- **Logs**: Available in Render Dashboard
- **Database**: SQLite file on persistent disk
- **Performance**: Built-in compression and caching

## Troubleshooting

### Common Issues

1. **Telegram Auth Fails**:
   - Check bot token
   - Verify domain configuration
   - Ensure bot is active

2. **Database Errors**:
   - Check disk mount
   - Verify `DISK_PATH` environment variable
   - Run `npm run migrate`

3. **Static Files Not Loading**:
   - Check `/public/` directory
   - Verify static middleware
   - Check file permissions

### Support
- Check Render logs
- Verify environment variables
- Test locally first
- Review Telegram bot configuration

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Telegram Login Widget
- Render.com for hosting
- SQLite for database
- Express.js for server framework 
