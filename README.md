# LORD XD

Your WhatsApp Multi-Device Bot.

**Repository:** https://github.com/X-LORD0612/LORD-XD

## Deployment

This repository contains the bot loader and deployment configuration.

### Required environment variable

- `SESSION_ID` — your WhatsApp bot session token.

### Optional environment variable

- `REPO_URL` — override URL for the bot source archive downloaded by the loader at startup.

## Run

```bash
npm install
npm start
```

For Docker deployments, build from the included `Dockerfile`.

## Notes

- Keep your `SESSION_ID` private. Never commit it to GitHub.
- Use Node.js 24 or newer, as specified in `package.json`.
- This repository is named and maintained as LORD XD.
