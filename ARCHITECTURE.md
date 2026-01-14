# LED Platform - Deployment Architecture

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Browser    │    │   WhatsApp   │    │   Mobile     │      │
│  │   Desktop    │    │   Mobile     │    │   Browser    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
└─────────┼────────────────────┼────────────────────┼──────────────┘
          │                    │                    │
          │ HTTPS              │ WhatsApp Protocol  │ HTTPS
          │                    │                    │
┌─────────▼────────────────────▼────────────────────▼──────────────┐
│                      Application Layer                            │
│  ┌────────────────────────────────────────────────────────┐      │
│  │              Next.js Frontend (Vercel)                 │      │
│  │  - React Components                                    │      │
│  │  - Firebase Auth Client                                │      │
│  │  - Socket.IO Client                                    │      │
│  │  - QR Code Display                                     │      │
│  └────────────────┬───────────────────────────────────────┘      │
│                   │ REST API / WebSocket                          │
│  ┌────────────────▼───────────────────────────────────────┐      │
│  │         Node.js Backend (Railway/Heroku)               │      │
│  │  ┌──────────────────────────────────────────────────┐  │      │
│  │  │  Express Server + Socket.IO                      │  │      │
│  │  │  - Authentication Middleware                     │  │      │
│  │  │  - Rate Limiting                                 │  │      │
│  │  │  - API Routes                                    │  │      │
│  │  └──────────────────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────────────────┐  │      │
│  │  │  Bot Manager Service                             │  │      │
│  │  │  - Start/Stop/Redeploy                           │  │      │
│  │  │  - Instance Management                           │  │      │
│  │  │  - Session Lifecycle                             │  │      │
│  │  └──────────────────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────────────────┐  │      │
│  │  │  WhatsApp Service (Baileys)                      │  │      │
│  │  │  - Multi-device API                              │  │      │
│  │  │  - QR Code Generation                            │  │      │
│  │  │  - Message Handling                              │  │      │
│  │  │  - Auto-reconnect                                │  │      │
│  │  └──────────────────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────────────────┐  │      │
│  │  │  Command Handler System                          │  │      │
│  │  │  - Command Registry                              │  │      │
│  │  │  - Permission Checks                             │  │      │
│  │  │  - Rate Limiting                                 │  │      │
│  │  │  - Modular Commands                              │  │      │
│  │  └──────────────────────────────────────────────────┘  │      │
│  └────────────────────────────────────────────────────────┘      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ Firebase SDK
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      Data Layer                                   │
│  ┌────────────────────────────────────────────────────────┐      │
│  │              Firebase Services                         │      │
│  │  ┌──────────────────┐  ┌──────────────────┐           │      │
│  │  │  Authentication  │  │    Firestore     │           │      │
│  │  │  - Email/Pass    │  │  - users         │           │      │
│  │  │  - JWT Tokens    │  │  - bots          │           │      │
│  │  │  - User Mgmt     │  │  - sessions      │           │      │
│  │  └──────────────────┘  │  - commands      │           │      │
│  │                        │  - logs          │           │      │
│  │                        │  - warnings      │           │      │
│  │                        └──────────────────┘           │      │
│  └────────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────────┘
```

## Bot Lifecycle Management

### 1. Bot Creation Flow

```
User Action → Frontend → Backend → Firebase
    │            │          │          │
    │            │          │          ├─ Create bot document
    │            │          │          ├─ Initialize config
    │            │          │          └─ Return bot ID
    │            │          │
    │            │          └─ Generate default config
    │            │
    │            └─ Send POST /api/bots
    │
    └─ Click "Create Bot"
```

### 2. Bot Deployment Flow

```
Start Bot Request
    │
    ├─ Check if bot exists
    │
    ├─ Stop existing instance (if running)
    │
    ├─ Load/Create session directory
    │
    ├─ Initialize Baileys socket
    │   ├─ Load auth state
    │   ├─ Connect to WhatsApp servers
    │   └─ Register event handlers
    │
    ├─ Generate QR code (if not paired)
    │   └─ Send to frontend via Socket.IO
    │
    ├─ Wait for pairing
    │   ├─ User scans QR
    │   └─ Connection established
    │
    ├─ Update bot status → 'online'
    │
    └─ Start message handling
        ├─ Listen for messages
        ├─ Process commands
        └─ Execute actions
```

### 3. Redeploy Flow

```
Redeploy Request
    │
    ├─ Verify user ownership
    │
    ├─ Stop bot instance
    │   └─ Logout from WhatsApp
    │
    ├─ Clear session data
    │   ├─ Delete local session files
    │   └─ Remove Firebase session
    │
    ├─ Restart bot (same as deployment)
    │   ├─ Generate new QR code
    │   └─ Wait for re-pairing
    │
    └─ Update status & notify user
```

## Message Processing Pipeline

```
WhatsApp Message Received
    │
    ├─ Extract message text
    │
    ├─ Store for anti-delete (if enabled)
    │
    ├─ Check if starts with prefix
    │   └─ No → Ignore
    │
    ├─ Parse command & arguments
    │
    ├─ Rate limiting check
    │   └─ Exceeded → Send warning
    │
    ├─ Find command in registry
    │   └─ Not found → Ignore
    │
    ├─ Check if command enabled
    │   └─ Disabled → Send error
    │
    ├─ Permission checks
    │   ├─ Admin-only → Verify admin
    │   └─ Group-only → Verify group
    │
    ├─ Build command context
    │   ├─ Socket connection
    │   ├─ Message data
    │   ├─ User permissions
    │   └─ Bot config
    │
    ├─ Execute command
    │   ├─ Process logic
    │   ├─ API calls (if needed)
    │   └─ Send response
    │
    └─ Log command execution
