import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  WASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { collections } from '../config/firebase';
import { Bot, BotInstance, QRCodeData } from '../types';
import { MessageHandler } from './messageHandler';
import path from 'path';
import fs from 'fs';

export class WhatsAppService {
  private instances: Map<string, BotInstance> = new Map();
  private messageHandler: MessageHandler;
  private logger = pino({ level: 'info' });

  constructor() {
    this.messageHandler = new MessageHandler();
  }

  async startBot(botId: string, userId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const botDoc = await collections.bots.doc(botId).get();
      if (!botDoc.exists) {
        return { success: false, error: 'Bot not found' };
      }

      const bot = botDoc.data() as Bot;
      if (bot.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Stop existing instance if running
      if (this.instances.has(botId)) {
        await this.stopBot(botId);
      }

      const sessionPath = path.join(__dirname, '../../sessions', botId);
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        logger: this.logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger)
        },
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
          return { conversation: '' };
        }
      });

      let qrCodeData: string | undefined;

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          qrCodeData = await QRCode.toDataURL(qr);
          await collections.bots.doc(botId).update({
            status: 'pairing_required',
            updatedAt: new Date()
          });
          
          const instance = this.instances.get(botId);
          if (instance) {
            instance.qrCode = qrCodeData;
          }
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            await this.startBot(botId, userId);
          } else {
            await collections.bots.doc(botId).update({
              status: 'offline',
              updatedAt: new Date()
            });
            this.instances.delete(botId);
          }
        } else if (connection === 'open') {
          await collections.bots.doc(botId).update({
            status: 'online',
            lastConnected: new Date(),
            updatedAt: new Date()
          });

          const instance = this.instances.get(botId);
          if (instance) {
            instance.status = 'online';
            instance.qrCode = undefined;
          }

          await this.logActivity(botId, userId, 'connection', 'Bot connected successfully');
        }
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.messageHandler.handleMessage(sock, message, bot);
          }
        }
      });

      // Anti-delete feature
      sock.ev.on('messages.delete', async (deletedMsg) => {
        if (bot.config.antiDelete) {
          await this.handleDeletedMessage(sock, deletedMsg, botId);
        }
      });

      // Auto view status
      if (bot.config.autoViewStatus) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
          for (const msg of messages) {
            if (msg.key.remoteJid === 'status@broadcast') {
              await sock.readMessages([msg.key]);
            }
          }
        });
      }

      this.instances.set(botId, {
        botId,
        sock,
        status: 'connecting',
        qrCode: qrCodeData
      });

      return { success: true, qrCode: qrCodeData };
    } catch (error: any) {
      this.logger.error({ error, botId }, 'Failed to start bot');
      await this.logActivity(botId, userId, 'error', `Failed to start bot: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopBot(botId: string): Promise<boolean> {
    const instance = this.instances.get(botId);
    if (instance) {
      try {
        await instance.sock.logout();
      } catch (error) {
        this.logger.error({ error, botId }, 'Error during logout');
      }
      this.instances.delete(botId);
      await collections.bots.doc(botId).update({
        status: 'offline',
        updatedAt: new Date()
      });
      return true;
    }
    return false;
  }

  async redeployBot(botId: string, userId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    await this.stopBot(botId);
    
    // Clear session
    const sessionPath = path.join(__dirname, '../../sessions', botId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    return await this.startBot(botId, userId);
  }

  getBotInstance(botId: string): BotInstance | undefined {
    return this.instances.get(botId);
  }

  async pairWithPhoneNumber(botId: string, phoneNumber: string): Promise<{ success: boolean; code?: string; error?: string }> {
    const instance = this.instances.get(botId);
    if (!instance) {
      return { success: false, error: 'Bot not running' };
    }

    try {
      const code = await instance.sock.requestPairingCode(phoneNumber);
      return { success: true, code };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async handleDeletedMessage(sock: WASocket, deletedMsg: any, botId: string) {
    try {
      const deleted = await collections.deletedMessages
        .where('messageId', '==', deletedMsg.keys[0]?.id)
        .limit(1)
        .get();

      if (!deleted.empty) {
        const msgData = deleted.docs[0].data();
        await sock.sendMessage(deletedMsg.keys[0].remoteJid, {
          text: `🚫 *Anti-Delete*\n\nDeleted by: @${msgData.sender.split('@')[0]}\n\n${msgData.text || '[Media]'}`,
          mentions: [msgData.sender]
        });
      }
    } catch (error) {
      this.logger.error({ error, botId }, 'Failed to handle deleted message');
    }
  }

  private async logActivity(botId: string, userId: string, type: string, message: string) {
    await collections.logs.add({
      botId,
      userId,
      type,
      message,
      timestamp: new Date()
    });
  }
}

export const whatsappService = new WhatsAppService();
