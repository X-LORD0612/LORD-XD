# LORD XD WhatsApp Bot

LORD XD is a Node.js WhatsApp bot built with Baileys pairing-code login.

## Requirements

- Node.js 20+
- A WhatsApp account to link
- A trusted host with persistent storage for the session and group settings

## Setup

1. Clone or upload this repository to a **private** GitHub repository.
2. Install packages: `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `OWNER_NUMBER` and `PAIRING_NUMBER` to full phone numbers with country code, digits only. Set a strong, private owner number.
5. Start the bot with `npm start`.
6. Copy the pairing code from the server console. In WhatsApp, open **Linked devices → Link a device → Link with phone number instead**, then enter the code.

For a hosting panel, select Node.js 20+, use `npm install` as the install command and `npm start` as the start command. Set environment variables in the panel rather than uploading a real `.env` file.

## Implemented commands

| Command | Description | Access |
|---|---|---|
| `.ping` | Bot response test | Everyone |
| `.alive` | Connection/status message | Everyone |
| `.uptime` | Process uptime | Everyone |
| `.botinfo` | Basic bot information | Everyone |
| `.owner` | Owner label | Everyone |
| `.menu`, `.help` | Implemented command menu | Everyone |
| `.groupinfo`, `.groupstats` | Group name, member and admin counts | Group |
| `.tagall`, `.hidetag` | Mention group participants | Group admins / owner |
| `.kick`, `.promote`, `.demote` | Group participant management | Group admins / owner; bot must be admin |
| `.antilink on/off` | Delete ordinary group link messages | Group admins / owner; bot must be admin to delete |
| `.welcome on/off` | Welcome new group participants | Group admins / owner |
| `.goodbye on/off` | Announce participants who leave | Group admins / owner |

Group settings are stored in `data/group-settings.json`. Keep this directory on persistent host storage; it is ignored by Git.

## Not yet integrated

The larger command catalog is preserved in [COMMAND_CATALOG.md](./COMMAND_CATALOG.md). AI providers, web search, image generation, social-media downloads, music services, Telegram, and the remaining conversion commands are **not implemented in this build**. They need provider integrations, API credentials, and testing. The bot responds honestly when one of these catalog-only commands is called.

## Security and permissions

- Keep the repository private if it contains project-specific configuration.
- Never commit `.env`, `session/`, or `data/`. The included `.gitignore` excludes them.
- Never share pairing codes or session files. Anyone with the session can control the linked WhatsApp account.
- Admin commands check group-admin status; participant-changing commands also require the bot to be a group admin.
- Use moderation tools only in groups where you have permission. WhatsApp may restrict accounts for abusive automation.
- Use a persistent, trusted host. Do not run this bot from an untrusted public machine.

## Operational notes

- This project uses Baileys and is an unofficial WhatsApp Web client, not an official WhatsApp Business API integration.
- The bot must remain online for commands and welcome/goodbye events to run.
- Test in a private test group before enabling anti-link or moderation features.
- This repository has not been deployed or connected to a WhatsApp account by this documentation update.
