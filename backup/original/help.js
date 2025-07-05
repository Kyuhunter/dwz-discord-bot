const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands and bot information'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Bot Help')
            .setDescription('Here are all the commands you can use:')
            .addFields(
                { 
                    name: '📡 `/ping`', 
                    value: 'Check bot latency and response time', 
                    inline: true 
                },
                { 
                    name: '❓ `/help`', 
                    value: 'Show this help message', 
                    inline: true 
                },
                { 
                    name: '📊 `/info`', 
                    value: 'Display bot and server information', 
                    inline: true 
                },
                { 
                    name: '♟️ `/dwz [name]`', 
                    value: 'Search for a chess player\'s DWZ rating from the German Chess Federation', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
