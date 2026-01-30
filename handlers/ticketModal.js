const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ChannelType,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');
const config = require('../config');
const { createWelcomeEmbed, createErrorEmbed, createSuccessEmbed, createPanelEmbed } = require('../utils/embeds');
const { updateStats } = require('./ticketActions');

/**
 * Cria os componentes do select menu de tickets
 */
function createTicketSelectMenu() {
    const currentConfig = config.loadConfig();

    const selectOptions = currentConfig.categories.map(category => ({
        label: category.label,
        value: category.value,
        description: category.description,
        emoji: category.emoji
    }));

    if (selectOptions.length === 0) {
        selectOptions.push({
            label: '⚠️ Nenhuma categoria',
            value: 'none',
            description: 'Configure as categorias primeiro',
            emoji: '⚠️'
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select_category')
        .setPlaceholder('📁 Selecione uma categoria...')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(selectOptions);

    return [new ActionRowBuilder().addComponents(selectMenu)];
}

/**
 * Gerencia a abertura do modal ao selecionar categoria
 */
async function handleCategorySelect(interaction) {
    try {
        const selectedCategory = interaction.values[0];

        // Verificar se é a opção "nenhuma categoria"
        if (selectedCategory === 'none') {
            return await interaction.reply({
                embeds: [createErrorEmbed('Nenhuma categoria disponível. Peça ao administrador para configurar.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificar limite de tickets abertos
        const ticketLimit = config.tickets?.limit || 3;
        const userOpenTickets = interaction.guild.channels.cache.filter(ch =>
            ch.name.includes(`ticket-`) &&
            ch.topic?.includes(interaction.user.id)
        ).size;

        if (userOpenTickets >= ticketLimit) {
            return await interaction.reply({
                embeds: [createErrorEmbed(`Você já possui **${userOpenTickets}** ticket(s) aberto(s). O limite é **${ticketLimit}**.\n\nFeche um ticket existente antes de abrir outro.`)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Criar Modal
        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${selectedCategory}`)
            .setTitle('📝 Abrir Ticket de Suporte');

        // Campo: Assunto
        const subjectInput = new TextInputBuilder()
            .setCustomId('ticket_subject')
            .setLabel('📌 Assunto do Ticket')
            .setPlaceholder('Ex: Problema com pagamento')
            .setStyle(TextInputStyle.Short)
            .setMinLength(5)
            .setMaxLength(100)
            .setRequired(true);

        // Campo: Descrição
        const descriptionInput = new TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('📝 Descrição Detalhada')
            .setPlaceholder('Descreva seu problema com o máximo de detalhes possível...')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(20)
            .setMaxLength(1000)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(subjectInput),
            new ActionRowBuilder().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);

        // Resetar o select menu atualizando a mensagem
        try {
            await interaction.message.edit({
                embeds: [createPanelEmbed()],
                components: createTicketSelectMenu()
            });
        } catch (e) {
            // Ignora se não conseguir editar
        }

    } catch (error) {
        console.error('[CATEGORY SELECT ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Ocorreu um erro ao abrir o formulário.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

/**
 * Processa o modal e cria o canal do ticket
 */
async function handleModalSubmit(interaction) {
    try {
        const category = interaction.customId.replace('ticket_modal_', '');
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const description = interaction.fields.getTextInputValue('ticket_description');
        const user = interaction.user;
        const guild = interaction.guild;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Gerar ID único
        const ticketId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const channelName = `ticket-${user.username.toLowerCase()}-${ticketId}`;

        // Criar canal
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: config.channels.ticketCategory || null,
            topic: `Ticket de ${user.tag} | Categoria: ${category} | ID: ${ticketId}`,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: config.roles.staff,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ]
        });

        // Botões de ação
        const closeButton = new ButtonBuilder()
            .setCustomId(`ticket_close_${ticketId}_${user.id}_${category}`)
            .setLabel('Fechar Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger);

        const staffButton = new ButtonBuilder()
            .setCustomId(`ticket_staff_${ticketId}`)
            .setLabel('Painel Staff')
            .setEmoji('🛠️')
            .setStyle(ButtonStyle.Primary);

        const transcriptButton = new ButtonBuilder()
            .setCustomId(`ticket_transcript_${ticketId}`)
            .setLabel('Salvar Transcrição')
            .setEmoji('📑')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(closeButton, staffButton, transcriptButton);

        // Enviar mensagem de boas-vindas
        await ticketChannel.send({
            content: `${user} | <@&${config.roles.staff}>`,
            embeds: [createWelcomeEmbed(user, category, subject, description)],
            components: [buttonRow]
        });

        // Atualizar estatísticas
        updateStats('open', category);

        // Responder ao usuário
        await interaction.editReply({
            embeds: [createSuccessEmbed(`Seu ticket foi criado com sucesso! ${ticketChannel}`)]
        });

    } catch (error) {
        console.error('[MODAL SUBMIT ERROR]', error);

        const errorMessage = error.code === 50013
            ? 'Não tenho permissão para criar canais. Verifique minhas permissões.'
            : 'Ocorreu um erro ao criar seu ticket.';

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [createErrorEmbed(errorMessage)]
            }).catch(() => { });
        } else {
            await interaction.reply({
                embeds: [createErrorEmbed(errorMessage)],
                flags: MessageFlags.Ephemeral
            }).catch(() => { });
        }
    }
}

module.exports = { handleCategorySelect, handleModalSubmit };
