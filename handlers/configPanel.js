const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const config = require('../config');

/**
 * Cria o embed principal do painel de configuração
 */
function createMainPanelEmbed(guild, currentConfig) {
    const logsChannel = currentConfig.channels.logs ? `<#${currentConfig.channels.logs}>` : '`❌ Não configurado`';
    const ticketCategory = currentConfig.channels.ticketCategory ? `\`✅ Configurado\`` : '`❌ Não configurado`';
    const staffRole = currentConfig.roles.staff ? `<@&${currentConfig.roles.staff}>` : '`❌ Não configurado`';
    const guildIcon = guild?.iconURL?.({ dynamic: true }) || null;

    return new EmbedBuilder()
        .setColor(currentConfig.colors.primary)
        .setAuthor({
            name: '⚙️ Painel de Configuração',
            iconURL: guildIcon
        })
        .setTitle(`🎫 ${currentConfig.texts.serverName} - Configurações`)
        .setDescription(
            '```ansi\n' +
            '\u001b[1;36m╔══════════════════════════════════════╗\n' +
            '║   Configure seu sistema de tickets   ║\n' +
            '║   de forma rápida e intuitiva!       ║\n' +
            '╚══════════════════════════════════════╝\u001b[0m\n' +
            '```\n' +
            '**Selecione uma opção abaixo para configurar:**'
        )
        .addFields(
            {
                name: '📢 Canais',
                value: `> Logs: ${logsChannel}\n> Categoria: ${ticketCategory}`,
                inline: true
            },
            {
                name: '👥 Cargos',
                value: `> Staff: ${staffRole}`,
                inline: true
            },
            {
                name: '📝 Textos',
                value: `> Servidor: \`${currentConfig.texts.serverName}\`\n> Footer: \`${currentConfig.texts.footerText}\``,
                inline: true
            },
            {
                name: '🎨 Cores',
                value: `> Primária: \`${currentConfig.colors.primary}\`\n> Sucesso: \`${currentConfig.colors.success}\`\n> Perigo: \`${currentConfig.colors.danger}\``,
                inline: true
            },
            {
                name: '🖼️ Imagens',
                value: currentConfig.images.banner ? '`✅ Configuradas`' : '`⚠️ Padrão`',
                inline: true
            },
            {
                name: '📁 Categorias',
                value: `> Total: \`${currentConfig.categories.length}\` tipos`,
                inline: true
            },
            {
                name: '🤖 Bot',
                value: `> Status: \`${currentConfig.bot?.activityText || 'Padrão'}\``,
                inline: true
            }
        )
        .setThumbnail(currentConfig.images.thumbnail || guild.iconURL({ dynamic: true, size: 256 }))
        .setImage(currentConfig.images.banner || null)
        .setFooter({
            text: `💡 Clique nos botões para editar • ${currentConfig.texts.footerText}`
        })
        .setTimestamp();
}

/**
 * Cria os botões do painel principal
 */
function createMainPanelButtons() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_channels')
            .setLabel('Canais')
            .setEmoji('📢')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_roles')
            .setLabel('Cargos')
            .setEmoji('👥')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_texts')
            .setLabel('Textos')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_colors')
            .setLabel('Cores')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_images')
            .setLabel('Imagens')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config_categories')
            .setLabel('Categorias')
            .setEmoji('📁')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config_emojis')
            .setLabel('Emojis')
            .setEmoji('😀')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config_bot')
            .setLabel('Bot')
            .setEmoji('🤖')
            .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_panel_texts')
            .setLabel('Painel')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('config_preview')
            .setLabel('Preview')
            .setEmoji('👁️')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('config_export')
            .setLabel('Exportar')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config_import')
            .setLabel('Importar')
            .setEmoji('📥')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config_reset')
            .setLabel('Resetar')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Danger)
    );

    return [row1, row2, row3];
}

/**
 * Envia/Atualiza o painel de configuração principal
 */
