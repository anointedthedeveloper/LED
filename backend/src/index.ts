import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { auth, collections } from './config/firebase';
import { whatsappService } from './services/whatsappService';
import { commandRegistry } from './commands';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Bot management
app.post('/api/bots', authenticateUser, async (req, res) => {
  try {
    const { phoneNumber, config: botConfig } = req.body;

    const botRef = await collections.bots.add({
      userId: req.userId,
      phoneNumber,
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {
        enabledCommands: commandRegistry.getAllCommands().map(c => c.name),
        prefix: '-',
        adminNumbers: [],
        autoViewStatus: false,
        antiDelete: false,
        stickerAuthor: 'LED Bot',
        stickerPack: 'LED',
        rateLimitPerMinute: 20,
        ...botConfig
      }
    });

    res.json({ success: true, botId: botRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bots', authenticateUser, async (req, res) => {
  try {
    const botsSnapshot = await collections.bots
      .where('userId', '==', req.userId)
      .get();

    const bots = botsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ bots });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bots/:botId', authenticateUser, async (req, res) => {
  try {
    const botDoc = await collections.bots.doc(req.params.botId).get();
    
    if (!botDoc.exists) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const bot = botDoc.data();
    if (bot?.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ bot: { id: botDoc.id, ...bot } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:botId/start', authenticateUser, async (req, res) => {
  try {
    const result = await whatsappService.startBot(req.params.botId, req.userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:botId/stop', authenticateUser, async (req, res) => {
  try {
    const success = await whatsappService.stopBot(req.params.botId);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:botId/redeploy', authenticateUser, async (req, res) => {
  try {
    const result = await whatsappService.redeployBot(req.params.botId, req.userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:botId/pair', authenticateUser, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const result = await whatsappService.pairWithPhoneNumber(req.params.botId, phoneNumber);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bots/:botId/qr', authenticateUser, async (req, res) => {
  try {
    const instance = whatsappService.getBotInstance(req.params.botId);
    if (!instance || !instance.qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }
    res.json({ qrCode: instance.qrCode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bots/:botId/config', authenticateUser, async (req, res) => {
  try {
    const botDoc = await collections.bots.doc(req.params.botId).get();
    
    if (!botDoc.exists) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const bot = botDoc.data();
    if (bot?.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await collections.bots.doc(req.params.botId).update({
      config: { ...bot.config, ...req.body },
      updatedAt: new Date()
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bots/:botId/logs', authenticateUser, async (req, res) => {
  try {
    const logsSnapshot = await collections.logs
      .where('botId', '==', req.params.botId)
      .where('userId', '==', req.userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commands', (req, res) => {
  const commands = commandRegistry.getAllCommands().map(cmd => ({
    name: cmd.name,
    aliases: cmd.aliases,
    category: cmd.category,
    description: cmd.description,
    usage: cmd.usage,
    adminOnly: cmd.adminOnly,
    groupOnly: cmd.groupOnly
  }));

  res.json({ commands });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe-bot', (botId: string) => {
    socket.join(`bot:${botId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in services
export { io };

const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`🚀 LED Backend running on port ${PORT}`);
});
