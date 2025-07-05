const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            console.log(`Button interaction: ${interaction.customId}`);
            // Add button handling logic here
        }
        
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            console.log(`Select menu interaction: ${interaction.customId}`);
            // Add select menu handling logic here
        }
        
        // Handle modal interactions
        else if (interaction.isModalSubmit()) {
            console.log(`Modal interaction: ${interaction.customId}`);
            // Add modal handling logic here
        }
    },
};
