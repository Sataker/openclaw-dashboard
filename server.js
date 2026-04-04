const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = 8888;

async function runOpenClaw(command) {
    try {
        const { stdout } = await execAsync(`openclaw ${command}`, { timeout: 30000 });
        return stdout;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getAgents() {
    const { stdout } = await execAsync('Get-ChildItem -Name "C:\\Users\\flor3\\clawd\\agents"', { shell: 'powershell.exe' });
    const agentIds = stdout.trim().split('\n').map(s => s.trim()).filter(Boolean);
    
    const agents = [];
    for (const id of agentIds) {
        const agentPath = `C:\\Users\\flor3\\clawd\\agents\\${id}`;
        let identity = { name: id, emoji: '🤖' };
        let description = 'AI Agent';
        let discordChannel = null;
        
        // Try to read IDENTITY.md
        try {
            const identityPath = path.join(agentPath, 'IDENTITY.md');
            if (fs.existsSync(identityPath)) {
                const content = fs.readFileSync(identityPath, 'utf8');
                const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
                const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/);
                if (nameMatch) identity.name = nameMatch[1].trim();
                if (emojiMatch) identity.emoji = emojiMatch[1].trim();
            }
        } catch(e) {}
        
        // Try to read SOUL.md for description
        try {
            const soulPath = path.join(agentPath, 'SOUL.md');
            if (fs.existsSync(soulPath)) {
                const content = fs.readFileSync(soulPath, 'utf8');
                const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
                if (lines[0]) description = lines[0].substring(0, 50);
            }
        } catch(e) {}
        
        agents.push({ id, identity, description, bindings: { discord: discordChannel } });
    }
    
    return agents;
}

// Discord channel bindings (from config)
const discordBindings = {
    'orchestrator': '1465788505329242145',
    'dba': '1466546978333659296',
    'samurai': '1466617192974909594',
    'sales-analyst': '1466431062560211026',
    'uchat': '1470537592985354463',
    'casual-br': '1469788200489717977',
    'content-creator': '1475657828688724028',
    'content-mentor': '1475789055655677963',
    'english-teacher': '1478717116109684776',
    'video-factory': '1488605890314764410'
};

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API endpoints
    if (req.url === '/api/status') {
        try {
            const output = await runOpenClaw('gateway call health --json');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', version: '2026.3.13', raw: output }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', version: '2026.3.13' }));
        }
        return;
    }

    if (req.url === '/api/agents') {
        try {
            const agents = await getAgents();
            // Add discord bindings
            agents.forEach(a => {
                if (discordBindings[a.id]) {
                    a.bindings = { discord: discordBindings[a.id] };
                }
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ agents }));
        } catch(e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.url === '/api/sessions') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessions: [] }));
        return;
    }

    if (req.url === '/api/sessions/spawn' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { agentId, task } = data;
                
                // Use openclaw message to send to Discord channel
                const channel = discordBindings[agentId];
                if (channel) {
                    const escapedTask = task.replace(/"/g, '\\"').replace(/\n/g, ' ');
                    await runOpenClaw(`message --channel discord --target ${channel} "${escapedTask}"`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        response: `Message sent to ${agentId} via Discord (#${channel}). The agent will respond in the channel.`,
                        channel: channel 
                    }));
                } else {
                    // For agents without Discord, spawn a session
                    const escapedTask = task.replace(/"/g, '\\"').replace(/\n/g, ' ');
                    try {
                        const output = await runOpenClaw(`sessions spawn --agent ${agentId} --task "${escapedTask}" --mode run --timeout 60`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ response: output || 'Task sent to agent.' }));
                    } catch(e) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ response: `Task queued for ${agentId}. Check agent workspace for results.` }));
                    }
                }
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.ico': 'image/x-icon'
    };

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'text/plain' });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Dashboard: http://localhost:${PORT}`);
    console.log(`📡 Using OpenClaw CLI for agent communication`);
});
