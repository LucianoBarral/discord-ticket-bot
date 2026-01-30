const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const config = require('../config');
const {
    createClosedEmbed,
    createErrorEmbed,
    createSuccessEmbed,
    createStaffPanelEmbed
} = require('../utils/embeds');
const { generateTranscript, sendTranscriptToLogs } = require('./transcript');

/**
 * Fecha o ticket
 */
async function handleCloseTicket(interaction, ticketId, openerId, category) {
    try {
        const user = interaction.user;
        const channel = interaction.channel;
        const guild = interaction.guild;

        // Verificar permissões (apenas staff ou dono do ticket)
        const isStaff = interaction.member.roles.cache.has(config.roles.staff);
        const isOwner = user.id === openerId;

        if (!isStaff && !isOwner) {
            return await interaction.reply({
                embeds: [createErrorEmbed('Você não tem permissão para fechar este ticket.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Botões de confirmação
        const confirmButton = new ButtonBuilder()
            .setCustomId(`ticket_confirm_close_${ticketId}_${openerId}_${category}`)
            .setLabel('Confirmar Fechamento')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('ticket_cancel_close')
            .setLabel('Cancelar')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.reply({
            content: `${config.emojis.warning} **Tem certeza que deseja fechar este ticket?**\n> A transcrição será salva automaticamente.`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('[CLOSE TICKET ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao processar fechamento do ticket.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Confirma o fechamento do ticket
 */
async function handleConfirmClose(interaction, ticketId, openerId, category) {
    try {
        await interaction.update({
            content: `${config.emojis.clock} Fechando ticket e gerando transcrição...`,
            components: []
        });

        const channel = interaction.channel;
        const guild = interaction.guild;
        const closedBy = interaction.user;

        // Buscar informações do usuário que abriu
        let openedBy;
        try {
            openedBy = await interaction.client.users.fetch(openerId);
        } catch {
            openedBy = { id: openerId, tag: 'Usuário Desconhecido' };
        }

        // Gerar transcrição
        const transcript = await generateTranscript(channel);

        // Dados do ticket para log
        const ticketData = {
            ticketId,
            channelName: channel.name,
            category,
            openedBy: {
                id: openedBy.id,
                tag: openedBy.tag || 'Desconhecido'
            },
            closedBy: {
                id: closedBy.id,
                tag: closedBy.tag
            },
            duration: calculateDuration(channel.createdTimestamp)
        };

        // Enviar para logs
        if (transcript) {
            await sendTranscriptToLogs(interaction.client, ticketData, transcript);
        }

        // Atualizar estatísticas
        updateStats('close', category);

        // Verificar se feedback está habilitado
        const feedbackEnabled = config.tickets?.feedbackEnabled !== false;

        // Tentar enviar transcrição e feedback para o usuário via DM
        try {
            const feedbackRow = feedbackEnabled ? new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`feedback_1_${ticketId}`).setLabel('1').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`feedback_2_${ticketId}`).setLabel('2').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`feedback_3_${ticketId}`).setLabel('3').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`feedback_4_${ticketId}`).setLabel('4').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`feedback_5_${ticketId}`).setLabel('5').setEmoji('⭐').setStyle(ButtonStyle.Success)
            ) : null;

            const dmMessage = {
                content: feedbackEnabled ? '**Por favor, avalie nosso atendimento (1-5 estrelas):**' : null,
                embeds: [createClosedEmbed(closedBy, openedBy, category, ticketId)],
                files: transcript ? [transcript] : [],
                components: feedbackRow ? [feedbackRow] : []
            };

            await openedBy.send(dmMessage);
        } catch {
            // Usuário com DM fechada
            console.log(`[DM] Não foi possível enviar DM para ${openedBy.tag}`);
        }

        // Deletar canal após delay
        await channel.send({
            embeds: [createClosedEmbed(closedBy, openedBy, category, ticketId)]
        });

        setTimeout(async () => {
            try {
                await channel.delete('Ticket fechado');
            } catch (err) {
                console.error('[DELETE CHANNEL ERROR]', err);
            }
        }, feedbackEnabled ? 15000 : 5000); // 15s se feedback habilitado, 5s se não

    } catch (error) {
        console.error('[CONFIRM CLOSE ERROR]', error);
        await interaction.followUp({
            embeds: [createErrorEmbed('Erro ao fechar o ticket.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Cancela o fechamento
 */
async function handleCancelClose(interaction) {
    await interaction.update({
        content: `${config.emojis.success} Fechamento cancelado.`,
        components: []
    });
}

/**
 * Mostra painel de staff
 */
async function handleStaffPanel(interaction, ticketId) {
    try {
        // Verificar se é staff
        const isStaff = interaction.member.roles.cache.has(config.roles.staff);

        if (!isStaff) {
            return await interaction.reply({
                embeds: [createErrorEmbed('Apenas membros da equipe podem acessar este painel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Extrair owner ID do tópico do canal
        const topic = interaction.channel.topic || '';
        const ownerIdMatch = topic.match(/Ticket de .+ \| Categoria: (\w+)/);
        const categoryFromTopic = ownerIdMatch ? ownerIdMatch[1] : 'N/A';

        // Botões do painel staff
        const notifyButton = new ButtonBuilder()
            .setCustomId(`ticket_notify_${ticketId}`)
            .setLabel('Notificar Usuário')
            .setEmoji('🔔')
            .setStyle(ButtonStyle.Primary);

        const claimButton = new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticketId}`)
            .setLabel('Assumir Ticket')
            .setEmoji('✋')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(notifyButton, claimButton);

        await interaction.reply({
            embeds: [createStaffPanelEmbed()],
            components: [row],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('[STAFF PANEL ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao abrir painel de staff.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Notifica o usuário do ticket
 */
async function handleNotifyUser(interaction, ticketId) {
    try {
        const channel = interaction.channel;
        const topic = channel.topic || '';

        // Extrair user ID do nome do canal
        const channelName = channel.name;
        const usernameMatch = channelName.match(/ticket-(.+)-[A-Z0-9]+$/);

        if (!usernameMatch) {
            return await interaction.reply({
                embeds: [createErrorEmbed('Não foi possível identificar o usuário do ticket.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Buscar membro pelo nome
        const members = await interaction.guild.members.fetch({ query: usernameMatch[1], limit: 1 });
        const member = members.first();

        if (member) {
            await channel.send({
                content: `${config.emojis.warning} ${member}, a equipe está aguardando sua resposta!`
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Usuário notificado com sucesso!')],
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                embeds: [createErrorEmbed('Usuário não encontrado no servidor.')],
                flags: MessageFlags.Ephemeral
            });
        }

    } catch (error) {
        console.error('[NOTIFY USER ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao notificar usuário.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Staff assume o ticket
 */
async function handleClaimTicket(interaction, ticketId) {
    try {
        const staff = interaction.user;
        const channel = interaction.channel;

        // Mover para categoria de tickets em atendimento
        const claimedCategoryId = config.channels?.claimedTicketCategory;
        if (claimedCategoryId) {
            try {
                // Mover para a categoria de atendimento
                await channel.setParent(claimedCategoryId, { lockPermissions: false });

                // Mover para o final da categoria (tickets mais novos embaixo)
                const category = channel.guild.channels.cache.get(claimedCategoryId);
                if (category) {
                    const channelsInCategory = channel.guild.channels.cache
                        .filter(c => c.parentId === claimedCategoryId && c.type === 0)
                        .sort((a, b) => a.position - b.position);

                    // Posicionar no final
                    const lastPosition = channelsInCategory.size > 0
                        ? Math.max(...channelsInCategory.map(c => c.position)) + 1
                        : 0;
                    await channel.setPosition(lastPosition);
                }
            } catch (moveErr) {
                console.error('[CLAIM MOVE ERROR]', moveErr);
            }
        }

        await channel.send({
            content: `${config.emojis.success} **${staff.tag}** assumiu este ticket e está cuidando do seu atendimento!`
        });

        await interaction.reply({
            embeds: [createSuccessEmbed('Você assumiu este ticket!' + (claimedCategoryId ? ' O canal foi movido.' : ''))],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('[CLAIM TICKET ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao assumir ticket.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Calcula duração do ticket
 */
function calculateDuration(createdTimestamp) {
    const diff = Date.now() - createdTimestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

/**
 * Processa feedback do ticket
 */
async function handleFeedback(interaction, rating, ticketId) {
    try {
        const fs = require('fs');
        const path = require('path');
        const feedbackFile = path.join(__dirname, '..', 'data', 'feedback.json');

        // Carregar feedbacks existentes
        let feedbacks = [];
        try {
            if (fs.existsSync(feedbackFile)) {
                feedbacks = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
            }
        } catch (e) {
            feedbacks = [];
        }

        // Adicionar novo feedback
        feedbacks.push({
            ticketId,
            rating: parseInt(rating),
            userId: interaction.user.id,
            userTag: interaction.user.tag,
            timestamp: new Date().toISOString()
        });

        // Salvar
        fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));

        // Atualizar estatísticas
        updateStats('feedback', interaction.channel?.parentId);

        await interaction.update({
            content: `✅ Obrigado pela avaliação! Você deu **${rating} ⭐** para este atendimento.`,
            components: []
        });

    } catch (error) {
        console.error('[FEEDBACK ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao salvar feedback.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Atualiza estatísticas
 */
function updateStats(type, category = null) {
    const fs = require('fs');
    const path = require('path');
    const statsFile = path.join(__dirname, '..', 'data', 'stats.json');

    let stats = {
        totalTickets: 0,
        closedTickets: 0,
        feedbackCount: 0,
        totalRating: 0,
        ticketsByCategory: {}
    };

    try {
        if (fs.existsSync(statsFile)) {
            stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
    } catch (e) {
        // Usar padrão
    }

    if (type === 'open') {
        stats.totalTickets++;
    } else if (type === 'close') {
        stats.closedTickets++;
    } else if (type === 'feedback') {
        stats.feedbackCount++;
    }

    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

module.exports = {
    handleCloseTicket,
    handleConfirmClose,
    handleCancelClose,
    handleStaffPanel,
    handleNotifyUser,
    handleClaimTicket,
    handleFeedback,
    updateStats
};
