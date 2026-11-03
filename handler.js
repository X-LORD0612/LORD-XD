import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const dataDir = path.resolve('./data');
fs.mkdirSync(dataDir, { recursive: true });
const settingsFile = path.join(dataDir, 'groups.json');

function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile, 'utf8')); }
  catch { return {}; }
}
function writeSettings(data) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
}
const jidNumber = jid => (jid || '').split('@')[0].split(':')[0];
const isGroup = jid => jid?.endsWith('@g.us');

async function isAdmin(sock, groupJid, participant) {
  const metadata = await sock.groupMetadata(groupJid);
  const member = metadata.participants.find(p => p.id === participant);
  return member?.admin === 'admin' || member?.admin === 'superadmin';
}
const menu = () => `╭━━〔 ${config.botName} 〕━━╮
┃ Owner : ${config.ownerName}
┃ Prefix: ${config.prefix}
╰━━━━━━━━━━━━━━╯

GENERAL
${config.prefix}menu
${config.prefix}ping
${config.prefix}alive
${config.prefix}owner
${config.prefix}uptime
${config.prefix}botinfo
${config.prefix}groupinfo

GROUP (admin only)
${config.prefix}tagall
${config.prefix}antilink on/off
${config.prefix}welcome on/off
${config.prefix}goodbye on/off`;

export async function handleMessage(sock, message) {
  if (!message.message || message.key.fromMe) return;
  const jid = message.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;

  const body = message.message.conversation
    || message.message.extendedTextMessage?.text
    || message.message.imageMessage?.caption
    || message.message.videoMessage?.caption
    || '';
  if (!body.startsWith(config.prefix)) return;

  const [rawCommand, ...args] = body.slice(config.prefix.length).trim().split(/\\s+/);
  const command = (rawCommand || '').toLowerCase();
  const sender = message.key.participant || jid;
  const isOwner = config.ownerNumber && jidNumber(sender) === config.ownerNumber;
  const reply = text => sock.sendMessage(jid, { text }, { quoted: message });

  if (command === 'menu' || command === 'help') return reply(menu());
  if (command === 'ping') return reply(`Pong! ${config.botName} is online.`);
  if (command === 'alive') return reply(`╭━━〔 ${config.botName} 〕━━╮\\n┃ Status: Online ✓\\n┃ Owner: ${config.ownerName}\\n╰━━━━━━━━━━━━━━╯`);
  if (command === 'owner') return reply(`Owner: ${config.ownerName}${config.ownerNumber ? `\\nWhatsApp: +${config.ownerNumber}` : ''}`);
  if (command === 'uptime') {
    const seconds = Math.floor(process.uptime());
    const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), secs = seconds % 60;
    return reply(`Uptime: ${hours}h ${minutes}m ${secs}s`);
  }
  if (command === 'botinfo') return reply(`Bot: ${config.botName}\\nOwner: ${config.ownerName}\\nLibrary: Baileys\\nPrefix: ${config.prefix}`);
  if (command === 'groupinfo') {
    if (!isGroup(jid)) return reply('This command works in groups only.');
    const meta = await sock.groupMetadata(jid);
    return reply(`Group: ${meta.subject}\\nMembers: ${meta.participants.length}\\nCreated: ${meta.creation ? new Date(meta.creation * 1000).toLocaleString() : 'Unknown'}`);
  }

  if (!isGroup(jid)) return reply('This command works in groups only.');
  const settings = readSettings();
  settings[jid] ||= { antilink: false, welcome: false, goodbye: false };

  const botJid = sock.user?.id;
  const senderIsAdmin = isOwner || await isAdmin(sock, jid, sender);
  if (['tagall', 'antilink', 'welcome', 'goodbye'].includes(command) && !senderIsAdmin) {
    return reply('Only group admins can use this command.');
  }

  if (command === 'tagall') {
    const meta = await sock.groupMetadata(jid);
    const text = args.join(' ') || 'Attention everyone!';
    const mentions = meta.participants.map(p => p.id);
    return sock.sendMessage(jid, { text: `${text}\\n\\n${mentions.map(x => '@' + jidNumber(x)).join(' ')}`, mentions }, { quoted: message });
  }
  if (['antilink', 'welcome', 'goodbye'].includes(command)) {
    const value = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(value)) return reply(`Usage: ${config.prefix}${command} on/off`);
    settings[jid][command] = value === 'on';
    writeSettings(settings);
    return reply(`${command} is now ${value.toUpperCase()}.`);
  }
}
