# OpenClaw Agent Dashboard

A beautiful web dashboard to manage and chat with your OpenClaw AI agents.

![Dashboard Preview](https://img.shields.io/badge/Agents-31-blue) ![Status](https://img.shields.io/badge/Status-Active-green)

## Features

- 🤖 **31 AI Agents** - View all your agents in one place
- 💬 **Real-time Chat** - Send messages to any agent
- 🔗 **Discord Integration** - Messages sent to Discord channels
- 📊 **Activity Feed** - Track all interactions
- 🎨 **Beautiful UI** - Glass-morphism design with animations

## Quick Start

### Prerequisites
- Node.js 18+
- OpenClaw CLI installed and configured

### Installation

```bash
git clone https://github.com/Sataker/openclaw-dashboard.git
cd openclaw-dashboard
node server.js
```

Open http://localhost:8888 in your browser.

## Configuration

Edit `server.js` to update your Discord channel bindings:

```javascript
const discordBindings = {
    'orchestrator': '1465788505329242145',
    'dba': '1466546978333659296',
    // ... add your agents
};
```

## How It Works

1. **Frontend** (`index.html`) - Single-page app with Tailwind CSS
2. **Backend** (`server.js`) - Node.js server that:
   - Reads agent folders from `C:\Users\flor3\clawd\agents\`
   - Uses OpenClaw CLI to send messages to agents
   - Proxies requests to Discord channels

## Agents with Discord Channels

| Agent | Channel |
|-------|---------|
| Orchestrator | #geral |
| DBA | #dba |
| Samurai | #samurai |
| Sales-Analyst | #edward |
| UChat | #uchat |
| Casual-BR | #casual |
| Content-Creator | #content |
| Content-Mentor | #mentor |
| English-Teacher | #english |
| Video-Factory | #video-factory |

## API Endpoints

- `GET /api/status` - Gateway status
- `GET /api/agents` - List all agents
- `GET /api/sessions` - Active sessions
- `POST /api/sessions/spawn` - Send message to agent

## License

MIT

## Author

Created by [@enzovaccaro.ai](https://instagram.com/enzovaccaro.ai)
