const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function getBotInfo() {
    console.log('🤖 Discord Bot Information Retriever');
    console.log('====================================');
    
    if (!process.env.DISCORD_TOKEN) {
        console.error('❌ DISCORD_TOKEN not found in .env file');
        console.log('Please add your bot token to the .env file:');
        console.log('DISCORD_TOKEN=your_bot_token_here');
        process.exit(1);
    }
    
    const client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
        ] 
    });
    
    client.once('ready', () => {
        console.log(`✅ Bot logged in as: ${client.user.tag}`);
        console.log(`🆔 Client ID: ${client.user.id}`);
        console.log(`📅 Bot created: ${client.user.createdAt.toDateString()}`);
        console.log('');
        
        if (client.guilds.cache.size === 0) {
            console.log('⚠️  Bot is not in any servers yet.');
            console.log('🔗 Invite your bot using this URL:');
            console.log(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=274877906944&scope=bot%20applications.commands`);
        } else {
            console.log(`🏠 Bot is in ${client.guilds.cache.size} server(s):`);
            console.log('');
            
            client.guilds.cache.forEach((guild, index) => {
                console.log(`${index + 1}. ${guild.name}`);
                console.log(`   Guild ID: ${guild.id}`);
                console.log(`   Members: ${guild.memberCount}`);
                console.log(`   Owner: ${guild.ownerId}`);
                console.log('');
            });
            
            if (client.guilds.cache.size === 1) {
                const guild = client.guilds.cache.first();
                console.log('💡 For testing, you can use this Guild ID in your .env file:');
                console.log(`GUILD_ID=${guild.id}`);
            } else {
                console.log('💡 Choose a Guild ID from above for testing, or leave GUILD_ID empty for global deployment');
            }
        }
        
        console.log('');
        console.log('📝 Your .env file should look like this:');
        console.log(`DISCORD_TOKEN=${process.env.DISCORD_TOKEN}`);
        console.log(`CLIENT_ID=${client.user.id}`);
        if (client.guilds.cache.size > 0) {
            console.log(`GUILD_ID=${client.guilds.cache.first().id}  # Optional: for faster testing`);
        } else {
            console.log('GUILD_ID=  # Optional: add after inviting bot to a server');
        }
        
        client.destroy();
        process.exit(0);
    });
    
    client.on('error', (error) => {
        console.error('❌ Error connecting to Discord:', error.message);
        
        if (error.code === 'TokenInvalid') {
            console.error('🔑 Invalid bot token. Please check your DISCORD_TOKEN in .env file.');
        }
        
        process.exit(1);
    });
    
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Failed to login:', error.message);
        process.exit(1);
    }
}

getBotInfo();
