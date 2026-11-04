function unwrapMessage(message) {
  let current = message;
  for (let i = 0; i < 6 && current; i++) {
    const next = current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.viewOnceMessageV2Extension?.message ||
      current.documentWithCaptionMessage?.message ||
      current.editedMessage?.message;
    if (!next) break;
    current = next;
  }
  return current || {};
}

function getMessageText(message) {
  const content = unwrapMessage(message);
  let interactiveText = '';
  const params = content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  if (params) {
    try {
      const parsed = JSON.parse(params);
      interactiveText = parsed.id || parsed.title || '';
    } catch {}
  }
  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    content.buttonsResponseMessage?.selectedButtonId ||
    content.listResponseMessage?.singleSelectReply?.selectedRowId ||
    content.templateButtonReplyMessage?.selectedId ||
    interactiveText ||
    ''
  ).trim();
}

export async function handleMessage(sock, msg, config) {
  const from = msg?.key?.remoteJid;
  if (!from || !msg?.message) return;
  const sender = msg.key.participant || from;
  const body = getMessageText(msg.message);
  console.log(`[DEBUG] textLength=${body.length} prefix=${JSON.stringify(config.prefix)} prefixMatched=${body.startsWith(config.prefix)}`);
  if (!body.startsWith(config.prefix)) return;

  const args = body.slice(config.prefix.length).trim().split(/\s+/);
  const command = (args.shift() || '').toLowerCase();
  if (!command) return;

  const botName = config.botName || 'LORD XD';
  const ownerName = config.owner || 'X LORD';
  const ownerNumber = String(config.ownerNumber || '').replace(/\D/g, '');
  const senderNumber = String(sender.split('@')[0] || '').replace(/\D/g, '');
  const isOwner = Boolean(ownerNumber && senderNumber.endsWith(ownerNumber));

  if (config.selfMode && !isOwner) return;
  if (String(config.mode || 'public').toLowerCase() === 'private' && !isOwner) return;

  console.log(`[COMMAND] ${command} | chat=${from.endsWith('@g.us') ? 'group' : 'private'}`);
  const reply = async (message) =>
    sock.sendMessage(from, { text: message }, { quoted: msg });

  switch (command) {
    case 'ping':
      await reply('Pong! 🏓\nLORD XD is online.');
      break;
    case 'alive':
      await reply(
        `╭━━〔 ${botName} 〕━━╮\n` +
        '┃ Status: Online 🟢\n' +
        `┃ Owner: ${ownerName}\n` +
        `┃ Mode: ${config.mode}\n` +
        `┃ Host: ${config.hostingPlatform}\n` +
        '╰━━━━━━━━━━━━━━━━╯'
      );
      break;
    case 'owner':
      await reply(
        `╭━━〔 BOT OWNER 〕━━╮\n` +
        `┃ Name: ${ownerName}\n` +
        `┃ Bot: ${botName}\n` +
        '╰━━━━━━━━━━━━━━━━╯'
      );
      break;
    case 'menu':
    case 'help':
      await reply(
        `╭━━〔 ${botName} MENU 〕━━╮\n` +
        `┃ Prefix: ${config.prefix}\n` +
        `┃ Host: ${config.hostingPlatform}\n` +
        `┃ Mode: ${config.mode}\n` +
        '┣━━━━━━━━━━━━━━━━\n' +
        `┃ ${config.prefix}ping\n` +
        `┃ ${config.prefix}alive\n` +
        `┃ ${config.prefix}owner\n` +
        `┃ ${config.prefix}groupinfo\n` +
        `┃ ${config.prefix}menu\n` +
        '╰━━━━━━━━━━━━━━━━╯'
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
        '╰━━━━━━━━━━━━━━━━╯'
      );
      break;
    }
    default:
      await reply(`Unknown command. Send ${config.prefix}menu to see available commands.`);
  }
}
