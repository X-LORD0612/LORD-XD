
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

import pino from 'pino';
import { config } from './config.js';
import { handleMessage } from './handler.js';

let isConnecting = false;
let reconnectTimer = null;

const logger = pino({ level: 'silent' });

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    console.log('╭━━〔 LORD XD 〕━━╮');
    console.log('┃ Starting bot...');
    console.log(`┃ Hosting: ${config.hostingPlatform}`);
    console.log('╰━━━━━━━━━━━━━━━━╯');

    const { state, saveCreds } =
      await useMultiFileAuthState(config.sessionDir);

    const sock = makeWASocket({
      auth: state,
      logger,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    let pairingRequested = false;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Pairing code
      if (
        qr &&
        !sock.authState.creds.registered &&
        !pairingRequested
      ) {
        pairingRequested = true;

        const number = String(config.pairingNumber || '')
          .replace(/\D/g, '');

        if (!number) {
          console.log(
            'ERROR: Set pairingNumber in config.js'
          );
          return;
        }

        try {
          const code = await sock.requestPairingCode(number);

          console.log('\n╭━━〔 LORD XD PAIRING 〕━━╮');
          console.log(`┃ CODE: ${code}`);
          console.log('╰━━━━━━━━━━━━━━━━━━━━━━╯');
          console.log('Enter this code in WhatsApp Linked Devices.');
        } catch (error) {
          console.error('Pairing error:', error.message);
          pairingRequested = false;
        }
      }

      if (connection === 'connecting') {
        console.log('Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        console.log('LORD XD connected successfully!');

        if (config.alwaysOnline) {
          await sock.sendPresenceUpdate('available');
        }
      }

      if (connection === 'close') {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        isConnecting = false;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(
            'Session logged out. Pair again to reconnect.'
          );
          return;
        }

        console.log('Connection closed. Reconnecting...');

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }

        reconnectTimer = setTimeout(() => {
          startBot();
        }, 5000);
      }
    });

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;

          if (config.autoRead) {
            await sock.readMessages([msg.key]);
          }

          const botConfig = {
            ...config,
            owner: config.owner ?? config.ownerName
          };

          await handleMessage(sock, msg, botConfig);

        } catch (error) {
          console.error('Message error:', error.message);
        }
      }
    });

  } catch (error) {
    console.error('Startup error:', error);

    isConnecting = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(startBot, 5000);
  }
}

startBot();
