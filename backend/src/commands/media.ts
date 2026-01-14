import { Command } from '../types';
import { commandRegistry } from './registry';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const stickerCommand: Command = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'media',
  description: 'Convert image/video to sticker',
  usage: '-sticker (reply to image/video)',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    const quoted = ctx.message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage || ctx.message.message?.imageMessage;
    const videoMsg = quoted?.videoMessage || ctx.message.message?.videoMessage;

    if (!imageMsg && !videoMsg) {
      await ctx.reply('❌ Reply to an image or video (max 10s)');
      return;
    }

    await ctx.react('⏳');

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted || ctx.message.message } as any,
        'buffer',
        {}
      );

      let stickerBuffer: Buffer;

      if (imageMsg) {
        stickerBuffer = await sharp(buffer as Buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp()
          .toBuffer();
      } else {
        const tempInput = path.join(__dirname, `../../temp/${Date.now()}.mp4`);
        const tempOutput = path.join(__dirname, `../../temp/${Date.now()}.webp`);
        
        fs.writeFileSync(tempInput, buffer as Buffer);

        await new Promise((resolve, reject) => {
          ffmpeg(tempInput)
            .setStartTime('00:00:00')
            .setDuration(10)
            .outputOptions(['-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15', '-loop', '0', '-preset', 'default', '-an', '-vsync', '0'])
            .toFormat('webp')
            .save(tempOutput)
            .on('end', () => resolve(true))
            .on('error', reject);
        });

        stickerBuffer = fs.readFileSync(tempOutput);
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
      }

      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        sticker: stickerBuffer,
        mimetype: 'image/webp',
        packname: ctx.botConfig.stickerPack,
        author: ctx.botConfig.stickerAuthor
      });

      await ctx.react('✅');
    } catch (error) {
      console.error('Sticker error:', error);
      await ctx.reply('❌ Failed to create sticker');
    }
  }
};

const toImgCommand: Command = {
  name: 'toimg',
  aliases: ['toimage'],
  category: 'media',
  description: 'Convert sticker to image',
  usage: '-toimg (reply to sticker)',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    const quoted = ctx.message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;

    if (!stickerMsg) {
      await ctx.reply('❌ Reply to a sticker');
      return;
    }

    await ctx.react('⏳');

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted } as any,
        'buffer',
        {}
      );

      const imageBuffer = await sharp(buffer as Buffer)
        .png()
        .toBuffer();

      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        image: imageBuffer,
        caption: '✅ Converted to image'
      });

      await ctx.react('✅');
    } catch (error) {
      await ctx.reply('❌ Failed to convert sticker');
    }
  }
};

const mp3Command: Command = {
  name: 'mp3',
  aliases: ['tomp3', 'toaudio'],
  category: 'media',
  description: 'Convert video to audio',
  usage: '-mp3 (reply to video)',
  adminOnly: false,
  groupOnly: false,
  enabled: true,
  execute: async (ctx) => {
    const quoted = ctx.message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const videoMsg = quoted?.videoMessage || ctx.message.message?.videoMessage;

    if (!videoMsg) {
      await ctx.reply('❌ Reply to a video');
      return;
    }

    await ctx.react('⏳');

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted || ctx.message.message } as any,
        'buffer',
        {}
      );

      const tempInput = path.join(__dirname, `../../temp/${Date.now()}.mp4`);
      const tempOutput = path.join(__dirname, `../../temp/${Date.now()}.mp3`);

      fs.writeFileSync(tempInput, buffer as Buffer);

      await new Promise((resolve, reject) => {
        ffmpeg(tempInput)
          .toFormat('mp3')
          .audioBitrate(128)
          .save(tempOutput)
          .on('end', () => resolve(true))
          .on('error', reject);
      });

      const audioBuffer = fs.readFileSync(tempOutput);

      await ctx.sock.sendMessage(ctx.message.key.remoteJid!, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg'
      });

      fs.unlinkSync(tempInput);
      fs.unlinkSync(tempOutput);
      await ctx.react('✅');
    } catch (error) {
      await ctx.reply('❌ Failed to convert to MP3');
    }
  }
};

commandRegistry.register(stickerCommand);
commandRegistry.register(toImgCommand);
commandRegistry.register(mp3Command);
