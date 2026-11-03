# LORD XD WhatsApp Bot

A starter WhatsApp bot using `@whiskeysockets/baileys` **7.0.0-rc.14** with pairing-code login.

## Included commands

- `.menu`, `.ping`, `.alive`, `.owner`, `.uptime`, `.botinfo`
- `.groupinfo`
- Admin-only: `.tagall`, `.antilink on/off`, `.welcome on/off`, `.goodbye on/off`

> Welcome/goodbye toggles are configuration placeholders in this starter. Automatic join/leave messages and automatic anti-link deletion are not implemented yet.

## Requirements

- Node.js 20 or newer
- A WhatsApp account to link
- A private, trusted host. Keep your session folder secret.

## Setup

1. Upload this project to a **private** GitHub repository. Never upload `.env` or `session/`.
2. On your host, install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set:
   - `OWNER_NUMBER` to the owner's WhatsApp number with country code, digits only.
   - `PAIRING_NUMBER` to the WhatsApp number you want to link, digits only.
4. Start:
   ```bash
   npm start
   ```
5. Copy the pairing code from the server console. In WhatsApp, open **Linked devices → Link a device → Link with phone number instead**, then enter the code.

If your host cannot accept interactive input, set `PAIRING_NUMBER` in the environment before starting.

## KataBump / panel deployment

Create a Node.js server, select Node 20+, upload the repository, set the environment variables in the panel, then use `npm install` as install command and `npm start` as startup command. Exact labels vary by host.

## Security

- Never share your pairing code, `.env`, or `session/` contents.
- Do not commit session files to GitHub.
- Use a private repository and restrict panel access.
- WhatsApp may limit or suspend accounts for automation or policy violations. Use responsibly and only message people who expect it.

## Notes

This is a basic starter, not a production-ready moderation system. The antilink/welcome/goodbye commands currently save settings only; add event handlers and moderation logic before relying on them.
