import 'dotenv/config';

export const config = {
  botName: 'LORD XD',

  owner: 'X LORD',
  ownerNumber: process.env.OWNER_NUMBER || '',

  prefix: '.',

  mode: process.env.MODE || 'public',

  hostingPlatform:
    process.env.HOSTING_PLATFORM || 'KataBump',

  sessionDir: './session'
};
