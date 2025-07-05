const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Load all commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`Warning: Command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

async function getClientInfo() {
    // Create a temporary client to get the application info
    const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    
    return new Promise((resolve, reject) => {
        tempClient.once('ready', async () => {
            try {
                const clientId = tempClient.user.id;
                console.log(`✅ Retrieved Client ID: ${clientId}`);
                
                // Get guild ID from environment or detect from bot's guilds
                let guildId = process.env.GUILD_ID;
                
                if (!guildId && tempClient.guilds.cache.size > 0) {
                    // Use the first guild the bot is in for testing
                    const firstGuild = tempClient.guilds.cache.first();
                    guildId = firstGuild.id;
                    console.log(`🔍 Auto-detected Guild ID: ${guildId} (${firstGuild.name})`);
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
        console.log(`📦 Loaded ${commands.length} application (/) commands.`);
        console.log('🔐 Getting bot information...');
        
        const { clientId, guildId } = await getClientInfo();
        
        // Create REST instance and deploy commands
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        // Choose deployment method based on guild availability
        if (guildId) {
            // Deploy to specific guild (for testing/faster deployment)
            console.log(`🏠 Deploying commands to guild: ${guildId} (development mode)`);
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands.`);
            console.log(`ℹ️  Commands will be available immediately in the specified guild.`);
        } else {
            // Deploy globally (for production)
            console.log('🌍 Deploying commands globally (production mode)');
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
            console.log(`ℹ️  Global commands may take up to 1 hour to be available everywhere.`);
        }

    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 'TokenInvalid') {
            console.error('🔑 Invalid bot token. Please check your DISCORD_TOKEN in .env file.');
        } else if (error.code === 50001) {
            console.error('🚫 Bot lacks permission to create application commands.');
        } else if (error.rawError?.message?.includes('Cannot send messages to this user')) {
            console.error('💬 Bot cannot send messages. Check bot permissions.');
        }
        
        process.exit(1);
    }
})();
