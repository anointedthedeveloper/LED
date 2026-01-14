# LED - WhatsApp Bot Deployment Platform

A production-ready WhatsApp Bot-as-a-Service platform that allows users to deploy, manage, and redeploy WhatsApp bots using their own phone numbers.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LED Platform Stack                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js + React)                                  │
│  ├── Authentication (Firebase Auth)                          │
│  ├── Dashboard (Bot Management)                              │
│  ├── QR Code Pairing Interface                               │
│  └── Real-time Updates (Socket.IO)                           │
│                                                               │
│  Backend (Node.js + TypeScript)                              │
│  ├── Express REST API                                        │
│  ├── WhatsApp Service (Baileys)                              │
│  ├── Command Handler System                                  │
│  ├── Rate Limiting & Security                                │
│  └── Session Management                                      │
│                                                               │
│  Database (Firebase Firestore)                               │
│  ├── users, bots, sessions                                   │
│  ├── commands, logs, warnings                                │
│  └── deletedMessages (anti-delete)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
LED/
├── backend/
│   ├── src/
│   │   ├── commands/          # Modular command system
│   │   │   ├── registry.ts    # Command registry
│   │   │   ├── utility.ts     # Utility commands
│   │   │   ├── media.ts       # Media processing
│   │   │   ├── content.ts     # Content commands
│   │   │   ├── anime.ts       # Anime & lyrics
│   │   │   ├── search.ts      # Search & tools
│   │   │   └── admin.ts       # Admin commands
│   │   ├── services/
│   │   │   ├── whatsappService.ts    # Baileys integration
│   │   │   └── messageHandler.ts     # Message processing
│   │   ├── config/
│   │   │   ├── index.ts       # Environment config
│   │   │   └── firebase.ts    # Firebase setup
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript types
│   │   └── index.ts           # Express server
│   ├── sessions/              # WhatsApp sessions (gitignored)
│   ├── temp/                  # Temporary files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx      # Login page
│   │   │   ├── dashboard.tsx  # Main dashboard
│   │   │   └── bot/[id].tsx   # Bot detail page
│   │   ├── components/
│   │   │   ├── BotCard.tsx
│   │   │   └── CreateBotModal.tsx
│   │   ├── lib/
│   │   │   ├── api.ts         # API client
│   │   │   └── firebase.ts    # Firebase client
│   │   └── styles/
│   │       └── globals.css
│   └── package.json
│
└── package.json               # Monorepo root
```

## 🚀 Features

### Core Features
- ✅ Firebase Authentication (Email/Password + Email Link)
- ✅ Multi-bot management per user
- ✅ QR Code & Phone Number pairing
- ✅ Auto-reconnect on disconnect
- ✅ Session persistence in Firebase
- ✅ Real-time status updates
- ✅ Bot start/stop/redeploy

### Bot Features
- ✅ Modular command system (enable/disable per bot)
- ✅ Anti-delete messages
- ✅ Auto-view status
- ✅ Rate limiting (prevent bans)
- ✅ Admin-only commands
- ✅ Group moderation tools
- ✅ Warning system (3 strikes)
- ✅ Custom prefix per bot
- ✅ Sticker creation with metadata

### Implemented Commands

#### Utility
- `-alive` - Check bot status
- `-admin` - Check admin status
- `-delete` - Delete bot message

#### Media
- `-sticker` - Image/video to sticker
- `-toimg` - Sticker to image
- `-mp3` - Video to audio

#### Content
- `-joke` - Random joke
- `-meme` - Random meme
- `-quote` - Random quote
- `-fact` - Random fact
- `-advice` - Random advice

#### Anime & Lyrics
- `-anime <name>` - Search anime
- `-qpt [author]` - Poetry

#### Search & Tools
- `-news [category]` - Latest news
- `-tts <text>` - Text to speech
- `-dict <word>` - Dictionary
- `-urban <term>` - Urban dictionary

#### Admin Commands
- `-add <number>` - Add member
- `-ban @user` - Remove member
- `-promote @user` - Make admin
- `-demote @user` - Remove admin
- `-tagall [msg]` - Tag everyone
- `-warn @user` - Warn user
- `-unwarn @user` - Clear warnings
- `-link` - Get invite link

## 🔧 Installation

### Prerequisites
- Node.js 18+
- Firebase project
- API keys (optional for full features)

### Setup

1. **Clone and install dependencies**
```bash
cd LED
npm install
```

2. **Backend configuration**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Optional API Keys
NEWS_API_KEY=your_key
```

