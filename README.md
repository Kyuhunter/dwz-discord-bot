# DWZ Discord Bot

A modern Discord bot built with Node.js and discord.js v14 that provides DWZ (Deutsche Wertungszahl) chess rating lookup functionality.

## Features

- 🤖 Modern Discord.js v14 framework
- ⚡ Slash command support
- 🔧 Event-driven architecture
- 📁 Modular command and event structure
- 🛡️ Error handling and logging
- 🔄 Hot-reload support with nodemon
- 🎯 Easy command deployment
- ♟️ DWZ chess rating lookup with chart generation
- 🌐 Multi-language support (English/German)
- 📊 Visual rating progression charts

## Prerequisites

- Node.js 18.0.0 or higher
- A Discord application and bot token

## Setup

### 1. Installation

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
4. **Important**: Enable "Message Content Intent" in the Bot settings
5. Copy the bot token (**this is the only required credential**)
6. Optionally, invite your bot to a test server

### 3. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your bot token:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=  # Optional: detected automatically
GUILD_ID=   # Optional: for testing
```

**Note**: CLIENT_ID and GUILD_ID are now automatically detected! You only need the DISCORD_TOKEN.

3. Get bot information (optional):
```bash
npm run info
```

This will show you the Client ID, Guild IDs, and generate the invite URL.

### 4. Deploy Commands and Start Bot

```bash
# Deploy slash commands (automatically detects Client ID and Guild ID)
npm run deploy

# Start in development mode with auto-restart
npm run dev

# Or start in production mode
npm start
```

**Commands available:**
- `npm run info` - Get bot and server information
- `npm run deploy` - Deploy slash commands  
- `npm run dev` - Development mode with auto-restart
- `npm start` - Production mode

### 5. Invite Bot to Server

The bot can generate its own invite URL! Run:
```bash
npm run info
```

Or create manually with these permissions:
- Bot Scope  
- Application Commands
- Send Messages
- View Channels
- Read Message History

URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877906944&scope=bot%20applications.commands
```

## Project Structure

```
dwz-discord-bot/
├── src/
│   ├── commands/           # Slash commands
│   │   ├── dwz.js         # DWZ player search
│   │   ├── help.js        # Help command
│   │   ├── info.js        # Bot information
│   │   └── ping.js        # Ping command
│   ├── constants/          # Centralized constants
│   │   └── index.js
│   ├── events/             # Event handlers
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   ├── helpers/            # Helper utilities
│   │   └── errorHandler.js
│   ├── services/           # Business logic services
│   │   ├── dwzSearchService.js
│   │   └── embedService.js
│   ├── utils/              # Utility functions
│   │   ├── chartGenerator.js
│   │   ├── config.js
│   │   └── logger.js
│   ├── validators/         # Input validation
│   │   └── index.js
│   ├── index.js            # Main bot entry point
│   ├── deploy-commands.js  # Command deployment
│   └── get-bot-info.js     # Bot information utility
├── translations/           # Multi-language support
│   ├── en.yaml
│   └── de.yaml
├── .env                    # Environment variables
├── .env.example           # Environment template
├── .gitignore
├── config.yaml            # Configuration file
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

- `DISCORD_TOKEN` - Your bot's token (**required**)
- `CLIENT_ID` - Your application's client ID (optional, auto-detected)
- `GUILD_ID` - Guild ID for testing commands (optional, auto-detected from first server)

## Security Notes

- Never commit your `.env` file
- Keep your bot token secure
- Regularly rotate your bot token if compromised
- Use environment variables for all sensitive data

## Troubleshooting

### "Used disallowed intents" Error

This error occurs when the bot needs intents that aren't enabled in Discord Developer Portal.

**Quick Fix:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → Bot
3. Scroll down to "Privileged Gateway Intents"
4. Enable "Message Content Intent"
5. Save changes and restart the bot

### Common Issues

1. **Bot not responding to commands**
   - Make sure commands are deployed with `npm run deploy`
   - Check that the bot has proper permissions in your server
   - Verify "Message Content Intent" is enabled

2. **Missing permissions error**
   - Ensure the bot has the necessary permissions in your Discord server
   - Check the invite link includes the required scopes and permissions

3. **Environment variables not loading**
   - Make sure `.env` file exists and is properly formatted
   - Verify that `DISCORD_TOKEN` is set correctly
   - Only `DISCORD_TOKEN` is required; other values are auto-detected

4. **DWZ search not working**
   - Verify internet connection for accessing dwz.de
   - Check if the search name is spelled correctly
   - Try using different search terms or partial names

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
