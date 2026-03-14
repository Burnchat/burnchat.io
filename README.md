<div align="center">

# 🔥 BurnChat

**Disposable chat rooms. No accounts. No logs. No traces.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io)
[![Website](https://img.shields.io/badge/Website-burnchat.io-ff6b35.svg)](https://burnchat.io)
[![Widget](https://img.shields.io/badge/Widget-Embed%20Free-ff6b35.svg)](https://burnchat.io/widget)

[Live App](https://burnchat.io) · [Embed Widget](https://burnchat.io/widget) · [Blog](https://burnchat.io/blog) · [Follow on 𝕏](https://x.com/burnchatio)

Create a room → share the link → chat → burn it when done.

</div>

---

## What is BurnChat?

BurnChat is an ephemeral, zero-log chat platform where messages exist only in server memory. No database. No disk writes. No accounts. When a room burns or everyone leaves, every message, voice note, and image is destroyed permanently by the JavaScript garbage collector.

There is nothing to subpoena, nothing to breach, nothing to leak.

---

## Features

**Core Chat**
- Instant room creation with shareable links
- Custom room names (`burnchat.io/your-name`)
- Nicknames with duplicate detection
- Image sharing with client-side compression
- Voice messages with waveform playback and listen-once tracking
- Room passwords for private conversations
- Auto-burn when last user leaves
- 24-hour hard room expiry
- Late-joiner message history (last 100 messages)
- Dark/light theme with auto-detection

**20+ Slash Commands**
- `/msg nick message` — Private whispers
- `/msgvoice nick` — Private voice messages
- `/voice` / `/endvoice` — Record and send voice
- `/nick newnickname` — Change your name mid-chat
- `/away message` / `/back` — Away status with auto-reply
- `/online` — See who's in the room
- `/topic text` — Set room title
- `/play snake` — Multiplayer Snake game
- `/help` — Full categorized command list
- Type `/` to see all commands with autocomplete

**Admin System**
- `/admin nick` — Promote users to admin
- `/adminpw password` — Persistent admin auth across reconnects
- `/ban nick` / `/unban nick` — Ban users from the room
- `/kick nick reason` — Kick with optional reason
- `/mute nick mins` — Timed mutes with auto-unmute
- `/lock password` — Password-protect rooms
- No auto-admin — everyone has equal power until someone claims admin

**Multiplayer Games**
- 🐍 Snake — real-time multiplayer, plays inside the chat window
- Unique colors per player, live leaderboard
- Gold food spawns for bonus points
- Game notifications to all room members

**Embeddable Widget**
- One-line embed code for any website
- Interactive configurator at [burnchat.io/widget](https://burnchat.io/widget)
- Floating bubble or inline mode
- Customizable theme, colors, position, size
- Under 5KB loader, lazy-loaded iframe
- "Powered by BurnChat" backlink

---

## Privacy — What "Zero Log" Means

| Layer | What we do |
|-------|-----------|
| **App** | No database. No file writes for chat data. Messages live in RAM only. |
| **nginx** | `access_log off` and `error_log /dev/null` |
| **systemd** | `StandardOutput=null` — nothing hits journald |
| **Memory** | Messages live in RAM only. Room deleted → gone forever. |
| **Headers** | `Referrer-Policy: no-referrer`, no server tokens |
| **Network** | All traffic over HTTPS/WSS. No third-party CDNs. |

**There is literally no disk I/O for chat data.** When a room is burned or the last user leaves, the JavaScript garbage collector reclaims the memory. There is nothing to subpoena, nothing to breach.

---

## Quick Start
```bash
# Clone
git clone https://github.com/Astro33s/BurnChat.io.git
cd BurnChat.io

# Install
npm install

# Run
node server.js

# Open http://localhost:3000
```

---

## Embed on Your Website

Add a chat room to any website with one line:
```html
<script
  src="https://burnchat.io/widget.js"
  data-room="my-community"
  data-theme="dark"
  data-accent="#ff6b35"
  async>
</script>
```

Customize everything at [burnchat.io/widget](https://burnchat.io/widget) — no signup required.

---

## Configuration

All config lives at the top of `server.js`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `ROOM_ID_LENGTH` | 8 | Characters in room URL |
| `MAX_MESSAGES` | 100 | Messages kept per room |
| `MAX_MESSAGE_LENGTH` | 2000 | Max chars per message |
| `MAX_IMAGE_SIZE` | 500000 | Max base64 image size |
| `MAX_VOICE_SIZE` | 2000000 | Max base64 voice size |
| `MAX_USERS_PER_ROOM` | 50 | User limit per room |
| `CLEANUP_DELAY_MS` | 30000 | Grace period before deleting empty rooms |
| `ROOM_MAX_AGE_MS` | 86400000 | Hard room lifetime (24h) |

---

## Project Structure
```
BurnChat.io/
├── server.js              # Backend (Express + Socket.IO)
├── game.js                # Multiplayer Snake game server
├── public/
│   ├── index.html         # Main app (vanilla HTML/CSS/JS)
│   ├── widget.html        # Widget configurator page
│   ├── widget.js          # Embeddable widget loader (5KB)
│   ├── embed.html         # Minimal chat for iframe embeds
│   ├── admin.html         # Admin dashboard
│   ├── blog/              # Blog posts
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── robots.txt
│   └── sitemap.xml
├── deploy/
│   ├── nginx-burnchat.conf
│   └── burnchat.service
├── package.json
└── README.md
```

---

## Deploy to VPS

### 1. Server setup
```bash
sudo useradd -r -s /usr/sbin/nologin burnchat
sudo mkdir -p /opt/burnchat
sudo cp -r ./* /opt/burnchat/
sudo chown -R burnchat:burnchat /opt/burnchat
cd /opt/burnchat && sudo -u burnchat npm install --production
```

### 2. systemd service
```bash
sudo cp deploy/burnchat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now burnchat
```

### 3. nginx reverse proxy
```bash
sudo cp deploy/nginx-burnchat.conf /etc/nginx/sites-available/burnchat
sudo ln -s /etc/nginx/sites-available/burnchat /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Real-time:** Socket.IO
- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **Database:** None — RAM only
- **Deployment:** nginx + systemd + Let's Encrypt

---

## Contributing

Pull requests welcome. BurnChat is intentionally minimal — two files of actual code. Before proposing a large feature, open an issue to discuss.

---

## License

MIT

---

<div align="center">

**[burnchat.io](https://burnchat.io)** · **[Embed Widget](https://burnchat.io/widget)** · **[Blog](https://burnchat.io/blog)** · **[𝕏](https://x.com/burnchatio)**

🔥 *The safest message is one that doesn't exist.*

</div>
