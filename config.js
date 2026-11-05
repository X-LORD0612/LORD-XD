import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';

const asBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

let savedSettings = {};
try {
  if (existsSync('./data/settings.json')) {
    savedSettings = JSON.parse(readFileSync('./data/settings.json', 'utf8'));
  }
} catch (error) {
  console.error('Could not read data/settings.json:', error.message);
}

export const config = {
  botName: process.env.BOT_NAME || 'LORD XD',
  owner: process.env.OWNER_NAME || 'X LORD',
  ownerNumber: process.env.OWNER_NUMBER || '919332544935',
  prefix: process.env.PREFIX || '.',
  mode: String(savedSettings.mode || process.env.MODE || 'public').toLowerCase(),
  hostingPlatform: process.env.HOSTING_PLATFORM || (process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Custom host'),
  pairingNumber: process.env.PAIRING_NUMBER || '',
  sessionDir: process.env.SESSION_DIR || './session',
  autoRead: asBool(process.env.AUTO_READ, false),
  alwaysOnline: asBool(process.env.ALWAYS_ONLINE, false)
};
