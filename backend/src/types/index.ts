export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bot {
  id: string;
  userId: string;
  phoneNumber: string;
  status: 'offline' | 'connecting' | 'online' | 'pairing_required' | 'banned' | 'error';
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastConnected?: Date;
  config: BotConfig;
}

export interface BotConfig {
  enabledCommands: string[];
  prefix: string;
  adminNumbers: string[];
  autoViewStatus: boolean;
  antiDelete: boolean;
  welcomeMessage?: string;
  stickerAuthor: string;
  stickerPack: string;
  rateLimitPerMinute: number;
}

export interface Session {
  botId: string;
  userId: string;
  creds: any;
  keys: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Command {
  name: string;
  aliases?: string[];
  category: 'utility' | 'media' | 'content' | 'anime' | 'lyrics' | 'search' | 'tools' | 'admin' | 'group';
  description: string;
  usage: string;
  adminOnly: boolean;
  groupOnly: boolean;
  enabled: boolean;
  execute: (context: CommandContext) => Promise<void>;
}

export interface CommandContext {
  sock: any;
  message: any;
  args: string[];
  sender: string;
  isGroup: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  groupMetadata?: any;
  botConfig: BotConfig;
  reply: (text: string) => Promise<void>;
  react: (emoji: string) => Promise<void>;
}

export interface Log {
  botId: string;
  userId: string;
  type: 'info' | 'error' | 'command' | 'connection';
  message: string;
  metadata?: any;
  timestamp: Date;
}

export interface Warning {
  userId: string;
  groupId: string;
  warnedBy: string;
  reason?: string;
  count: number;
  timestamp: Date;
}

export interface QRCodeData {
  qr: string;
  timestamp: Date;
}

export interface BotInstance {
  botId: string;
  sock: any;
  status: Bot['status'];
  qrCode?: string;
}
