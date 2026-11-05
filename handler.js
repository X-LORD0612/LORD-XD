import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const startedAt = Date.now();

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

const digits = (value) => String(value || '').replace(/\D/g, '');
const formatUptime = () => {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h && h + 'h', m && m + 'm', s + 's'].filter(Boolean).join(' ');
};

function saveMode(mode) {
  mkdirSync('./data', { recursive: true });
  let settings = {};
  try { settings = JSON.parse(readFileSync('./data/settings.json', 'utf8')); } catch {}
  settings.mode = mode;
  writeFileSync('./data/settings.json', JSON.stringify(settings, null, 2));
}

function getTargets(msg, args) {
  const context = msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo || {};
  const mentioned = context.mentionedJid || [];
  if (mentioned.length) return mentioned;
  const number = digits(args[0]);
  return number ? [number + '@s.whatsapp.net'] : [];
}

export async function handleMessage(sock, msg, config) {
  const from = msg?.key?.remoteJid;
  if (!from || !msg?.message) return;
  const sender = msg.key.participant || from;
  const body = getMessageText(msg.message);
  if (!body.startsWith(config.prefix)) return;

  const args = body.slice(config.prefix.length).trim().split(/\s+/);
  const command = (args.shift() || '').toLowerCase();
  if (!command) return;

  const senderNumber = digits(sender.split('@')[0]);
  const ownerNumber = digits(config.ownerNumber);
  const isOwner = Boolean(ownerNumber && senderNumber.endsWith(ownerNumber));
  const isGroup = from.endsWith('@g.us');
  const reply = async (text) => sock.sendMessage(from, { text }, { quoted: msg });

  if (config.mode === 'private' && !isOwner) return;

  let metadata;
  let senderIsAdmin = false;
  let botIsAdmin = false;
  if (isGroup) {
    try {
      metadata = await sock.groupMetadata(from);
      const participants = metadata.participants || [];
      const senderJid = sender.split(':')[0];
      const botJid = sock.user?.id?.split(':')[0];
      senderIsAdmin = participants.some(p => p.id?.split(':')[0] === senderJid && (p.admin === 'admin' || p.admin === 'superadmin'));
      botIsAdmin = participants.some(p => p.id?.split(':')[0] === botJid && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch {}
  }

  const requireGroup = async () => {
    if (!isGroup) { await reply('यह command सिर्फ़ group में चलेगा।'); return false; }
    return true;
  };
  const requireGroupAdmin = async () => {
    if (!(await requireGroup())) return false;
    if (!isOwner && !senderIsAdmin) { await reply('यह command सिर्फ़ group admin या bot owner चला सकता है।'); return false; }
    if (!botIsAdmin) { await reply('पहले LORD XD को group admin बनाओ।'); return false; }
    return true;
  };

  switch (command) {
    case 'ping':
      await reply('Pong! 🏓\nLORD XD is online.');
      break;
    case 'alive':
      await reply(`╭━━〔 ${config.botName} 〕━━╮\n┃ Status: Online 🟢\n┃ Owner: ${config.owner}\n┃ Mode: ${config.mode}\n┃ Host: ${config.hostingPlatform}\n╰━━━━━━━━━━━━━━━━╯`);
      break;
    case 'owner':
      await reply(`╭━━〔 BOT OWNER 〕━━╮\n┃ Name: ${config.owner}\n┃ Number: ${config.ownerNumber}\n┃ Bot: ${config.botName}\n╰━━━━━━━━━━━━━━━━╯`);
      break;
    case 'uptime':
      await reply('⏱️ Uptime: ' + formatUptime());
      break;
    case 'botinfo':
      await reply(`🤖 ${config.botName}\nPrefix: ${config.prefix}\nMode: ${config.mode}\nHost: ${config.hostingPlatform}\nRuntime: Node.js ${process.version}`);
      break;
    case 'menu':
    case 'help':
      await reply(
        `╭━━〔 ${config.botName} MENU 〕━━╮\n` +
        `Prefix: ${config.prefix}\nMode: ${config.mode}\n\n` +
        '〔 GENERAL 〕\n' +
        '.ping  .alive  .owner\n.uptime  .botinfo  .menu\n\n' +
        '〔 GROUP 〕\n' +
        '.groupinfo  .tagall\n.kick @user  .add number\n.promote @user  .demote @user\n.groupdelete\n\n' +
        '〔 OWNER 〕\n' +
        '.public  .private  .mode\n.channeldelete channel-jid\n' +
        '\nNSFW commands are not included.\n╰━━━━━━━━━━━━━━━━━━━━╯'
      );
      break;
    case 'mode':
      await reply('Current mode: ' + config.mode + (isOwner ? '\nUse .public or .private to change it.' : ''));
      break;
    case 'public':
    case 'private':
      if (!isOwner) { await reply('यह command सिर्फ़ bot owner चला सकता है।'); break; }
      config.mode = command;
      saveMode(command);
      await reply('✅ LORD XD mode changed to ' + command.toUpperCase() + '.');
      break;
    case 'groupinfo':
      if (!(await requireGroup())) break;
      metadata ||= await sock.groupMetadata(from);
      await reply(`╭━━〔 GROUP INFO 〕━━╮\nName: ${metadata.subject}\nMembers: ${metadata.participants.length}\nOwner: ${metadata.owner || 'Unknown'}\n╰━━━━━━━━━━━━━━━━╯`);
      break;
    case 'tagall': {
      if (!(await requireGroupAdmin())) break;
      const mentions = (metadata.participants || []).map(p => p.id);
      const text = args.join(' ') || 'Attention everyone!';
      await sock.sendMessage(from, { text: `📢 ${text}\n\n` + mentions.map(jid => '@' + jid.split('@')[0]).join(' '), mentions }, { quoted: msg });
      break;
    }
    case 'kick':
    case 'add':
    case 'promote':
    case 'demote': {
      if (!(await requireGroupAdmin())) break;
      const targets = getTargets(msg, args);
      if (!targets.length) { await reply('किसी user को @mention करो या country code के साथ number दो।'); break; }
      const action = command === 'kick' ? 'remove' : command === 'add' ? 'add' : command;
      const result = await sock.groupParticipantsUpdate(from, targets, action);
      await reply(`✅ ${command} request sent.\n` + targets.map(j => j.split('@')[0]).join(', '));
      if (result?.some?.(item => item.status && item.status !== '200')) {
        await reply('कुछ users पर action पूरा नहीं हो पाया; group permissions जाँचें।');
      }
      break;
    }
    case 'groupdelete':
      if (!isOwner) { await reply('यह command सिर्फ़ bot owner चला सकता है।'); break; }
      if (!isGroup) { await reply('इसे उस group में चलाओ जिसे LORD XD छोड़ना चाहिए।'); break; }
      await reply('⚠️ LORD XD इस group को delete नहीं कर सकता; यह केवल group छोड़ सकता है।');
      await sock.groupLeave(from);
      break;
    case 'channeldelete': {
      if (!isOwner) { await reply('यह command सिर्फ़ bot owner चला सकता है।'); break; }
      const channelJid = args[0] || (from.endsWith('@newsletter') ? from : '');
      if (!channelJid || !channelJid.endsWith('@newsletter')) {
        await reply('Usage: .channeldelete channel-jid\nयह command केवल channel JID लेता है।');
        break;
      }
      if (typeof sock.newsletterDelete !== 'function') {
        await reply('इस Baileys version में channel delete API उपलब्ध नहीं है। Channel को WhatsApp/official tools से delete करें।');
        break;
      }
      await sock.newsletterDelete(channelJid);
      await reply('Channel delete request sent.');
      break;
    }
    default:
      await reply(`Unknown command. Available commands देखने के लिए ${config.prefix}menu भेजें।`);
  }
}
