import { getGroupSettings, setGroupSetting } from './group-settings.js';

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

const digits = (jid = '') => String(jid).split('@')[0].replace(/\D/g, '');
const isGroup = (jid) => String(jid || '').endsWith('@g.us');

async function getGroupRoles(sock, groupJid, senderJid) {
  const metadata = await sock.groupMetadata(groupJid);
  const participants = metadata.participants || [];
  const botJid = sock.user?.id || '';
  const find = (jid) => participants.find((p) =>
    p.id === jid || digits(p.id) === digits(jid)
  );
  const sender = find(senderJid);
  const bot = find(botJid);
  return {
    metadata,
    participants,
    isAdmin: ['admin', 'superadmin'].includes(sender?.admin),
    botIsAdmin: ['admin', 'superadmin'].includes(bot?.admin)
  };
}

async function requireGroup(reply, from) {
  if (!isGroup(from)) {
    await reply('This command only works in a WhatsApp group.');
    return false;
  }
  return true;
}

async function requireAdmin(sock, from, sender, isOwner, reply) {
  if (isOwner) return getGroupRoles(sock, from, sender);
  const roles = await getGroupRoles(sock, from, sender);
  if (!roles.isAdmin) {
    await reply('Only group admins or the bot owner can use this command.');
    return null;
  }
  return roles;
}

