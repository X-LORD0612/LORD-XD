# LORD XD WhatsApp Bot

A Node.js WhatsApp bot built with Baileys. This branch adds QR and pairing-code login, owner-controlled public/private mode, group tools, and Railway deployment configuration.

## Commands

- General: `.menu`, `.help`, `.ping`, `.alive`, `.owner`, `.uptime`, `.botinfo`
- Owner: `.public`, `.private`, `.mode`, `.groupdelete`, `.channeldelete <channel-jid>`
- Group: `.groupinfo`, `.tagall [message]`, `.kick @user`, `.add <number>`, `.promote @user`, `.demote @user`

No adult/NSFW commands are included. The menu lists implemented commands only.

## Requirements

- Node.js 20+
- A WhatsApp account to link

## Environment variables

Copy `.env.example` values into your host's environment. Do not commit `.env` or the `session/` directory.

- `OWNER_NUMBER`: owner WhatsApp number, digits with country code (default: 919332544935)
- `PAIRING_NUMBER`: number to link using pairing code. Leave blank to use QR login.
- `PREFIX`: command prefix (default: .)
- `MODE`: public or private (default: public)
- `SESSION_DIR`: persistent session directory (default: ./session)
- `BOT_NAME`, `OWNER_NAME`, `AUTO_READ`, `ALWAYS_ONLINE`, `LOG_LEVEL`

## Run locally

```bash
npm install
npm start
```

If `PAIRING_NUMBER` is set, enter the printed code in WhatsApp > Linked devices > Link with phone number. If it is blank, scan the terminal QR code.

## Railway

1. Create a Railway project and deploy this GitHub branch.
2. Set the variables above in Railway Variables. Set `PAIRING_NUMBER` for pairing-code login, or leave it empty for QR login.
3. Ensure the service has a persistent volume mounted at the path used by `SESSION_DIR` (for example `/data/session`) so WhatsApp credentials survive restarts.
4. Deploy with the default build and start command `npm start`.

The included `railway.json` sets the start command. Keep session data and pairing codes private.

## Important behavior

- `.groupdelete` makes the bot leave the current group; WhatsApp does not let a bot delete a group for all members.
- `.channeldelete` is guarded by a runtime API check. If the installed Baileys build does not expose channel deletion, it reports that limitation rather than pretending the channel was deleted.
- Group moderation commands require the sender to be a group admin or bot owner, and LORD XD itself must be a group admin.
- Public/private mode is saved in `data/settings.json`. Keep the hosting disk persistent if you want settings to survive restarts.
- Do not upload `.env`, `session/`, or `data/settings.json` if you later add private configuration there.
- Use automation responsibly and only message people who expect it.
