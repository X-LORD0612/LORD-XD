import 'dotenv/config';

export const config = {
  botName: process.env.BOT_NAME || 'LORD XD',
  ownerName: process.env.OWNER_NAME || 'X LORD',
  ownerNumber: (process.env.OWNER_NUMBER || '').replace(/\\D/g, ''),
  prefix: process.env.PREFIX || '.',
  sessionDir: process.env.SESSION_DIR || './session',
  pairingNumber: (process.env.PAIRING_NUMBER || '').replace(/\\D/g, ''),
  printQRInTerminal: false,
};
