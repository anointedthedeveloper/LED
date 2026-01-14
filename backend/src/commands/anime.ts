import { Command } from '../types';
import { commandRegistry } from './registry';
import axios from 'axios';
import { config } from '../config';

const animeCommand: Command = {
  name: 'anime',
  category: 'anime',
  description: 'Search anime information',
  usage: '-anime <name>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -anime <name>');
      return;
    }

    const query = ctx.args.join(' ');

    try {
      const { data } = await axios.get(`${config.apis.animeApiUrl}/anime`, {
        params: { q: query, limit: 1 }
      });

      if (!data.data || data.data.length === 0) {
        await ctx.reply('❌ Anime not found');
        return;
      }

      const anime = data.data[0];
      const info = `🎌 *${anime.title}*\n\n` +
        `📺 Type: ${anime.type}\n` +
        `📊 Episodes: ${anime.episodes || 'N/A'}\n` +
        `⭐ Score: ${anime.score || 'N/A'}\n` +
        `📅 Status: ${anime.status}\n\n` +
        `📝 ${anime.synopsis?.substring(0, 300)}...`;

      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        image: { url: anime.images.jpg.large_image_url },
        caption: info
      });
    } catch (error) {
      await ctx.reply('❌ Failed to fetch anime info');
    }
  }
};

const lyricsCommand: Command = {
  name: 'l',
  aliases: ['lyrics'],
  category: 'lyrics',
  description: 'Search song lyrics',
  usage: '-l <song name>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -l <song name>');
      return;
    }

    await ctx.reply('⚠️ Lyrics API integration required. Feature disabled.');
  }
};

const poetryCommand: Command = {
  name: 'qpt',
  aliases: ['poetry'],
  category: 'lyrics',
  description: 'Get random poetry',
  usage: '-qpt [author]',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      let url = `${config.apis.poetryApiUrl}/random`;
      
      if (ctx.args.length > 0) {
        const author = ctx.args.join(' ');
        url = `${config.apis.poetryApiUrl}/author/${author}`;
      }

      const { data } = await axios.get(url);
      const poem = Array.isArray(data) ? data[0] : data;

      if (!poem) {
        await ctx.reply('❌ No poetry found');
        return;
      }

      const text = `📜 *${poem.title}*\n_by ${poem.author}_\n\n${poem.lines.slice(0, 10).join('\n')}`;
      await ctx.reply(text);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch poetry');
    }
  }
};

commandRegistry.register(animeCommand);
commandRegistry.register(lyricsCommand);
commandRegistry.register(poetryCommand);
