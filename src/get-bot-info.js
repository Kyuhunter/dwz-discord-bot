const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const { logger } = require('./utils/logger');

async function getBotInfo() {
    logger.info('Discord Bot Information Retriever');
    logger.info('==============================');
    
    if (!process.env.DISCORD_TOKEN) {
        logger.error('DISCORD_TOKEN not found in .env file');
        logger.info('Please add your bot token to the .env file:');
        logger.info('DISCORD_TOKEN=your_bot_token_here');
        process.exit(1);
    }
    
    const client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
        ] 
    });
    
    client.once('ready', () => {
        logger.info(`Bot logged in as: ${client.user.tag}`);
        logger.info(`Client ID: ${client.user.id}`);
        logger.info(`Bot created: ${client.user.createdAt.toDateString()}`);
        logger.info('');
        
        if (client.guilds.cache.size === 0) {
            logger.warn('Bot is not in any servers yet.');
            logger.info('Invite your bot using this URL:');
            logger.info(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=274877906944&scope=bot%20applications.commands`);
        } else {
            logger.info(`Bot is in ${client.guilds.cache.size} server(s):`);
            logger.info('');
            
            client.guilds.cache.forEach((guild, index) => {
                logger.info(`${index + 1}. ${guild.name}`);
                logger.info(`   Guild ID: ${guild.id}`);
                logger.info(`   Members: ${guild.memberCount}`);
                logger.info(`   Owner: ${guild.ownerId}`);
                logger.info('');
            });
            
            if (client.guilds.cache.size === 1) {
                const guild = client.guilds.cache.first();
                logger.info('For testing, you can use this Guild ID in your .env file:');
                logger.info(`GUILD_ID=${guild.id}`);
            } else {
                logger.info('Choose a Guild ID from above for testing, or leave GUILD_ID empty for global deployment');
            }
        }
        
        logger.info('');
        logger.info('Your .env file should look like this:');
        logger.info(`DISCORD_TOKEN=${process.env.DISCORD_TOKEN}`);
        logger.info(`CLIENT_ID=${client.user.id}`);
        if (client.guilds.cache.size > 0) {
            logger.info(`GUILD_ID=${client.guilds.cache.first().id}  # Optional: for faster testing`);
        } else {
            logger.info('GUILD_ID=  # Optional: add after inviting bot to a server');
        }
        
        client.destroy();
        process.exit(0);
    });
    
    client.on('error', (error) => {
        logger.error('Error connecting to Discord:', error.message);
        
        if (error.code === 'TokenInvalid') {
            logger.error('Invalid bot token. Please check your DISCORD_TOKEN in .env file.');
        }
        
        process.exit(1);
    });
    
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        logger.error('Failed to login:', error.message);
        process.exit(1);
    }
}

getBotInfo();
