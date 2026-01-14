import { Command } from '../types';
import { commandRegistry } from './registry';
import axios from 'axios';
import { config } from '../config';

const jokeCommand: Command = {
  name: 'joke',
  category: 'content',
  description: 'Get a random joke',
  usage: '-joke',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      const { data } = await axios.get(`${config.apis.jokeApiUrl}/random_joke`);
      await ctx.reply(`😂 *${data.setup}*\n\n${data.punchline}`);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch joke');
    }
  }
};

const memeCommand: Command = {
  name: 'meme',
  category: 'content',
  description: 'Get a random meme',
  usage: '-meme',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      const { data } = await axios.get(`${config.apis.memeApiUrl}`);
      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        image: { url: data.url },
        caption: `😂 *${data.title}*\n\n👍 ${data.ups} upvotes`
      });
    } catch (error) {
      await ctx.reply('❌ Failed to fetch meme');
    }
  }
};

const quoteCommand: Command = {
  name: 'quote',
  category: 'content',
  description: 'Get a random quote',
  usage: '-quote',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      const { data } = await axios.get('https://api.quotable.io/random');
      await ctx.reply(`💭 *"${data.content}"*\n\n— ${data.author}`);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch quote');
    }
  }
};

const factCommand: Command = {
  name: 'fact',
  category: 'content',
  description: 'Get a random fact',
  usage: '-fact',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
      await ctx.reply(`🧠 *Random Fact*\n\n${data.text}`);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch fact');
    }
  }
};

const adviceCommand: Command = {
  name: 'advice',
  category: 'content',
  description: 'Get random advice',
  usage: '-advice',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    try {
      const { data } = await axios.get(`${config.apis.adviceApiUrl}/advice`);
      await ctx.reply(`💡 *Advice*\n\n${data.slip.advice}`);
    } catch (error) {
      await ctx.reply('❌ Failed to fetch advice');
    }
  }
};

commandRegistry.register(jokeCommand);
commandRegistry.register(memeCommand);
commandRegistry.register(quoteCommand);
commandRegistry.register(factCommand);
commandRegistry.register(adviceCommand);
