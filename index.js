import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

import P from 'pino';
import fs from 'node:fs';
import { config } from './config.js';
import { handleMessage } from './handler.js';

const logger = P({ level: 'info' });
let reconnecting = false;

async function startBot() {
  fs.mkdirSync(config.sessionDir, { recursive: true });

  const { state, saveCreds } =
    await useMultiFileAuthState(config.sessionDir);

  let version;

  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    logger.warn('Using default WhatsApp version');
  }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['LORD XD', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      reconnecting = false;
      logger.info('LORD XD CONNECTED SUCCESSFULLY!');
    }

    if (connection === 'close') {
      const status =
        lastDisconnect?.error?.output?.statusCode;

      if (status === DisconnectReason.loggedOut) {
        logger.error('Session logged out. Pair again.');
        return;
      }

      if (!reconnecting) {
        reconnecting = true;
        logger.info('Reconnecting in 5 seconds...');

        setTimeout(() => {
          reconnecting = false;
          startBot().catch(console.error);
        }, 5000);
      }
    }
  });

  if (!state.creds.registered) {
    const number = config.pairingNumber.replace(/\D/g, '');

    if (!number) {
      logger.error('PAIRING_NUMBER is missing!');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const code = await sock.requestPairingCode(number);
      logger.info(`PAIRING CODE: ${code}`);
      logger.info('Enter this code in WhatsApp Linked Devices.');
    } catch (error) {
      logger.error(error, 'Pairing code failed');
    }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      try {
        await handleMessage(sock, message, config);
      } catch (error) {
        logger.error(error);
      }
    }
  });
}

startBot().catch(error => {
  logger.error(error);
  process.exit(1);
});