```

## Scalability Considerations

### Multi-Bot Architecture

Each bot runs as an isolated instance:
- Separate Baileys socket connection
- Independent session management
- Isolated message handlers
- Per-bot rate limiting

### Resource Management

```typescript
BotInstance {
  botId: string
  sock: WASocket
  status: BotStatus
  qrCode?: string
  lastActivity: Date
}

// In-memory map
instances: Map<botId, BotInstance>

// Cleanup inactive bots
setInterval(() => {
  instances.forEach((instance, botId) => {
    if (isInactive(instance)) {
      stopBot(botId);
    }
  });
}, 3600000); // 1 hour
```

### Database Optimization

**Firestore Indexes:**
```
Collection: bots
- userId (ascending)
- status (ascending)
- createdAt (descending)

Collection: logs
- botId (ascending)
- timestamp (descending)
- Limit: 50

Collection: warnings
- groupId_userId (composite key)
```

## Security Architecture

### Authentication Flow

```
1. User Login
   ├─ Firebase Auth (email/password)
   ├─ Generate JWT token
   └─ Store in client

2. API Request
   ├─ Extract Bearer token
   ├─ Verify with Firebase Admin
   ├─ Decode user ID
   └─ Attach to request

3. Authorization
   ├─ Check resource ownership
   ├─ Verify bot.userId === req.userId
   └─ Allow/Deny access
```

### Rate Limiting Strategy

**User-level:**
- 20 requests/minute to API
- Prevents API abuse

**Command-level:**
- 10 commands/minute per user
- Prevents WhatsApp bans

**Implementation:**
```typescript
RateLimiterMemory({
  points: 10,
  duration: 60
})

// Per user/sender
await rateLimiter.consume(sender);
```

### Data Isolation

**Firestore Rules:**
- Users can only read/write their own data
- Bot access verified by userId
- Logs scoped to user's bots
- Sessions encrypted by Baileys

## Deployment Strategies

### Backend Deployment Options

**1. Railway (Recommended)**
- Easy Node.js deployment
- Persistent storage for sessions
- Environment variables
- Auto-scaling

**2. Heroku**
- Dyno-based pricing
- Add-ons for monitoring
- Ephemeral filesystem (use Firebase for sessions)

**3. AWS EC2**
- Full control
- Custom scaling
- More complex setup

**4. Docker Container**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Frontend Deployment Options

**1. Vercel (Recommended)**
- Optimized for Next.js
- Automatic deployments
- Edge network
- Free tier

**2. Netlify**
- Similar to Vercel
- Good Next.js support

**3. AWS Amplify**
- AWS integration
- CI/CD pipeline

## Monitoring & Logging

### Application Logs

```typescript
// Winston logger
logger.info('Bot started', { botId, userId });
logger.error('Command failed', { error, command });
logger.warn('Rate limit exceeded', { sender });
```

### Firebase Logs Collection

```typescript
{
  botId: string
  userId: string
  type: 'info' | 'error' | 'command' | 'connection'
  message: string
  metadata: any
  timestamp: Timestamp
}
```

### Real-time Monitoring

- Socket.IO for live updates
- Bot status changes
- QR code updates
- Connection events

## Performance Optimization

### Session Caching

- Store sessions in memory
- Persist to Firebase on change
- Load on bot start

### Command Registry

- Pre-load all commands on startup
- O(1) lookup by name/alias
- No runtime registration

### Media Processing

- Use streams for large files
- Temporary file cleanup
- Sharp for image optimization
- FFmpeg for video processing

## Disaster Recovery

### Session Backup

- Auto-save sessions to Firebase
- Restore on reconnect
- Manual backup via redeploy

### Bot Recovery

```typescript
// Auto-reconnect on disconnect
sock.ev.on('connection.update', async (update) => {
  if (connection === 'close') {
    const shouldReconnect = 
      statusCode !== DisconnectReason.loggedOut;
    
    if (shouldReconnect) {
      await startBot(botId, userId);
    }
  }
});
```

### Data Backup

- Firebase automatic backups
- Export Firestore data regularly
- Version control for code

## Cost Estimation

### Firebase (Free Tier)
- 50K reads/day
- 20K writes/day
- 1GB storage
- Sufficient for 10-20 active bots

### Backend Hosting
- Railway: $5-20/month
- Heroku: $7-25/month
- AWS EC2: $10-50/month

### Frontend Hosting
- Vercel: Free
- Netlify: Free

### Total: $5-50/month depending on scale

## Future Enhancements

1. **Multi-user bot sharing**
2. **Bot templates/presets**
3. **Analytics dashboard**
4. **Webhook integrations**
5. **Custom command builder (no-code)**
6. **Bot marketplace**
7. **Team collaboration**
8. **Advanced scheduling**
9. **AI-powered responses**
10. **Payment integration**
