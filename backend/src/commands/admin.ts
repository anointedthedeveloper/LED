import { Command } from '../types';
import { commandRegistry } from './registry';
import { collections } from '../config/firebase';

const addCommand: Command = {
  name: 'add',
  category: 'admin',
  description: 'Add member to group',
  usage: '-add <number>',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    if (!ctx.isBotAdmin) {
      await ctx.reply('❌ Bot needs to be admin');
      return;
    }

    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -add <number>');
      return;
    }

    const number = ctx.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    try {
      await ctx.sock.groupParticipantsUpdate(ctx.message.key.remoteJid!, [number], 'add');
      await ctx.reply('✅ Member added successfully');
    } catch (error) {
      await ctx.reply('❌ Failed to add member');
    }
  }
};

const banCommand: Command = {
  name: 'ban',
  aliases: ['kick'],
  category: 'admin',
  description: 'Remove member from group',
  usage: '-ban @user',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    if (!ctx.isBotAdmin) {
      await ctx.reply('❌ Bot needs to be admin');
      return;
    }

    const mentioned = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      await ctx.reply('❌ Mention a user to ban');
      return;
    }

    try {
      await ctx.sock.groupParticipantsUpdate(ctx.message.key.remoteJid!, mentioned, 'remove');
      await ctx.reply('✅ Member removed successfully');
    } catch (error) {
      await ctx.reply('❌ Failed to remove member');
    }
  }
};

const promoteCommand: Command = {
  name: 'promote',
  category: 'admin',
  description: 'Promote member to admin',
  usage: '-promote @user',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    if (!ctx.isBotAdmin) {
      await ctx.reply('❌ Bot needs to be admin');
      return;
    }

    const mentioned = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      await ctx.reply('❌ Mention a user to promote');
      return;
    }

    try {
      await ctx.sock.groupParticipantsUpdate(ctx.message.key.remoteJid!, mentioned, 'promote');
      await ctx.reply('✅ Member promoted to admin');
    } catch (error) {
      await ctx.reply('❌ Failed to promote member');
    }
  }
};

const demoteCommand: Command = {
  name: 'demote',
  category: 'admin',
  description: 'Demote admin to member',
  usage: '-demote @user',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    if (!ctx.isBotAdmin) {
      await ctx.reply('❌ Bot needs to be admin');
      return;
    }

    const mentioned = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      await ctx.reply('❌ Mention a user to demote');
      return;
    }

    try {
      await ctx.sock.groupParticipantsUpdate(ctx.message.key.remoteJid!, mentioned, 'demote');
      await ctx.reply('✅ Admin demoted to member');
    } catch (error) {
      await ctx.reply('❌ Failed to demote admin');
    }
  }
};

const tagallCommand: Command = {
  name: 'tagall',
  aliases: ['everyone', 'all'],
  category: 'admin',
  description: 'Tag all group members',
  usage: '-tagall [message]',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    const message = ctx.args.join(' ') || 'Attention everyone!';
    const participants = ctx.groupMetadata?.participants.map((p: any) => p.id) || [];

    await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
      text: `📢 *${message}*`,
      mentions: participants
    });
  }
};

const warnCommand: Command = {
  name: 'warn',
  category: 'admin',
  description: 'Warn a user',
  usage: '-warn @user [reason]',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    const mentioned = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      await ctx.reply('❌ Mention a user to warn');
      return;
    }

    const userId = mentioned[0];
    const groupId = ctx.message.key.remoteJid!;
    const reason = ctx.args.slice(1).join(' ') || 'No reason provided';

    try {
      const warningRef = collections.warnings.doc(`${groupId}_${userId}`);
      const warningDoc = await warningRef.get();

      let count = 1;
      if (warningDoc.exists) {
        count = (warningDoc.data()?.count || 0) + 1;
      }

      await warningRef.set({
        userId,
        groupId,
        warnedBy: ctx.sender,
        reason,
        count,
        timestamp: new Date()
      });

      await ctx.reply(`⚠️ User warned (${count}/3)\nReason: ${reason}`);

      if (count >= 3 && ctx.isBotAdmin) {
        await ctx.sock.groupParticipantsUpdate(groupId, [userId], 'remove');
        await ctx.reply('🚫 User removed after 3 warnings');
        await warningRef.delete();
      }
    } catch (error) {
      await ctx.reply('❌ Failed to warn user');
    }
  }
};

const unwarnCommand: Command = {
  name: 'unwarn',
  category: 'admin',
  description: 'Remove warning from user',
  usage: '-unwarn @user',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    const mentioned = ctx.message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      await ctx.reply('❌ Mention a user');
      return;
    }

    const userId = mentioned[0];
    const groupId = ctx.message.key.remoteJid!;

    try {
      await collections.warnings.doc(`${groupId}_${userId}`).delete();
      await ctx.reply('✅ Warnings cleared');
    } catch (error) {
      await ctx.reply('❌ Failed to clear warnings');
    }
  }
};

const linkCommand: Command = {
  name: 'link',
  category: 'admin',
  description: 'Get group invite link',
  usage: '-link',
  adminOnly: true,
  groupOnly: true,
  enabled: true,
  execute: async (ctx) => {
    if (!ctx.isBotAdmin) {
      await ctx.reply('❌ Bot needs to be admin');
      return;
    }

    try {
      const code = await ctx.sock.groupInviteCode(ctx.message.key.remoteJid!);
      await ctx.reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);
    } catch (error) {
      await ctx.reply('❌ Failed to get invite link');
    }
  }
};

commandRegistry.register(addCommand);
commandRegistry.register(banCommand);
commandRegistry.register(promoteCommand);
commandRegistry.register(demoteCommand);
commandRegistry.register(tagallCommand);
commandRegistry.register(warnCommand);
commandRegistry.register(unwarnCommand);
commandRegistry.register(linkCommand);
