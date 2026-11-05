# LORD XD — Command Catalog

This file records the command menu supplied for LORD XD. It is a command specification/catalog, **not proof that every command is implemented**.

## Current project status

The repository currently contains a starter WhatsApp bot built with Baileys. Inspection of `handler.js` confirms these commands are implemented:
- `ping`
- `alive`
- `owner`
- `menu`, `help`
- `groupinfo`

The following commands appear in the supplied menu but are **not confirmed as implemented** in the current source:
- Other general, AI, admin, owner, media, and convert commands listed below.
- Telegram support: not present in the inspected starter files. The `telepack` menu entry alone does not establish Telegram bot support.

## Bot profile fields

| Field | Current value |
|---|---|
| Bot name | LORD XD (from repository config default) |
| Prefix | `.` (configurable with `PREFIX`) |
| Owner | `X LORD` (configurable with `OWNER_NAME`) |
| Mode | `public` by default (configurable with `MODE`) |
| Platform | WhatsApp / Baileys |
| Hosting label | KataBump by default (configurable) |
| Version | `1.0.0` in package.json |
| Speed / uptime / RAM | Runtime values; not statically known |

## General commands (GEN-CMD)

`alive`, `apk`, `attp`, `botinfo`, `botstatus`, `checkwa`, `circlesticker`, `crop`, `delpp`, `egif`, `fancy`, `getpp`, `getsettings`, `google`, `image2`, `define`, `news2`, `groupinfo`, `groupstats`, `help`, `img`, `inviteinfo`, `lid`, `menu`, `myactivity`, `owner`, `pair`, `ping`, `poll`, `qr`, `reshare`, `setprofile`, `simage`, `testsnapshot`, `ssweb`, `sticker`, `stickerpack`, `take`, `telepack`, `time`, `tts`, `uptime`, `write`.

## AI commands (AI-CMD)

`ai`, `chatgpt`, `gpt4o`, `claude`, `gemini`, `mistral`, `copilot`, `metaai`, `llama`, `blackbox`, `bard`, `perplexity`, `venice`, `o3`.

## Admin / group commands (ADM-CMD)

`add`, `all`, `antiall`, `antiaudio`, `antibadword`, `antibot`, `anticontact`, `antidemote`, `antiforward`, `antigif`, `antigroupmention`, `antiimage`, `antikickall`, `antilink`, `antipromote`, `antispam`, `antisticker`, `antitag`, `antitagadmins`, `antivideo`, `antiviewonce`, `approve`, `autosticker`, `chatbot`, `clean`, `demote`, `demoteall`, `disp`, `antiforeign`, `getgroupdesc`, `getgroupprofile`, `goodbye`, `grouplink`, `hidetag`, `join`, `kick`, `kickactive`, `kickinactive`, `killgc`, `listoffline`, `listonline`, `mute`, `promote`, `reject`, `resetwarn`, `revokelink`, `setgdesc`, `setgname`, `setgoodbye`, `setgroupprofile`, `setsticker`, `setwelcome`, `staff`, `tagall`, `unmute`, `vcf`, `warn`, `welcome`.

## Owner commands (OWN-CMD)

`addsudo`, `alwaysonline`, `antibug`, `anticall`, `anticallmsg`, `antidelete`, `antideletestatus`, `antiedit`, `autodownloadstatus`, `automedia`, `autoreact`, `autoread`, `autorecording`, `autorecordtype`, `autostatusemoji`, `autostatusreact`, `autostatusview`, `autotyping`, `block`, `broadcast`, `calllink`, `cat`, `creategc`, `delete`, `dgns`, `forward`, `getjid`, `getsession`, `groupstatus`, `invite`, `leave`, `mode`, `mygroups`, `newsletter`, `pinger`, `readreceipts`, `removesudo`, `resetbot`, `restart`, `savestatus`, `setfont`, `setgitmedialink`, `setigmedialink`, `setmaxwarn`, `setprefix`, `shutdown`, `stealth`, `sudolist`, `disable`, `enable`, `tostatus`, `unblock`, `viewonce`.

## Media commands (MEDIA-CMD)

`facebook`, `igs`, `igsc`, `instagram`, `lyrics`, `pinterest`, `play2`, `ptv`, `shazam`, `snapchat`, `play`, `soundcloud`, `spotify`, `spotify2`, `tiktok2`, `trim`, `tt`, `twitter`, `video`, `video2`, `video3`, `ytsearch`.

## Convert commands (CONVERT-CMD)

The supplied transcript includes `tomp3`. The remainder of this category was not present in the received text.

## Implementation and safety requirements

1. Implement commands incrementally in dedicated modules and register them in the message handler.
2. Restrict destructive group actions (kick, mute, promote, demote, delete, group closure) to authorized group admins and verify the bot itself has the required WhatsApp privileges.
3. Restrict owner-only actions (restart, shutdown, broadcast, session access, sudo management) to the configured owner/sudo list.
4. Validate all user input and handle API/provider failures with clear replies.
5. Keep credentials, pairing codes, and the `session/` directory out of Git. Use environment variables for secrets.
6. Add automated tests for permission checks and command parsing.
7. Treat AI, search, media download, and Telegram integrations as separate integrations requiring their own providers, credentials, and implementation.
8. Do not claim a command is available until its handler and required integration have been implemented and tested.

## Important

This catalog preserves the menu supplied by the project owner. It does not add non-existent handlers or claim that the listed features are already operational.
