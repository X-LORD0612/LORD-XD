import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { handleMessage } from './handler.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
const storePath = path.resolve('./data');
fs.mkdirSync(storePath, { recursive: true });

let reconnecting = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['LORD XD', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    getMessage: async () => undefined,
  });

  if (!sock.authState.creds.registered) {
    const number = config.pairingNumber || (await askPairingNumber());
    if (!/^\\d{10,15}$/.test(number)) {
      throw new Error('PAIRING_NUMBER must include country code and contain 10-15 digits.');
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    const code = await sock.requestPairingCode(number);
    console.log('\\n================================');
    console.log(' LORD XD PAIRING CODE:', code);
    console.log(' Enter this code in WhatsApp > Linked devices > Link a device.');
    console.log('================================\\n');
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      try {
        await handleMessage(sock, message);
      } catch (error) {
        logger.error({ err: error }, 'Message handler error');
      }
    }
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      reconnecting = false;
      console.log('LORD XD connected successfully.');
    }
    if (connection === 'close' && !reconnecting) {
      const status = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = status === DisconnectReason.loggedOut;
      if (!loggedOut) {
        reconnecting = true;
        console.log('Connection closed. Reconnecting...');
        setTimeout(() => startBot().catch(err => {
          reconnecting = false;
          logger.error({ err }, 'Reconnect failed');
        }), 3000);
      } else {
        console.error('Session logged out. Remove session folder and pair again.');
      }
    }
  });
}

async function askPairingNumber() {
  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('WhatsApp number with country code (digits only): ')).trim();
  rl.close();
  return answer.replace(/\\D/g, '');
}

process.on('uncaughtException', error => logger.error({ err: error }, 'Uncaught exception'));
process.on('unhandledRejection', error => logger.error({ err: error }, 'Unhandled rejection'));

startBot().catch(error => {
  console.error('Bot startup failed:', error.message);
  process.exitCode = 1;
});
