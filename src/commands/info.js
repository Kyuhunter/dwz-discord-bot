const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display bot and server information'),
    
    async execute(interaction) {
        const { client, guild } = interaction;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📊 Bot Information')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { 
                    name: '🤖 Bot Name', 
                    value: client.user.tag, 
                    inline: true 
                },
                { 
                    name: '🆔 Bot ID', 
                    value: client.user.id, 
                    inline: true 
                },
                { 
                    name: '📅 Created', 
                    value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:F>`, 
                    inline: true 
                },
                { 
                    name: '🔗 Servers', 
                    value: `${client.guilds.cache.size}`, 
                    inline: true 
                },
                { 
                    name: '👥 Users', 
                    value: `${client.users.cache.size}`, 
                    inline: true 
                },
                { 
                    name: '💓 Ping', 
                    value: `${client.ws.ping}ms`, 
                    inline: true 
                }
            );

        // Add server-specific information if in a guild
        if (guild) {
            embed.addFields(
                { 
                    name: '🏠 Current Server', 
                    value: guild.name, 
                    inline: true 
                },
                { 
                    name: '👑 Server Owner', 
                    value: `<@${guild.ownerId}>`, 
                    inline: true 
                },
                { 
                    name: '📊 Server Members', 
                    value: `${guild.memberCount}`, 
                    inline: true 
                }
            );
        }

        embed.setFooter({ 
            text: `Requested by ${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
