import { Command } from '../types';
import { commandRegistry } from './registry';

const aliveCommand: Command = {
  name: 'alive',
  category: 'utility',
  description: 'Check if bot is alive',
  usage: '-alive',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    await ctx.reply(`✅ *LED Bot is Alive!*\n\n⏱️ Uptime: ${hours}h ${minutes}m\n🤖 Status: Online`);
  }
};

const adminCommand: Command = {
  name: 'admin',
  category: 'utility',
  description: 'Check admin status',
  usage: '-admin',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.isAdmin) {
      await ctx.reply('✅ You are an admin!');
    } else {
      await ctx.reply('❌ You are not an admin.');
    }
  }
};

const deleteCommand: Command = {
  name: 'delete',
  aliases: ['del'],
  category: 'utility',
  description: 'Delete bot message',
  usage: '-delete (reply to bot message)',
  adminOnly: true,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    const quotedMsg = ctx.message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
      await ctx.reply('❌ Reply to a bot message to delete it.');
      return;
    }

    const quotedKey = ctx.message.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (quotedKey) {
      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        delete: {
          remoteJid: ctx.message.key.remoteJid!,
          fromMe: true,
          id: quotedKey,
          participant: ctx.sock.user?.id
        }
      });
      await ctx.react('✅');
    }
  }
};

commandRegistry.register(aliveCommand);
commandRegistry.register(adminCommand);
commandRegistry.register(deleteCommand);