async function sendConfigPanel(interaction, isUpdate = false) {
    try {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setDescription('❌ Você não tem permissão para usar este comando!');

            if (isUpdate) {
                return await interaction.update({ embeds: [errorEmbed], components: [] });
            }
            return await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        const currentConfig = config.loadConfig();
        const embed = createMainPanelEmbed(interaction.guild, currentConfig);
        const components = createMainPanelButtons();

        if (isUpdate) {
            await interaction.update({ embeds: [embed], components });
        } else {
            await interaction.reply({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
        }

    } catch (error) {
        console.error('[CONFIG PANEL ERROR]', error);
    }
}

/**
 * Configuração de Canais
 */
async function handleChannelsConfig(interaction) {
    const currentConfig = config.loadConfig();

    const embed = new EmbedBuilder()
        .setColor(currentConfig.colors.info || '#5865F2')
        .setAuthor({ name: '📢 Configuração de Canais', iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setDescription(
            '**Selecione os canais para o sistema de tickets:**\n\n' +
            `> 📋 **Logs:** ${currentConfig.channels.logs ? `<#${currentConfig.channels.logs}>` : '`Não configurado`'}\n` +
            `> 📁 **Categoria:** ${currentConfig.channels.ticketCategory ? '`Configurado`' : '`Não configurado`'}\n\n` +
            '─────────────────────────────\n' +
            '💡 Use os menus abaixo para selecionar'
        )
        .setFooter({ text: 'As alterações são salvas automaticamente' });

    const logsSelect = new ChannelSelectMenuBuilder()
        .setCustomId('config_set_logs_channel')
        .setPlaceholder('📋 Selecione o canal de Logs')
        .setChannelTypes(ChannelType.GuildText);

    const categorySelect = new ChannelSelectMenuBuilder()
        .setCustomId('config_set_ticket_category')
        .setPlaceholder('📁 Categoria para Tickets Pendentes')
        .setChannelTypes(ChannelType.GuildCategory);

    const claimedCategorySelect = new ChannelSelectMenuBuilder()
        .setCustomId('config_set_claimed_category')
        .setPlaceholder('✅ Categoria para Em Atendimento')
        .setChannelTypes(ChannelType.GuildCategory);

    const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(logsSelect),
            new ActionRowBuilder().addComponents(categorySelect),
            new ActionRowBuilder().addComponents(claimedCategorySelect),
            backButton
        ]
    });
}

/**
 * Configuração de Cargos
 */
async function handleRolesConfig(interaction) {
    const currentConfig = config.loadConfig();

    const embed = new EmbedBuilder()
        .setColor(currentConfig.colors.info || '#5865F2')
        .setAuthor({ name: '👥 Configuração de Cargos', iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setDescription(
            '**Selecione os cargos para o sistema de tickets:**\n\n' +
            `> 🛠️ **Staff Atual:** ${currentConfig.roles.staff ? `<@&${currentConfig.roles.staff}>` : '`Não configurado`'}\n\n` +
            '─────────────────────────────\n' +
            '💡 Membros com este cargo podem ver e gerenciar todos os tickets'
        )
        .setFooter({ text: 'As alterações são salvas automaticamente' });

    const staffSelect = new RoleSelectMenuBuilder()
        .setCustomId('config_set_staff_role')
        .setPlaceholder('🛠️ Selecione o cargo de Staff');

    const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(staffSelect),
            backButton
        ]
    });
}

/**
 * Modal para Textos
 */
async function handleTextsConfig(interaction) {
    const currentConfig = config.loadConfig();

    const modal = new ModalBuilder()
        .setCustomId('config_modal_texts')
        .setTitle('📝 Configurar Textos');

    const serverNameInput = new TextInputBuilder()
        .setCustomId('config_server_name')
        .setLabel('Nome do Servidor')
        .setPlaceholder('Ex: Meu Servidor Incrível')
        .setValue(currentConfig.texts.serverName)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const footerTextInput = new TextInputBuilder()
        .setCustomId('config_footer_text')
        .setLabel('Texto do Footer')
        .setPlaceholder('Ex: Sistema de Suporte')
        .setValue(currentConfig.texts.footerText)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    modal.addComponents(
        new ActionRowBuilder().addComponents(serverNameInput),
        new ActionRowBuilder().addComponents(footerTextInput)
    );

    await interaction.showModal(modal);
}