function mentionFromArgs(args) {
  return args.map((arg) => arg.replace(/^@/, '').replace(/\D/g, ''))
    .filter(Boolean).map((number) => number + '@s.whatsapp.net');
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

  const botName = config.botName || 'LORD XD';
  const ownerName = config.owner || 'X LORD';
  const ownerNumber = digits(config.ownerNumber || '');
  const senderNumber = digits(sender);
  const isOwner = Boolean(ownerNumber && senderNumber && (
    senderNumber.endsWith(ownerNumber) || ownerNumber.endsWith(senderNumber)
  ));

  if (config.selfMode && !isOwner) return;
  if (String(config.mode || 'public').toLowerCase() === 'private' && !isOwner) return;

  const reply = async (message, extra = {}) =>
    sock.sendMessage(from, { text: message, ...extra }, { quoted: msg });

  try {
    switch (command) {
      case 'ping':
        await reply('Pong! 🏓\nLORD XD is online.');
        break;
      case 'alive':
        await reply(
          '╭━━〔 ' + botName + ' 〕━━╮\n' +
          '┃ Status: Online 🟢\n' +
          '┃ Owner: ' + ownerName + '\n' +
          '┃ Mode: ' + config.mode + '\n' +
          '┃ Host: ' + config.hostingPlatform + '\n' +
          '╰━━━━━━━━━━━━━━━━╯'
        );
        break;
      case 'uptime': {
        const seconds = Math.floor(process.uptime());
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        await reply('⏱️ Uptime: ' + hours + 'h ' + minutes + 'm ' + (seconds % 60) + 's');
        break;
      }
      case 'botinfo':
        await reply(
          '╭━━〔 ' + botName + ' INFO 〕━━╮\n' +
          '┃ Version: 1.1.0\n' +
          '┃ Platform: WhatsApp / Baileys\n' +
          '┃ Mode: ' + config.mode + '\n' +
          '┃ Prefix: ' + config.prefix + '\n' +
          '╰━━━━━━━━━━━━━━━━╯'
        );
        break;
      case 'owner':
        await reply('╭━━〔 BOT OWNER 〕━━╮\n┃ Name: ' + ownerName + '\n┃ Bot: ' + botName + '\n╰━━━━━━━━━━━━━━━━╯');
        break;
      case 'menu':
      case 'help':
        await reply(
          '╭━━〔 ' + botName + ' MENU 〕━━╮\n' +
          'Prefix: ' + config.prefix + '\n\n' +
          'GENERAL\n' +
          'ping • alive • owner • botinfo • uptime • menu • groupinfo • groupstats\n\n' +
          'GROUP ADMIN (admin only)\n' +
          'tagall • hidetag • kick • promote • demote\n' +
          'antilink on/off • welcome on/off • goodbye on/off\n\n' +
          'AI / MEDIA / TELEGRAM\n' +
          'These integrations are not configured in this build; provider/API credentials are required.\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯'
        );
        break;
      case 'groupinfo':
      case 'groupstats': {
        if (!(await requireGroup(reply, from))) break;
        const metadata = await sock.groupMetadata(from);
        const admins = (metadata.participants || []).filter((p) =>
          ['admin', 'superadmin'].includes(p.admin)
        ).length;
        await reply(
          '╭━━〔 GROUP INFO 〕━━╮\n' +
          '┃ Name: ' + metadata.subject + '\n' +
          '┃ Members: ' + metadata.participants.length + '\n' +
          '┃ Admins: ' + admins + '\n' +
          '┃ Owner: ' + (metadata.owner || 'Unknown') + '\n' +
          '╰━━━━━━━━━━━━━━━━╯'
        );
        break;
      }
      case 'antilink':
      case 'welcome':
      case 'goodbye': {
        if (!(await requireGroup(reply, from))) break;
        const roles = await requireAdmin(sock, from, sender, isOwner, reply);
        if (!roles) break;
        const value = String(args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(value)) {
          await reply('Usage: ' + config.prefix + command + ' on/off');
          break;
        }
        await setGroupSetting(from, command, value === 'on');
        await reply('✅ ' + command + ' is now ' + value.toUpperCase() + ' for this group.');
        break;
      }
      case 'tagall':
      case 'hidetag': {
        if (!(await requireGroup(reply, from))) break;
        const roles = await requireAdmin(sock, from, sender, isOwner, reply);
        if (!roles) break;
        const mentions = roles.participants.map((p) => p.id);
        const text = args.join(' ') || (command === 'tagall' ? 'Attention everyone!' : ' ');
        await sock.sendMessage(from, {
          text: (command === 'tagall' ? '📢 ' : '') + text,
          mentions
        }, { quoted: msg });
        break;
      }
      case 'kick':
      case 'promote':
      case 'demote': {
        if (!(await requireGroup(reply, from))) break;
        const roles = await requireAdmin(sock, from, sender, isOwner, reply);
        if (!roles) break;
        if (!roles.botIsAdmin) {
          await reply('I need to be a group admin to perform this action.');
          break;
        }
        let targets = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!targets.length) targets = mentionFromArgs(args);
        targets = [...new Set(targets)].filter((jid) =>
          digits(jid) !== digits(sock.user?.id) && digits(jid) !== digits(roles.metadata.owner)
        );
        if (!targets.length) {
          await reply('Tag a member or provide their phone number. Example: ' + config.prefix + command + ' @number');
          break;
        }
        const action = command === 'kick' ? 'remove' : command;
        await sock.groupParticipantsUpdate(from, targets, action);
        await reply('✅ ' + command + ' action completed for ' + targets.length + ' member(s).');
        break;
      }
      default:
        if (['ai', 'chatgpt', 'gpt4o', 'claude', 'gemini', 'mistral', 'copilot', 'metaai',
          'llama', 'blackbox', 'bard', 'perplexity', 'venice', 'o3', 'instagram', 'facebook',
          'play', 'play2', 'spotify', 'spotify2', 'tiktok2', 'twitter', 'youtube', 'ytsearch',
          'telepack', 'tomp3'].includes(command)) {
          await reply('This command is listed in the catalog but its external integration is not configured yet.');
        } else {
          await reply('Unknown command. Send ' + config.prefix + 'menu to see available commands.');
        }
    }
  } catch (error) {
    console.error('Command error [' + command + ']:', error?.stack || error);
    await reply('❌ Command failed. Check bot logs and confirm the bot has the required permissions.');
  }
}

export async function handleGroupParticipants(sock, update) {
  const groupJid = update?.id;
  if (!groupJid || !isGroup(groupJid)) return;
  try {
    const settings = await getGroupSettings(groupJid);
    const participants = update.participants || [];
    if (update.action === 'add' && settings.welcome) {
      for (const jid of participants) {
        await sock.sendMessage(groupJid, {
          text: '👋 Welcome @' + digits(jid) + ' to the group!',
          mentions: [jid]
        });
      }
    }
    if (update.action === 'remove' && settings.goodbye) {
      for (const jid of participants) {
        await sock.sendMessage(groupJid, {
          text: '👋 @' + digits(jid) + ' has left the group.',
          mentions: [jid]
        });
      }
    }
  } catch (error) {
    console.error('Group participant event error:', error?.message || error);
  }
}
