import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './config.js';
import { handleMessage } from './handler.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
let starting = false;
let reconnectTimer;
let pairingStarted = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startBot() {
  if (starting) return;
  starting = true;

  try {
    console.log('╭━━〔 LORD XD 〕━━╮');
    console.log('┃ Starting bot...');
    console.log(`┃ Hosting: ${config.hostingPlatform}`);
    console.log('╰━━━━━━━━━━━━━━━━╯');

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const sock = makeWASocket({
      auth: state,
      logger,
      markOnlineOnConnect: config.alwaysOnline,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    // Pairing codes are requested after socket creation, not on a QR event.
    if (!state.creds.registered && !pairingStarted) {
      const number = String(config.pairingNumber || '').replace(/\D/g, '');
      if (!number) {
        console.error('PAIRING_NUMBER is missing. Set it in the host environment.');
      } else {
        pairingStarted = true;
        await sleep(1500);
        try {
          const code = await sock.requestPairingCode(number);
          console.log('\n╭━━〔 LORD XD PAIRING 〕━━╮');
          console.log(`┃ CODE: ${code}`);
          console.log('╰━━━━━━━━━━━━━━━━━━━━━━╯');
          console.log('Enter this code in WhatsApp > Linked devices > Link with phone number.');
        } catch (error) {
          pairingStarted = false;
          console.error('Pairing code request failed:', error?.message || error);
        }
      }
    }

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
      if (connection === 'connecting') {
        console.log('Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        starting = false;
        pairingStarted = false;
        console.log('LORD XD connected successfully!');
      }

      if (connection === 'close') {
        starting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Session logged out. Remove the old session and pair again.');
          return;
        }

        console.log('Connection closed. Reconnecting in 5 seconds...');
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          startBot().catch((error) => console.error('Reconnect error:', error));
        }, 5000);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;
          if (config.autoRead) await sock.readMessages([msg.key]);
          await handleMessage(sock, msg, config);
        } catch (error) {
          console.error('Message handling error:', error?.message || error);
        }
      }
    });
  } catch (error) {
    starting = false;
    console.error('Startup error:', error?.stack || error);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      startBot().catch((err) => console.error('Reconnect error:', err));
    }, 5000);
  }
}

startBot().catch((error) => console.error('Fatal startup error:', error));
