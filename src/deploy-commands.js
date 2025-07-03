const { REST, Routes } = require('discord.js');
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

// Create REST instance and deploy commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Choose deployment method based on environment
        if (process.env.GUILD_ID) {
            // Deploy to specific guild (for testing)
            console.log('Deploying commands to guild (development mode)...');
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            // Deploy globally (for production)
            console.log('Deploying commands globally (production mode)...');
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
        }

    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();