/**
 * Modal para Cores
 */
async function handleColorsConfig(interaction) {
    const currentConfig = config.loadConfig();

    const modal = new ModalBuilder()
        .setCustomId('config_modal_colors')
        .setTitle('🎨 Configurar Cores');

    const primaryInput = new TextInputBuilder()
        .setCustomId('config_color_primary')
        .setLabel('Cor Primária (Hex) - Azul padrão')
        .setPlaceholder('#5865F2')
        .setValue(currentConfig.colors.primary)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    const successInput = new TextInputBuilder()
        .setCustomId('config_color_success')
        .setLabel('Cor de Sucesso (Hex) - Verde')
        .setPlaceholder('#57F287')
        .setValue(currentConfig.colors.success)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    const dangerInput = new TextInputBuilder()
        .setCustomId('config_color_danger')
        .setLabel('Cor de Perigo (Hex) - Vermelho')
        .setPlaceholder('#ED4245')
        .setValue(currentConfig.colors.danger)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    const warningInput = new TextInputBuilder()
        .setCustomId('config_color_warning')
        .setLabel('Cor de Aviso (Hex) - Amarelo')
        .setPlaceholder('#FEE75C')
        .setValue(currentConfig.colors.warning)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    const infoInput = new TextInputBuilder()
        .setCustomId('config_color_info')
        .setLabel('Cor Info (Hex) - Azul claro')
        .setPlaceholder('#5865F2')
        .setValue(currentConfig.colors.info)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(7);

    modal.addComponents(
        new ActionRowBuilder().addComponents(primaryInput),
        new ActionRowBuilder().addComponents(successInput),
        new ActionRowBuilder().addComponents(dangerInput),
        new ActionRowBuilder().addComponents(warningInput),
        new ActionRowBuilder().addComponents(infoInput)
    );

    await interaction.showModal(modal);
}

/**
 * Modal para Imagens
 */
