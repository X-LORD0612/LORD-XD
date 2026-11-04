
import { getContentType } from '@whiskeysockets/baileys';

export async function handleMessage(sock, msg, config) {
  if (!msg.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;

  const type = getContentType(msg.message);

  const body =
    type === 'conversation'
      ? msg.message.conversation
      : type === 'extendedTextMessage'
        ? msg.message.extendedTextMessage?.text
        : '';

  if (!body || !body.startsWith(config.prefix)) return;

  const args = body.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  const extra = args.join(' ');

  const sender = msg.key.participant || jid;
  const senderNumber = sender.split('@')[0];
  const ownerNumber = (config.ownerNumber || '').replace(/\D/g, '');

  const isOwner = Boolean(
    ownerNumber && senderNumber === ownerNumber
  );

  if (config.mode === 'private' && !isOwner) return;

  const reply = (text) =>
    sock.sendMessage(jid, { text }, { quoted: msg });

  const hosting = config.hostingPlatform || 'Unknown';

  switch (command) {
    case 'ping':
      return reply('PONG! ⚡\nLORD XD is online.');

    case 'alive':
      return reply(
`╭━━〔 LORD XD 〕━━╮
┃ Owner: ${config.owner}
┃ Prefix: ${config.prefix}
┃ Mode: ${config.mode}
┃ Hosting: ${hosting}
┃ Status: Online 🟢
╰━━━━━━━━━━━━━━╯`
      );

    case 'menu':
    case 'help':
      return reply(
`╭━━〔 LORD XD 〕━━╮
┃ Owner: ${config.owner}
┃ Prefix: ${config.prefix}
┃ Mode: ${config.mode}
┃ Hosting: ${hosting}
╰━━━━━━━━━━━━━━╯

╭━━ GENERAL COMMANDS ━━
┃ .ping
┃ .alive
┃ .menu
┃ .owner
┃ .groupinfo
┃ .tagall
╰━━━━━━━━━━━━━━━━━━━━╯`
      );

    case 'owner':
      return reply(
`╭━━〔 OWNER INFO 〕━━╮
┃ Name: ${config.owner}
┃ Bot: LORD XD
╰━━━━━━━━━━━━━━━━━━╯`
      );

    case 'groupinfo': {
      if (!jid.endsWith('@g.us')) {
        return reply('This command works in groups only.');
      }

      const metadata = await sock.groupMetadata(jid);

      return reply(
`GROUP INFORMATION
Name: ${metadata.subject}
Members: ${metadata.participants.length}
Group ID: ${jid}`
      );
    }

    case 'tagall': {
      if (!jid.endsWith('@g.us')) {
        return reply('Groups only!');
      }

      const metadata = await sock.groupMetadata(jid);

      const member = metadata.participants.find(
        p => p.id === sender || p.phoneNumber === sender
      );

      if (!isOwner && !member?.admin) {
        return reply('Only group admins or bot owner can use this command.');
      }

      const mentions = metadata.participants.map(p => p.id);

      return sock.sendMessage(
        jid,
        {
          text:
            `📢 LORD XD TAGALL\n\n${extra || 'Attention everyone!'}\n\n` +
            mentions.map(id => `@${id.split('@')[0]}`).join(' '),
          mentions
        },
        { quoted: msg }
      );
    }

    default:
      return reply('Invalid command. Type .menu');
  }
}
