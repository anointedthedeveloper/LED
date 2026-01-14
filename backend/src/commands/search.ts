import { Command } from '../types';
import { commandRegistry } from './registry';
import axios from 'axios';
import { config } from '../config';
import gtts from 'node-gtts';
import fs from 'fs';
import path from 'path';

const imgCommand: Command = {
  name: 'img',
  aliases: ['image'],
  category: 'search',
  description: 'Search images',
  usage: '-img <query>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -img <query>');
      return;
    }

    await ctx.reply('⚠️ Image search API integration required. Feature disabled.');
  }
};

const newsCommand: Command = {
  name: 'news',
  category: 'search',
  description: 'Get latest news',
  usage: '-news [category]',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (!config.apis.newsApiKey) {
      await ctx.reply('⚠️ News API key not configured');
      return;
    }

    try {
      const category = ctx.args[0] || 'general';
      const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          category,
          apiKey: config.apis.newsApiKey,
          pageSize: 5
        }
      });

      if (!data.articles || data.articles.length === 0) {
        await ctx.reply('❌ No news found');
        return;
      }

      let newsText = `📰 *Latest ${category.toUpperCase()} News*\n\n`;
      data.articles.slice(0, 5).forEach((article: any, i: number) => {
        newsText += `${i + 1}. *${article.title}*\n${article.description || ''}\n🔗 ${article.url}\n\n`;
      });

      await ctx.reply(newsText);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch news');
    }
  }
};

const ttsCommand: Command = {
  name: 'tts',
  category: 'tools',
  description: 'Text to speech',
  usage: '-tts <text>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -tts <text>');
      return;
    }

    const text = ctx.args.join(' ');
    const tempFile = path.join(__dirname, `../../temp/${Date.now()}.mp3`);

    try {
      await new Promise((resolve, reject) => {
        gtts('en').save(tempFile, text, (err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      const audioBuffer = fs.readFileSync(tempFile);
      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: true
      });

      fs.unlinkSync(tempFile);
    } catch (error) {
      await ctx.reply('❌ Failed to generate speech');
    }
  }
};

const removeBgCommand: Command = {
  name: 'removebg',
  aliases: ['rmbg'],
  category: 'tools',
  description: 'Remove image background',
  usage: '-removebg (reply to image)',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (!config.apis.removeBgKey) {
      await ctx.reply('⚠️ RemoveBG API key not configured');
      return;
    }

    await ctx.reply('⚠️ RemoveBG integration pending. Feature disabled.');
  }
};

const dictionaryCommand: Command = {
  name: 'dict',
  aliases: ['dictionary', 'define'],
  category: 'search',
  description: 'Get word definition',
  usage: '-dict <word>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -dict <word>');
      return;
    }

    const word = ctx.args[0];

    try {
      const { data } = await axios.get(`${config.apis.dictionaryApiUrl}/entries/en/${word}`);
      const entry = data[0];
      const meaning = entry.meanings[0];

      const text = `📖 *${entry.word}*\n\n` +
        `🔊 ${entry.phonetic || ''}\n\n` +
        `📝 *${meaning.partOfSpeech}*\n` +
        `${meaning.definitions[0].definition}`;

      await ctx.reply(text);
    } catch (error) {
      await ctx.reply('❌ Word not found');
    }
  }
};

const urbanCommand: Command = {
  name: 'urban',
  category: 'search',
  description: 'Urban dictionary lookup',
  usage: '-urban <term>',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      await ctx.reply('❌ Usage: -urban <term>');
      return;
    }

    const term = ctx.args.join(' ');

    try {
      const { data } = await axios.get(`${config.apis.urbanDictApiUrl}/define`, {
        params: { term }
      });

      if (!data.list || data.list.length === 0) {
        await ctx.reply('❌ Term not found');
        return;
      }

      const def = data.list[0];
      const text = `📚 *${def.word}*\n\n${def.definition.substring(0, 500)}\n\n_Example:_ ${def.example.substring(0, 200)}`;
      await ctx.reply(text);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch definition');
    }
  }
};

commandRegistry.register(imgCommand);
commandRegistry.register(newsCommand);
commandRegistry.register(ttsCommand);
commandRegistry.register(removeBgCommand);
commandRegistry.register(dictionaryCommand);
commandRegistry.register(urbanCommand);
