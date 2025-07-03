# DWZ Discord Bot

A modern Discord bot built with Node.js and discord.js v14.

## Features

- 🤖 Modern Discord.js v14 framework
- ⚡ Slash command support
- 🔧 Event-driven architecture
- 📁 Modular command and event structure
- 🛡️ Error handling and logging
- 🔄 Hot-reload support with nodemon
- 🎯 Easy command deployment

## Prerequisites

- Node.js 18.0.0 or higher
- A Discord application and bot token

## Setup

## Setup

### 1. Quick Setup (Linux/Ubuntu)

Run the automated setup script:
```bash
./setup.sh
```

This will install Node.js, npm, and the bot dependencies automatically.

### 2. Manual Setup

If you prefer manual installation or are on a different system:

**Install Node.js and npm:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nodejs npm

# For other systems, download from nodejs.org
```

**Install bot dependencies:**
```bash
npm install
```

### 2. Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token
5. Go to the "General Information" section and copy the Application ID
6. For testing, get your Discord server (guild) ID

### 3. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_test_guild_id_here  # Optional: for testing commands in a specific server
```

### 4. Deploy Commands and Start Bot

```bash
# Deploy slash commands
npm run deploy

# Start in development mode with auto-restart
npm run dev

# Or start in production mode
npm start
```

### 5. Invite Bot to Server

Create an invite link with the following permissions:
- Bot Scope
- Application Commands
- Send Messages
- View Channels
- Read Message History

URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877906944&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your actual client ID.

## Project Structure

```
dwz-discord-bot/
├── src/
│   ├── commands/           # Slash commands
│   │   ├── ping.js
│   │   ├── help.js
│   │   └── info.js
│   ├── events/             # Event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageCreate.js
│   ├── index.js            # Main bot file
│   └── deploy-commands.js  # Command deployment script
├── .env                    # Environment variables
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Available Commands

- `/ping` - Check bot latency
- `/help` - Show available commands
- `/info` - Display bot and server information
- `/dwz [name]` - Search for a chess player's DWZ rating from the German Chess Federation

## Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.js`)
2. Use this template:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('Description of my command'),
    
    async execute(interaction) {
        await interaction.reply('Hello from my command!');
    },
};
```

3. Run the deploy script to register the new command:
```bash
node src/deploy-commands.js
```

## Adding New Events

1. Create a new file in `src/events/` (e.g., `myevent.js`)
2. Use this template:

```javascript
const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate, // Or any other event
    once: false, // Set to true for one-time events
    execute(message, client) {
        // Event handling logic
    },
};
```

## Environment Variables

- `DISCORD_TOKEN` - Your bot's token (required)
- `CLIENT_ID` - Your application's client ID (required for command deployment)
- `GUILD_ID` - Guild ID for testing commands (optional, for faster deployment during development)

## Security Notes

- Never commit your `.env` file
- Keep your bot token secure
- Regularly rotate your bot token if compromised
- Use environment variables for all sensitive data

## Troubleshooting

### Common Issues

1. **Bot not responding to commands**
   - Make sure commands are deployed with `node src/deploy-commands.js`
   - Check that the bot has proper permissions in your server

2. **Missing permissions error**
   - Ensure the bot has the necessary permissions in your Discord server
   - Check the invite link includes the required scopes and permissions

3. **Environment variables not loading**
   - Make sure `.env` file exists and is properly formatted
   - Verify that `require('dotenv').config()` is called before accessing process.env

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
