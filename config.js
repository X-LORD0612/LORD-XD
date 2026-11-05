import 'dotenv/config';

const asBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const config = {
  botName: process.env.BOT_NAME || 'LORD XD',
  owner: process.env.OWNER_NAME || 'X LORD',
  ownerNumber: process.env.OWNER_NUMBER || '',
  prefix: process.env.PREFIX || '.',
  mode: (process.env.MODE || 'public').toLowerCase(),
  hostingPlatform: process.env.HOSTING_PLATFORM || '',
  pairingNumber: process.env.PAIRING_NUMBER || '',
  sessionDir: process.env.SESSION_DIR || './session',
  autoRead: asBool(process.env.AUTO_READ, false),
  alwaysOnline: asBool(process.env.ALWAYS_ONLINE, false),
  selfMode: asBool(process.env.SELF_MODE, false)
};
