const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DiscordBot {
    constructor() {
        // Create a new client instance
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        // Create collections for commands and events
        this.client.commands = new Collection();
        this.client.events = new Collection();

        // Initialize the bot
        this.init();
    }

    async init() {
        try {
            // Load commands and events
            await this.loadCommands();
            await this.loadEvents();

            // Login to Discord
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Error initializing bot:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        
        // Check if commands directory exists
        if (!fs.existsSync(commandsPath)) {
            console.log('Commands directory not found, creating...');
            fs.mkdirSync(commandsPath, { recursive: true });
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    this.client.commands.set(command.data.name, command);
                    console.log(`Loaded command: ${command.data.name}`);
                } else {
                    console.log(`Warning: Command at ${filePath} is missing required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`Error loading command ${file}:`, error);
            }
        }
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        
        // Check if events directory exists
        if (!fs.existsSync(eventsPath)) {
            console.log('Events directory not found, creating...');
            fs.mkdirSync(eventsPath, { recursive: true });
            return;
        }

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                const event = require(filePath);
                
                if (event.once) {
                    this.client.once(event.name, (...args) => event.execute(...args, this.client));
                } else {
                    this.client.on(event.name, (...args) => event.execute(...args, this.client));
                }
                
                console.log(`Loaded event: ${event.name}`);
            } catch (error) {
                console.error(`Error loading event ${file}:`, error);
            }
        }
    }

    // Graceful shutdown
    shutdown() {
        console.log('Shutting down bot...');
        this.client.destroy();
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Graceful shutdown...');
    if (global.bot) {
        global.bot.shutdown();
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    if (global.bot) {
        global.bot.shutdown();
    } else {
        process.exit(0);
    }
});

// Create and start the bot
const bot = new DiscordBot();
global.bot = bot;

module.exports = DiscordBot;
