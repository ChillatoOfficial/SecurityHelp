# SecurityHelp

SecurityHelp is an open-source WhatsApp moderation bot built with **TypeScript** and **Baileys**.
It is designed for group management, basic moderation, welcome automation, utility commands, and a modular command structure that can be extended easily.

The project uses a plugin-style command loader, stores group data in JSON, and connects to WhatsApp Web through a QR session.

## Features

- Modular command system with automatic command loading
- WhatsApp connection via **Baileys**
- Multi-file auth session support
- Group moderation tools
- Anti-link protection
- Banned words filter
- Warn / unwarn system
- VIP management
- Welcome message system with optional image
- Group log target support
- Group stats and message tracking
- Inactive user cleanup command
- YouTube audio search/download command
- JSON-based persistent storage

## Included commands

### General
- `!ping` — latency test
- `!cmd` — list available commands
- `!cmd <command>` — show details for one command

### Group utilities
- `!regole` — show group rules
- `!staff` — show admin/staff list
- `!song <title>` — search and send audio from YouTube

### Admin / moderation
- `!antilink on|off`
- `!kick`
- `!promote`
- `!demote`
- `!warn`
- `!unwarn`
- `!vip add|remove|list`
- `!parole add|remove`
- `!welcome on|off|set|test|image`
- `!setname`
- `!setdesc`
- `!setpp`
- `!setregole`
- `!stats`
- `!tagall`
- `!lock`
- `!unlock`
- `!link`
- `!id`
- `!log`
- `!loggroup set|clear|status|test`
- `!inattivi <tempo>`

## Tech stack

- **Node.js**
- **TypeScript**
- **Baileys**
- **pino**
- **qrcode-terminal**
- **yt-search**
- **yt-dlp** for the `song` command
- JSON file storage in `data/groups.json`

## Project structure

```text
securityhelp/
├─ assets/
├─ data/
│  └─ groups.json
├─ src/
│  ├─ commands/
│  │  ├─ admin/
│  │  └─ groups/
│  ├─ core/
│  ├─ listeners/
│  └─ utils/
├─ package.json
├─ tsconfig.json
└─ .env
```

## Requirements

Before starting, make sure you have:

- **Node.js 18+** recommended
- **npm**
- **Python 3**
- **pip**
- **ffmpeg**
- **yt-dlp**

The `song` command depends on Python + yt-dlp + ffmpeg.
If you do not need music download, you can still run the bot without using that command.

## Installation on Linux

### 1. Clone the repository

```bash
git clone https://github.com/ChillatoOfficial/SecurityHelp.git
cd SecurityHelp
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install system packages

Ubuntu / Debian / Linux Mint:

```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip ffmpeg
```

### 4. Install yt-dlp

```bash
python3 -m pip install -U yt-dlp
```

### 5. Configure environment

Create or edit the `.env` file:

```env
CMD_PREFIX=! 
LOG_LEVEL=silent
```

Note: in the code the default prefix is already `!` if `CMD_PREFIX` is not set.

### 6. Start in development mode

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
npm start
```

When the bot starts, a QR code will appear in terminal.
Scan it from **WhatsApp > Linked devices > Link a device**.

## Installation on Termux

### 1. Update packages

```bash
pkg update && pkg upgrade -y
```

### 2. Install required packages

```bash
pkg install -y nodejs python ffmpeg git
```

### 3. Install yt-dlp

```bash
pip install -U yt-dlp
```

### 4. Clone the repository

```bash
git clone https://github.com/ChillatoOfficial/SecurityHelp.git
cd SecurityHelp
```

### 5. Install Node dependencies

```bash
npm install
```

### 6. Create `.env`

```bash
cat > .env << 'EOF_ENV'
CMD_PREFIX=!
LOG_LEVEL=silent
EOF_ENV
```

### 7. Start the bot

```bash
npm run dev
```

Then scan the QR code from WhatsApp.

## Important note about the `song` command

In the current source, the yt-dlp helper uses a **hardcoded cookies path**:

```ts
--cookies /root/voidproject/whatsapp/SecurityHelp/cookies.txt
```

If you want the `song` command to work on Linux, VPS, or Termux, you should edit `src/utils/ytdlp.ts` and replace that path with the correct one for your machine, for example:

```ts
"--cookies", "./cookies.txt",
```

Then place your `cookies.txt` file in the project root.

Without a valid cookies file, YouTube downloads may fail.

## Data storage

SecurityHelp stores group settings in:

```text
data/groups.json
```

This file contains settings such as:

- antilink status
- VIP list
- banned words
- welcome settings
- warning counts
- moderation log
- daily message counters

Back up this file if you want to preserve your configuration.

## How it works

- The bot connects through Baileys using multi-file auth in the `auth/` folder
- It listens for incoming messages
- It parses commands with a configurable prefix
- It auto-loads commands from the `src/commands` directory
- It saves group data to JSON automatically
- It handles participant updates for welcome messages

## Open-source note

This project is open source and intended for study, customization, and improvement.
You are free to fork it, extend it, and adapt it to your own communities.

If you publish modified versions, keeping credits is a good practice.

## Suggested improvements

Some useful next steps for this project:

- move hardcoded paths into `.env`
- add proper logger levels
- add anti-spam logic
- add dashboard / web panel
- move JSON storage to SQLite or PostgreSQL
- add per-group command enable/disable system
- add backup / restore commands
- add better error handling for media and YouTube downloads

## Troubleshooting

### QR is not shown
Make sure `qrcode-terminal` is installed through `npm install` and that the terminal is not suppressing output.

### `npm run dev` fails
Check that dependencies were installed correctly:

```bash
npm install
```

### `song` command fails
Check these points:

- Python 3 is installed
- `yt-dlp` is installed
- `ffmpeg` is installed
- the cookies path is valid
- the cookies file exists

### Session expired
If WhatsApp logs out the bot, delete the `auth/` folder and scan the QR again.

## License

Add your preferred license here, for example:

- MIT
- Apache-2.0
- GPL-3.0

If you want this repo to be clearly open source on GitHub, add a real `LICENSE` file in the root.
