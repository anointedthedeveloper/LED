import { proto, WASocket } from '@whiskeysockets/baileys';
import { Bot, CommandContext } from '../types';
import { commandRegistry } from '../commands/registry';
import { collections } from '../config/firebase';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export class MessageHandler {
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.rateLimiter = new RateLimiterMemory({
      points: 10,
      duration: 60
    });
  }

  async handleMessage(sock: WASocket, message: proto.IWebMessageInfo, bot: Bot) {
    try {
      if (!message.message || message.key.fromMe) return;

      const messageText = this.extractMessageText(message);
      if (!messageText) return;

      // Store message for anti-delete
      if (bot.config.antiDelete) {
        await collections.deletedMessages.add({
          messageId: message.key.id,
          botId: bot.id,
          sender: message.key.participant || message.key.remoteJid,
          text: messageText,
          timestamp: new Date()
        });
      }

      // Check if message starts with prefix
      if (!messageText.startsWith(bot.config.prefix)) return;

      const sender = message.key.participant || message.key.remoteJid || '';
      
      // Rate limiting
      try {
        await this.rateLimiter.consume(sender);
      } catch (error) {
        await this.reply(sock, message, '⚠️ Too many requests. Please wait a moment.');
        return;
      }

      const args = messageText.slice(bot.config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = commandRegistry.getCommand(commandName);
      if (!command) return;

      // Check if command is enabled
      if (!bot.config.enabledCommands.includes(command.name)) {
        await this.reply(sock, message, '❌ This command is disabled.');
        return;
      }

      const isGroup = message.key.remoteJid?.endsWith('@g.us') || false;
      
      // Check group-only commands
      if (command.groupOnly && !isGroup) {
        await this.reply(sock, message, '❌ This command can only be used in groups.');
        return;
      }

      let isAdmin = false;
      let isBotAdmin = false;
      let groupMetadata;

      if (isGroup) {
        groupMetadata = await sock.groupMetadata(message.key.remoteJid!);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin' || 
                  bot.config.adminNumbers.includes(sender.split('@')[0]);
        
        const botNumber = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botNumber);
        isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      } else {
        isAdmin = bot.config.adminNumbers.includes(sender.split('@')[0]);
      }

      // Check admin-only commands
      if (command.adminOnly && !isAdmin) {
        await this.reply(sock, message, '❌ This command is only for admins.');
        return;
      }

      const context: CommandContext = {
        sock,
        message,
        args,
        sender,
        isGroup,
        isAdmin,
        isBotAdmin,
        groupMetadata,
        botConfig: bot.config,
        reply: (text: string) => this.reply(sock, message, text),
        react: (emoji: string) => this.react(sock, message, emoji)
      };

      await command.execute(context);

      // Log command usage
      await collections.logs.add({
        botId: bot.id,
        userId: bot.userId,
        type: 'command',
        message: `Command executed: ${command.name}`,
        metadata: { sender, args },
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('Error handling message:', error);
      await this.reply(sock, message, '❌ An error occurred while processing your command.');
    }
  }

  private extractMessageText(message: proto.IWebMessageInfo): string | null {
    return message.message?.conversation ||
           message.message?.extendedTextMessage?.text ||
           message.message?.imageMessage?.caption ||
           message.message?.videoMessage?.caption ||
           null;
  }

  private async reply(sock: WASocket, message: proto.IWebMessageInfo, text: string) {
    await sock.sendMessage(message.key.remoteJid!, {
      text
    }, {
      quoted: message
    });
  }

  private async react(sock: WASocket, message: proto.IWebMessageInfo, emoji: string) {
    await sock.sendMessage(message.key.remoteJid!, {
      react: {
        text: emoji,
        key: message.key
      }
    });
  }
}