async function handleImagesConfig(interaction) {
    const currentConfig = config.loadConfig();

    const modal = new ModalBuilder()
        .setCustomId('config_modal_images')
        .setTitle('🖼️ Configurar Imagens');

    const bannerInput = new TextInputBuilder()
        .setCustomId('config_image_banner')
        .setLabel('URL do Banner (imagem grande)')
        .setPlaceholder('https://exemplo.com/banner.png')
        .setValue(currentConfig.images.banner || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(500);

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('config_image_thumbnail')
        .setLabel('URL da Thumbnail (imagem pequena)')
        .setPlaceholder('https://exemplo.com/thumb.png')
        .setValue(currentConfig.images.thumbnail || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(500);

    const footerInput = new TextInputBuilder()
        .setCustomId('config_image_footer')
        .setLabel('URL do Ícone do Footer')
        .setPlaceholder('https://exemplo.com/icon.png')
        .setValue(currentConfig.images.footer || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(bannerInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
        new ActionRowBuilder().addComponents(footerInput)
    );

    await interaction.showModal(modal);
}

/**
 * Configuração de Categorias
 */
async function handleCategoriesConfig(interaction) {
    const currentConfig = config.loadConfig();

    const categoriesList = currentConfig.categories.length > 0
        ? currentConfig.categories.map((cat, i) =>
            `\`${i + 1}.\` ${cat.emoji} **${cat.label.replace(cat.emoji, '').trim()}**\n> ${cat.description}`
        ).join('\n\n')
        : '`Nenhuma categoria configurada`';

    const embed = new EmbedBuilder()
        .setColor(currentConfig.colors.info || '#5865F2')
        .setAuthor({ name: '📁 Configuração de Categorias', iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setDescription(
            '**Categorias de ticket disponíveis:**\n\n' +
            categoriesList +
            '\n\n─────────────────────────────'
        )
        .setFooter({ text: `Total: ${currentConfig.categories.length} categorias` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_add_category')
            .setLabel('Adicionar')
            .setEmoji('➕')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('config_remove_category')
            .setLabel('Remover')
            .setEmoji('➖')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentConfig.categories.length === 0),
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

/**
 * Modal para adicionar categoria
 */
async function handleAddCategoryModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('config_modal_add_category')
        .setTitle('➕ Adicionar Categoria');

    const labelInput = new TextInputBuilder()
        .setCustomId('category_label')
        .setLabel('Nome da Categoria')
        .setPlaceholder('Ex: Suporte VIP')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const valueInput = new TextInputBuilder()
        .setCustomId('category_value')
        .setLabel('ID único (sem espaços, minúsculo)')
        .setPlaceholder('Ex: suporte_vip')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30);

    const descInput = new TextInputBuilder()
        .setCustomId('category_description')
        .setLabel('Descrição')
        .setPlaceholder('Ex: Atendimento exclusivo para VIPs')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
        .setCustomId('category_emoji')
        .setLabel('Emoji')
        .setPlaceholder('Ex: ⭐ 🎮 💎')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    modal.addComponents(
        new ActionRowBuilder().addComponents(labelInput),
        new ActionRowBuilder().addComponents(valueInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(emojiInput)
    );

    await interaction.showModal(modal);
}

/**
 * Menu para remover categoria
 */
async function handleRemoveCategoryMenu(interaction) {
    const currentConfig = config.loadConfig();

    if (currentConfig.categories.length === 0) {
        return await interaction.update({
            embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('❌ Não há categorias para remover.')],
            components: []
        });
    }

    const options = currentConfig.categories.map(cat => ({
        label: cat.label.replace(/[^\w\s]/g, '').trim().substring(0, 25) || 'Categoria',
        value: cat.value,
        description: cat.description.substring(0, 50),
        emoji: cat.emoji
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('config_select_remove_category')
        .setPlaceholder('🗑️ Selecione para remover')
        .addOptions(options);

    const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('➖ Remover Categoria')
        .setDescription('Selecione a categoria que deseja **remover**:\n\n⚠️ Esta ação não pode ser desfeita!');

    const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_categories')
            .setLabel('Cancelar')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(selectMenu), backRow]
    });
}

/**
 * Configuração de Emojis
 */
async function handleEmojisConfig(interaction) {
    const currentConfig = config.loadConfig();

    const emojiList = Object.entries(currentConfig.emojis)
        .map(([key, value]) => `> **${key}:** ${value}`)
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor(currentConfig.colors.info || '#5865F2')
        .setAuthor({ name: '😀 Configuração de Emojis', iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setDescription(
            '**Emojis utilizados no sistema:**\n\n' +
            emojiList +
            '\n\n─────────────────────────────'
        )
        .setFooter({ text: 'Clique em Editar para alterar os emojis' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_edit_emojis')
            .setLabel('Editar Emojis')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

/**
 * Modal para editar emojis
 */
async function handleEditEmojisModal(interaction) {
    const currentConfig = config.loadConfig();

    const modal = new ModalBuilder()
        .setCustomId('config_modal_emojis')
        .setTitle('😀 Editar Emojis');

    const ticketInput = new TextInputBuilder()
        .setCustomId('emoji_ticket')
        .setLabel('Emoji do Ticket')
        .setValue(currentConfig.emojis.ticket)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const closeInput = new TextInputBuilder()
        .setCustomId('emoji_close')
        .setLabel('Emoji de Fechar')
        .setValue(currentConfig.emojis.close)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const successInput = new TextInputBuilder()
        .setCustomId('emoji_success')
        .setLabel('Emoji de Sucesso')
        .setValue(currentConfig.emojis.success)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const errorInput = new TextInputBuilder()
        .setCustomId('emoji_error')
        .setLabel('Emoji de Erro')
        .setValue(currentConfig.emojis.error)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const warningInput = new TextInputBuilder()
        .setCustomId('emoji_warning')
        .setLabel('Emoji de Aviso')
        .setValue(currentConfig.emojis.warning)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    modal.addComponents(
        new ActionRowBuilder().addComponents(ticketInput),
        new ActionRowBuilder().addComponents(closeInput),
        new ActionRowBuilder().addComponents(successInput),
        new ActionRowBuilder().addComponents(errorInput),
        new ActionRowBuilder().addComponents(warningInput)
    );

    await interaction.showModal(modal);
}

/**
 * Preview do ticket
 */
async function handlePreviewTicket(interaction) {
    const currentConfig = config.loadConfig();
    const { createPanelEmbed } = require('../utils/embeds');

    const embed = new EmbedBuilder()
        .setColor(currentConfig.colors.success)
        .setTitle('👁️ Preview do Painel de Tickets')
        .setDescription('Assim ficará o painel de abertura de tickets:');

    const previewEmbed = createPanelEmbed();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed, previewEmbed],
        components: [row]
    });
}

/**
 * Resetar configurações
 */
async function handleResetConfig(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('⚠️ Confirmar Reset')
        .setDescription(
            '**Você tem certeza que deseja resetar TODAS as configurações?**\n\n' +
            '> 🗑️ Todas as cores, textos, imagens e categorias serão resetados\n' +
            '> ✅ Token e Guild ID **não** serão afetados\n\n' +
            '**Esta ação não pode ser desfeita!**'
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_confirm_reset')
            .setLabel('Confirmar Reset')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Cancelar')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

/**
 * Embed de sucesso com auto-retorno
 */
function createSuccessEmbed(message) {
    return new EmbedBuilder()
        .setColor('#57F287')
        .setDescription(`✅ ${message}`);
}

/**
 * Embed de erro
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#ED4245')
        .setDescription(`❌ ${message}`);
}

/**
 * Configuração do Bot (status, atividade)
 */
async function handleBotConfig(interaction) {
    const currentConfig = config.loadConfig();
    const botConfig = currentConfig.bot || {};

    const modal = new ModalBuilder()
        .setCustomId('config_modal_bot')
        .setTitle('🤖 Configurar Bot');

    const activityTextInput = new TextInputBuilder()
        .setCustomId('bot_activity_text')
        .setLabel('Texto da Atividade')
        .setPlaceholder('Ex: Sistema de Suporte')
        .setValue(botConfig.activityText || 'Sistema de Suporte')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const activityEmojiInput = new TextInputBuilder()
        .setCustomId('bot_activity_emoji')
        .setLabel('Emoji da Atividade')
        .setPlaceholder('🎫')
        .setValue(botConfig.activityEmoji || '🎫')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    const activityTypeInput = new TextInputBuilder()
        .setCustomId('bot_activity_type')
        .setLabel('Tipo (Playing/Watching/Listening/Competing)')
        .setPlaceholder('Watching')
        .setValue(botConfig.activityType || 'Watching')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20);

    const statusInput = new TextInputBuilder()
        .setCustomId('bot_status')
        .setLabel('Status (online/idle/dnd/invisible)')
        .setPlaceholder('online')
        .setValue(botConfig.status || 'online')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

    modal.addComponents(
        new ActionRowBuilder().addComponents(activityTextInput),
        new ActionRowBuilder().addComponents(activityEmojiInput),
        new ActionRowBuilder().addComponents(activityTypeInput),
        new ActionRowBuilder().addComponents(statusInput)
    );

    await interaction.showModal(modal);
}

/**
 * Configuração dos textos do painel de tickets
 */
async function handlePanelTextsConfig(interaction) {
    const currentConfig = config.loadConfig();
    const panelTexts = currentConfig.panelTexts || {};

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({
            name: '📄 Textos do Painel de Tickets',
            iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setDescription(
            'Configure os textos que aparecem no painel de tickets.\n\n' +
            '**Clique nos botões abaixo para editar cada seção:**'
        )
        .addFields(
            {
                name: '📝 Título',
                value: `\`${panelTexts.title || 'Padrão'}\``,
                inline: true
            },
            {
                name: '📋 Descrição',
                value: `\`${(panelTexts.description || 'Padrão').substring(0, 50)}...\``,
                inline: true
            },
            {
                name: '⏰ Horário',
                value: `\`${panelTexts.schedule || 'Padrão'}\``,
                inline: true
            }
        )
        .setFooter({ text: 'Configuração do Sistema de Tickets' });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_panel_main_texts')
            .setLabel('Título e Descrição')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_panel_instructions')
            .setLabel('Instruções')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('config_panel_schedule')
            .setLabel('Horário e Resposta')
            .setEmoji('⏰')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_back_main')
            .setLabel('Voltar')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row1, row2] });
}

/**
 * Modal para editar título e descrição do painel
 */
async function handlePanelMainTextsModal(interaction) {
    const currentConfig = config.loadConfig();
    const panelTexts = currentConfig.panelTexts || {};

    const modal = new ModalBuilder()
        .setCustomId('config_modal_panel_main')
        .setTitle('📝 Título e Descrição');

    const titleInput = new TextInputBuilder()
        .setCustomId('panel_title')
        .setLabel('Título do Painel')
        .setPlaceholder('Ex: 📬 Abrir um Ticket de Suporte')
        .setValue(panelTexts.title || '📬 Abrir um Ticket de Suporte')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const descInput = new TextInputBuilder()
        .setCustomId('panel_description')
        .setLabel('Descrição (use {serverName} para nome)')
        .setPlaceholder('Bem-vindo à Central de Suporte do {serverName}!')
        .setValue(panelTexts.description || 'Bem-vindo à **Central de Suporte** do {serverName}!')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

    const selectInfoInput = new TextInputBuilder()
        .setCustomId('panel_select_info')
        .setLabel('Texto de seleção')
        .setPlaceholder('Selecione uma categoria abaixo para abrir seu ticket.')
        .setValue(panelTexts.selectInfo || '**Selecione uma categoria abaixo** para abrir seu ticket.')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200);

    const warningInput = new TextInputBuilder()
        .setCustomId('panel_warning')
        .setLabel('Aviso')
        .setPlaceholder('Antes de abrir um ticket, verifique...')
        .setValue(panelTexts.warning || 'Antes de abrir um ticket, verifique se sua dúvida não foi respondida em nossos canais de informação.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(300);

    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(selectInfoInput),
        new ActionRowBuilder().addComponents(warningInput)
    );

    await interaction.showModal(modal);
}

/**
 * Modal para editar horário e resposta
 */
async function handlePanelScheduleModal(interaction) {
    const currentConfig = config.loadConfig();
    const panelTexts = currentConfig.panelTexts || {};

    const modal = new ModalBuilder()
        .setCustomId('config_modal_panel_schedule')
        .setTitle('⏰ Horário e Resposta');

    const scheduleTitleInput = new TextInputBuilder()
        .setCustomId('panel_schedule_title')
        .setLabel('Título do Horário')
        .setPlaceholder('Ex: ⏰ Horário de Atendimento')
        .setValue(panelTexts.scheduleTitle || '⏰ Horário de Atendimento')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const scheduleInput = new TextInputBuilder()
        .setCustomId('panel_schedule')
        .setLabel('Horário de Atendimento')
        .setPlaceholder('Ex: Segunda a Sexta: 09h às 18h')
        .setValue(panelTexts.schedule || 'Segunda a Sexta: 09h às 18h')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const responseTitleInput = new TextInputBuilder()
        .setCustomId('panel_response_title')
        .setLabel('Título do Tempo de Resposta')
        .setPlaceholder('Ex: ⚡ Tempo de Resposta')
        .setValue(panelTexts.responseTitle || '⚡ Tempo de Resposta')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const responseTimeInput = new TextInputBuilder()
        .setCustomId('panel_response_time')
        .setLabel('Tempo de Resposta')
        .setPlaceholder('Ex: Até 24 horas úteis')
        .setValue(panelTexts.responseTime || 'Até 24 horas úteis')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    modal.addComponents(
        new ActionRowBuilder().addComponents(scheduleTitleInput),
        new ActionRowBuilder().addComponents(scheduleInput),
        new ActionRowBuilder().addComponents(responseTitleInput),
        new ActionRowBuilder().addComponents(responseTimeInput)
    );

    await interaction.showModal(modal);
}

/**
 * Modal para editar instruções
 */
async function handlePanelInstructionsModal(interaction) {
    const currentConfig = config.loadConfig();
    const panelTexts = currentConfig.panelTexts || {};

    const modal = new ModalBuilder()
        .setCustomId('config_modal_panel_instructions')
        .setTitle('📋 Instruções');

    const instructionsTitleInput = new TextInputBuilder()
        .setCustomId('panel_instructions_title')
        .setLabel('Título das Instruções')
        .setPlaceholder('Ex: 📋 Instruções')
        .setValue(panelTexts.instructionsTitle || '📋 Instruções')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const instructionsInput = new TextInputBuilder()
        .setCustomId('panel_instructions')
        .setLabel('Instruções (uma por linha)')
        .setPlaceholder('1. Escolha a categoria\n2. Preencha o formulário\n3. Aguarde resposta')
        .setValue(panelTexts.instructions || '1. Escolha a categoria do seu problema\n2. Preencha o formulário com detalhes\n3. Aguarde nossa equipe responder')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(instructionsTitleInput),
        new ActionRowBuilder().addComponents(instructionsInput)
    );

    await interaction.showModal(modal);
}

/**
 * Exporta configurações do bot
 */
async function handleExportConfig(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const fs = require('fs');
        const path = require('path');
        const { AttachmentBuilder } = require('discord.js');
        const dataDir = path.join(__dirname, '..', 'data');

        // Coletar todos os dados
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            data: {}
        };

        // Lista de arquivos para exportar
        const filesToExport = ['settings.json', 'stats.json', 'feedback.json', 'panel.json'];

        for (const file of filesToExport) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    exportData.data[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) { }
            }
        }

        const exportJson = JSON.stringify(exportData, null, 2);
        const fileName = `ticket-bot-backup-${Date.now()}.json`;
        const attachment = new AttachmentBuilder(Buffer.from(exportJson), { name: fileName });

        await interaction.editReply({
            embeds: [createSuccessEmbed(
                `📤 **Backup exportado!**\n\n` +
                `Guarde este arquivo para importar em outro servidor.`
            )],
            files: [attachment]
        });

    } catch (error) {
        console.error('[EXPORT ERROR]', error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Erro ao exportar configurações.')]
        }).catch(() => { });
    }
}

