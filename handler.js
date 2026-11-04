
function getMessageText(message) {
  if (!message) return '';

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    ''
  );
}

export async function handleMessage(sock, msg, config) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;
  const text = getMessageText(msg.message).trim();

  if (!text.startsWith(config.prefix)) return;

  const args = text.slice(config.prefix.length).trim().split(/\s+/);
  const command = (args.shift() || '').toLowerCase();

  if (!command) return;

  const botName = config.botName || 'LORD XD';
  const ownerName = config.ownerName || 'X LORD';

  const ownerNumber = String(config.ownerNumber || '')
    .replace(/\D/g, '');

  const senderNumber = sender.split('@')[0].replace(/\D/g, '');

  const isOwner =
    ownerNumber && senderNumber === ownerNumber;

  // Self mode
  if (config.selfMode && !isOwner) return;

  // Private mode
  if (config.mode === 'private' && !isOwner) return;

  const reply = (message) =>
    sock.sendMessage(from, { text: message }, { quoted: msg });

  switch (command) {
    case 'ping':
      await reply('Pong! 🏓\nLORD XD is online.');
      break;

    case 'alive':
      await reply(
        `╭━━〔 ${botName} 〕━━╮\n` +
        `┃ Status: Online 🟢\n` +
        `┃ Owner: ${ownerName}\n` +
        `┃ Mode: ${config.mode}\n` +
        `┃ Host: ${config.hostingPlatform}\n` +
        `╰━━━━━━━━━━━━━━━━╯`
      );
      break;

    case 'owner':
      await reply(
        `╭━━〔 BOT OWNER 〕━━╮\n` +
        `┃ Name: ${ownerName}\n` +
        `┃ Bot: ${botName}\n` +
        `╰━━━━━━━━━━━━━━━━╯`
      );
      break;

    case 'menu':
    case 'help':
      await reply(
        `╭━━〔 ${botName} MENU 〕━━╮\n` +
        `┃ Prefix: ${config.prefix}\n` +
        `┃ Host: ${config.hostingPlatform}\n` +
        `┃ Mode: ${config.mode}\n` +
        `┣━━━━━━━━━━━━━━━━\n` +
        `┃ .ping\n` +
        `┃ .alive\n` +
        `┃ .owner\n` +
        `┃ .menu\n` +
        `╰━━━━━━━━━━━━━━━━╯`
      );
      break;

    case 'groupinfo': {
      if (!from.endsWith('@g.us')) {
        await reply('This command only works in groups.');
        break;
      }

      const metadata = await sock.groupMetadata(from);

      await reply(
        `╭━━〔 GROUP INFO 〕━━╮\n` +
        `┃ Name: ${metadata.subject}\n` +
        `┃ Members: ${metadata.participants.length}\n` +
        `┃ Owner: ${metadata.owner || 'Unknown'}\n` +
        `╰━━━━━━━━━━━━━━━━╯`
      );
      break;
    }

    default:
      break;
  }
}
