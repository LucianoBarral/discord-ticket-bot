const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Exibe estatísticas do sistema de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Carregar estatísticas
            const statsFile = path.join(__dirname, '..', 'data', 'stats.json');
            let stats = {
                totalTickets: 0,
                closedTickets: 0,
                feedbackCount: 0,
                totalRating: 0
            };

            try {
                if (fs.existsSync(statsFile)) {
                    stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                }
            } catch (e) {
                // Usar padrão
            }

            // Carregar feedbacks para calcular média
            const feedbackFile = path.join(__dirname, '..', 'data', 'feedback.json');
            let feedbacks = [];
            try {
                if (fs.existsSync(feedbackFile)) {
                    feedbacks = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
                }
            } catch (e) {
                feedbacks = [];
            }

            // Calcular média de avaliação
            const totalRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
            const avgRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : '0.0';
            const starDisplay = '⭐'.repeat(Math.round(parseFloat(avgRating)));

            // Contar tickets abertos atualmente
            const openTickets = interaction.guild.channels.cache.filter(ch =>
                ch.name.includes('ticket-') &&
                ch.type === 0 // Text channel
            ).size;

            // Distribuição de avaliações
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            feedbacks.forEach(f => {
                if (f.rating >= 1 && f.rating <= 5) {
                    ratingDistribution[f.rating]++;
                }
            });

            // Criar embed de estatísticas
            const embed = new EmbedBuilder()
                .setColor(config.colors?.primary || '#5865F2')
                .setAuthor({
                    name: '📊 Dashboard de Estatísticas',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle(`${config.texts?.serverName || interaction.guild.name} - Tickets`)
                .setDescription(
                    '```ansi\n' +
                    '\u001b[1;36m╔══════════════════════════════════════╗\n' +
                    '║        ESTATÍSTICAS DE SUPORTE       ║\n' +
                    '╚══════════════════════════════════════╝\u001b[0m\n' +
                    '```'
                )
                .addFields(
                    {
                        name: '📥 Tickets Totais',
                        value: `\`${stats.totalTickets || 0}\``,
                        inline: true
                    },
                    {
                        name: '📂 Tickets Abertos',
                        value: `\`${openTickets}\``,
                        inline: true
                    },
                    {
                        name: '✅ Tickets Fechados',
                        value: `\`${stats.closedTickets || 0}\``,
                        inline: true
                    },
                    {
                        name: '⭐ Avaliação Média',
                        value: `**${avgRating}**/5.0 ${starDisplay || '☆'}`,
                        inline: true
                    },
                    {
                        name: '📝 Total de Avaliações',
                        value: `\`${feedbacks.length}\``,
                        inline: true
                    },
                    {
                        name: '📈 Taxa de Resolução',
                        value: `\`${stats.totalTickets > 0 ? Math.round((stats.closedTickets / stats.totalTickets) * 100) : 0}%\``,
                        inline: true
                    }
                )
                .setFooter({
                    text: `${config.texts?.footerText || 'Sistema de Tickets'} • Estatísticas em tempo real`,
                    iconURL: config.images?.footer
                })
                .setTimestamp();

            // Adicionar distribuição de avaliações se houver feedbacks
            if (feedbacks.length > 0) {
                const distribution =
                    `⭐ 1: ${ratingDistribution[1]} | ` +
                    `⭐ 2: ${ratingDistribution[2]} | ` +
                    `⭐ 3: ${ratingDistribution[3]} | ` +
                    `⭐ 4: ${ratingDistribution[4]} | ` +
                    `⭐ 5: ${ratingDistribution[5]}`;

                embed.addFields({
                    name: '📊 Distribuição de Avaliações',
                    value: `\`\`\`${distribution}\`\`\``,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[STATS COMMAND ERROR]', error);
            await interaction.editReply({
                content: '❌ Erro ao carregar estatísticas.'
            });
        }
    }
};