/**
 * Mostra modal para importar configurações
 */
async function handleImportConfig(interaction) {
    try {
        const embed = new EmbedBuilder()
            .setColor(config.colors?.primary || '#5865F2')
            .setTitle('📥 Importar Configurações')
            .setDescription(
                '**Para importar um backup:**\n\n' +
                '1️⃣ Use o comando `/import`\n' +
                '2️⃣ Anexe o arquivo JSON exportado\n' +
                '3️⃣ As configurações serão restauradas\n\n' +
                '⚠️ **Importante:**\n' +
                '• Canais e cargos serão resetados\n' +
                '• Use `/config` para reconfigurar\n' +
                '• O painel atualiza automaticamente'
            );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('[IMPORT MODAL ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Erro ao abrir modal de importação.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

module.exports = {
    sendConfigPanel,
    handleChannelsConfig,
    handleRolesConfig,
    handleTextsConfig,
    handleColorsConfig,
    handleImagesConfig,
    handleCategoriesConfig,
    handleAddCategoryModal,
    handleRemoveCategoryMenu,
    handleEmojisConfig,
    handleEditEmojisModal,
    handlePreviewTicket,
    handleResetConfig,
    handleBotConfig,
    handlePanelTextsConfig,
    handlePanelMainTextsModal,
    handlePanelScheduleModal,
    handlePanelInstructionsModal,
    handleExportConfig,
    handleImportConfig,
    createSuccessEmbed,
    createErrorEmbed
};
