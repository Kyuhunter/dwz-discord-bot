const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');

// Load all commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        logger.info(`Loaded command: ${command.data.name}`);
    } else {
        logger.warn(`Command at ${filePath} missing required "data" or "execute" property.`);
    }
}

async function getClientInfo() {
    // Create a temporary client to get the application info
    const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    
    return new Promise((resolve, reject) => {
        tempClient.once('ready', async () => {
            try {
                const clientId = tempClient.user.id;
                logger.info(`Retrieved Client ID: ${clientId}`);
                
                // Get guild ID from environment or detect from bot's guilds
                let guildId = process.env.GUILD_ID;
                
                if (!guildId && tempClient.guilds.cache.size > 0) {
                    // Use the first guild the bot is in for testing
                    const firstGuild = tempClient.guilds.cache.first();
                    guildId = firstGuild.id;
                    logger.info(`Auto-detected Guild ID: ${guildId} (${firstGuild.name})`);
                }
                
                await tempClient.destroy();
                resolve({ clientId, guildId });
            } catch (error) {
                await tempClient.destroy();
                reject(error);
            }
        });
        
        tempClient.once('error', async (error) => {
            await tempClient.destroy();
            reject(error);
        });
        
        tempClient.login(process.env.DISCORD_TOKEN).catch(reject);
    });
}

(async () => {
    try {
        logger.info(`Loaded ${commands.length} application commands.`);
        logger.info('Getting bot information...');
        
        const { clientId, guildId } = await getClientInfo();
        
        // Create REST instance and deploy commands
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        logger.info(`Started refreshing ${commands.length} application commands.`);

        // Choose deployment method based on guild availability
        if (guildId) {
            // Deploy to specific guild (for testing/faster deployment)
            logger.info(`Deploying commands to guild: ${guildId} (dev mode)`);
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            logger.info(`Successfully reloaded ${data.length} guild commands.`);
            logger.info('Commands available immediately in guild.');
        } else {
            // Deploy globally (for production)
            logger.info('Deploying commands globally (production mode)');
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            logger.info(`Successfully reloaded ${data.length} global commands.`);
            logger.info('Global commands may take up to 1 hour to propagate.');
        }

    } catch (error) {
        logger.error('Error deploying commands', error);
        if (error.code === 'TokenInvalid') {
            logger.error('Invalid bot token. Check DISCORD_TOKEN in .env');
        } else if (error.code === 50001) {
            logger.error('Bot lacks permission to create application commands.');
        } else if (error.rawError?.message?.includes('Cannot send messages to this user')) {
            logger.error('Bot cannot send messages. Check permissions.');
        }
        process.exit(1);
    }
})();