3. **Frontend configuration**
```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase Client Config (from Firebase Console > Project Settings > General)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Create required directories**
```bash
mkdir backend/sessions backend/temp
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication > Email/Password and Email Link (passwordless sign-in)
3. Add your domain to Authorized Domains (Authentication > Settings)
4. Create Firestore database
5. Set Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /bots/{botId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/bots/$(botId)).data.userId == request.auth.uid;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    match /logs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /warnings/{warningId} {
      allow read, write: if request.auth != null;
    }
    match /deletedMessages/{msgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 Running the Platform

### Development Mode

**Option 1: Run both together**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
npm run build
npm run start:backend  # Terminal 1
npm run start:frontend # Terminal 2
```

## 📱 Usage Flow

### 1. User Registration
1. Visit http://localhost:3000
2. Sign up with email/password OR use email link sign-in
3. For email link: Check email and click the link to complete sign-in
4. Redirected to dashboard

### 2. Create Bot
1. Click "Create Bot"
2. Optionally add phone number
3. Bot created with default config

### 3. Deploy Bot
1. Click "Start" on bot card
2. QR code appears (if not paired)
3. Scan with WhatsApp (Settings > Linked Devices)
4. Bot goes online

### 4. Configure Bot
1. Click "View Details" on bot
2. Enable/disable commands
3. Configure features (anti-delete, auto-view status)
4. Set custom prefix
5. Save changes

### 5. Redeploy Bot
1. Click redeploy button
2. Confirms action
3. Clears session
4. Generates new QR code
5. Re-pair with WhatsApp

## 🔐 Security Features

- Firebase Authentication with JWT tokens
- User data isolation in Firestore
- Rate limiting (20 requests/minute per user)
- Command-level rate limiting
- Admin-only command protection
- Input validation on all endpoints
- No hardcoded credentials
- Session encryption via Baileys

## 🗄️ Firebase Schema

### Collections

**users**
```typescript
{
  uid: string
  email: string
  displayName?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**bots**
```typescript
{
  id: string
  userId: string
  phoneNumber: string
  status: 'offline' | 'connecting' | 'online' | 'pairing_required' | 'banned' | 'error'
  sessionId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  lastConnected?: Timestamp
  config: {
    enabledCommands: string[]
    prefix: string
    adminNumbers: string[]
    autoViewStatus: boolean
    antiDelete: boolean
    stickerAuthor: string
    stickerPack: string
    rateLimitPerMinute: number
  }
}
```

**sessions**
```typescript
{
  botId: string
  userId: string
  creds: any
  keys: any
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**logs**
```typescript
{
  botId: string
  userId: string
  type: 'info' | 'error' | 'command' | 'connection'
  message: string
  metadata?: any
  timestamp: Timestamp
}
```

**warnings**
```typescript
{
  userId: string
  groupId: string
  warnedBy: string
  reason?: string
  count: number
  timestamp: Timestamp
}
```

## 🔄 Redeploy Logic

The redeploy feature allows users to reset their bot connection:

1. **Stop Bot**: Logout from WhatsApp session
2. **Clear Session**: Delete local session files
3. **Clear Firebase Session**: Remove session data
4. **Restart Bot**: Initialize new connection
5. **Generate QR**: New QR code for pairing
6. **Re-pair**: User scans new QR code

This is useful when:
- Bot is banned or logged out
- Session is corrupted
- User wants to link different number
- Connection issues persist

## 🚢 Deployment

### Backend (Node.js)

**Heroku**
```bash
cd backend
heroku create led-backend
heroku config:set FIREBASE_SERVICE_ACCOUNT='...'
git push heroku main
```

**Railway/Render**
- Connect GitHub repo
- Set environment variables
- Deploy from `backend` directory

### Frontend (Next.js)

**Vercel**
```bash
cd frontend
vercel
```

**Netlify**
```bash
cd frontend
npm run build
netlify deploy --prod --dir=.next
```

## 🛠️ Adding New Commands

1. Create command in appropriate file (e.g., `backend/src/commands/utility.ts`)

```typescript
const myCommand: Command = {
  name: 'mycommand',
  aliases: ['mc'],
  category: 'utility',
  description: 'My custom command',
  usage: '-mycommand <arg>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    await ctx.reply('Hello from my command!');
  }
};

commandRegistry.register(myCommand);
```

2. Import in `backend/src/commands/index.ts`
3. Command automatically available in dashboard

## 📊 Monitoring

- View logs in bot detail page (last 50 actions)
- Real-time status updates via Socket.IO
- Firebase console for database inspection
- Command usage tracking in logs collection

## 🐛 Troubleshooting

**Bot won't connect**
- Check Firebase credentials
- Verify session directory exists
- Check WhatsApp isn't logged in elsewhere

**QR code not showing**
- Wait 3-5 seconds after starting bot
- Check bot status is 'pairing_required'
- Redeploy bot if stuck

**Commands not working**
- Verify command is enabled in config
- Check prefix matches
- Ensure user has required permissions

**Rate limit errors**
- Reduce command frequency
- Increase rate limit in config
- Check for command loops

## 📝 License

MIT License - feel free to use for commercial projects

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues and questions:
- GitHub Issues
- Firebase documentation: https://firebase.google.com/docs
- Baileys documentation: https://github.com/WhiskeySockets/Baileys

---

Built with ❤️ using Node.js, React, Firebase, and Baileys
