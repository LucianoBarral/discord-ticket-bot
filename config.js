/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          CONFIGURAÇÕES DO SISTEMA DE TICKETS                  ║
 * ║     Token e Guild ID são lidos do arquivo .env                ║
 * ║     Demais configurações são gerenciadas via Discord          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Arquivo de configuração dinâmica
const CONFIG_FILE = path.join(__dirname, 'data', 'settings.json');

// Configuração padrão
const defaultConfig = {
    // ═══════════════════════════════════════════════════════════
    // CONFIGURAÇÕES DE TICKETS
    // ═══════════════════════════════════════════════════════════
    tickets: {
        limit: 3,  // Máximo de tickets abertos por usuário
        feedbackEnabled: true,  // Solicitar feedback ao fechar
    },

    // ═══════════════════════════════════════════════════════════
    // CANAIS (configurados via /config)
    // ═══════════════════════════════════════════════════════════
    channels: {
        logs: null,
        ticketCategory: null,  // Categoria para tickets pendentes
        claimedTicketCategory: null,  // Categoria para tickets em atendimento
    },

    // ═══════════════════════════════════════════════════════════
    // CARGOS (configurados via /config)
    // ═══════════════════════════════════════════════════════════
    roles: {
        staff: null,
    },

    // ═══════════════════════════════════════════════════════════
    // CORES (Hexadecimal)
    // ═══════════════════════════════════════════════════════════
    colors: {
        primary: "#5865F2",
        success: "#57F287",
        warning: "#FEE75C",
        danger: "#ED4245",
        info: "#5865F2",
        embed: "#2B2D31",
    },

    // ═══════════════════════════════════════════════════════════
    // IMAGENS
    // ═══════════════════════════════════════════════════════════
    images: {
        banner: "https://i.imgur.com/AfFp7pu.png",
        thumbnail: "https://i.imgur.com/AfFp7pu.png",
        footer: "https://i.imgur.com/AfFp7pu.png",
    },

    // ═══════════════════════════════════════════════════════════
    // TEXTOS
    // ═══════════════════════════════════════════════════════════
    texts: {
        serverName: "Seu Servidor",
        footerText: "Sistema de Suporte",
    },

    // ═══════════════════════════════════════════════════════════
    // TEXTOS DO PAINEL DE TICKETS
    // ═══════════════════════════════════════════════════════════
    panelTexts: {
        title: "📬 Abrir um Ticket de Suporte",
        description: "Bem-vindo à **Central de Suporte** do {serverName}!",
        selectInfo: "**Selecione uma categoria abaixo** para abrir seu ticket.",
        warning: "Antes de abrir um ticket, verifique se sua dúvida não foi respondida em nossos canais de informação.",
        instructionsTitle: "📋 Instruções",
        instructions: "1. Escolha a categoria do seu problema\n2. Preencha o formulário com detalhes\n3. Aguarde nossa equipe responder",
        scheduleTitle: "⏰ Horário de Atendimento",
        schedule: "Segunda a Sexta: 09h às 18h",
        responseTitle: "⚡ Tempo de Resposta",
        responseTime: "Até 24 horas úteis",
    },

    // ═══════════════════════════════════════════════════════════
    // PERFIL DO BOT
    // ═══════════════════════════════════════════════════════════
    bot: {
        activityType: "Watching",  // Playing, Streaming, Listening, Watching, Competing
        activityText: "Sistema de Suporte",
        activityEmoji: "🎫",
        status: "online",  // online, idle, dnd, invisible
    },

    // ═══════════════════════════════════════════════════════════
    // CATEGORIAS DE SUPORTE
    // ═══════════════════════════════════════════════════════════
    categories: [
        {
            label: "Financeiro",
            value: "financeiro",
            description: "Dúvidas sobre pagamentos, reembolsos e cobranças",
            emoji: "💰",
            fields: [
                { id: "valor", label: "Valor envolvido", placeholder: "Ex: R$ 50,00", required: false, type: "short" },
                { id: "transacao", label: "ID da Transação (se houver)", placeholder: "Ex: TXN123456", required: false, type: "short" }
            ]
        },
        {
            label: "Dúvidas Gerais",
            value: "duvidas",
            description: "Perguntas gerais sobre o servidor ou serviços",
            emoji: "❓",
            fields: []
        },
        {
            label: "Denúncias",
            value: "denuncias",
            description: "Reportar infrações ou comportamentos inadequados",
            emoji: "⚠️",
            fields: [
                { id: "usuario", label: "Usuário denunciado", placeholder: "Ex: @usuario ou ID", required: true, type: "short" },
                { id: "provas", label: "Tem provas? (prints, links)", placeholder: "Cole links de imagens ou descreva", required: false, type: "paragraph" }
            ]
        },
        {
            label: "Suporte Técnico",
            value: "tecnico",
            description: "Problemas técnicos e bugs",
            emoji: "🛠️",
            fields: [
                { id: "erro", label: "Mensagem de erro (se houver)", placeholder: "Cole a mensagem de erro aqui", required: false, type: "short" }
            ]
        },
        {
            label: "Parcerias",
            value: "parcerias",
            description: "Propostas de parcerias e colaborações",
            emoji: "💼",
            fields: [
                { id: "servidor", label: "Nome do seu servidor/projeto", placeholder: "Ex: Meu Servidor", required: true, type: "short" },
                { id: "membros", label: "Quantidade de membros", placeholder: "Ex: 500", required: false, type: "short" }
            ]
        }
    ],

    // ═══════════════════════════════════════════════════════════
    // EMOJIS PERSONALIZADOS
    // ═══════════════════════════════════════════════════════════
    emojis: {
        ticket: "🎫",
        close: "🔒",
        staff: "🛠️",
        transcript: "📑",
        success: "✅",
        error: "❌",
        warning: "⚠️",
        user: "👤",
        clock: "🕐",
        category: "📁",
        config: "⚙️",
        save: "💾",
        channel: "📢",
        role: "👥",
        color: "🎨",
        image: "🖼️",
        text: "📝",
    }
};

// Carregar configuração do arquivo
function loadConfig() {
    try {
        // Criar diretório se não existir
        const dataDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return { ...defaultConfig, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('[CONFIG] Erro ao carregar configuração:', error);
    }
    return { ...defaultConfig };
}

// Salvar configuração no arquivo
function saveConfig(config) {
    try {
        const dataDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('[CONFIG] Erro ao salvar configuração:', error);
        return false;
    }
}

// Atualizar configuração
function updateConfig(key, value) {
    const config = loadConfig();
    const keys = key.split('.');
    let obj = config;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    return saveConfig(config);
}

// Obter valor da configuração
function getConfig(key = null) {
    const config = loadConfig();

    if (!key) return config;

    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
        if (value === undefined) return undefined;
        value = value[k];
    }

    return value;
}

// Exportar configuração com token e guild do .env
module.exports = {
    // Do .env
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,

    // Funções de configuração dinâmica
    loadConfig,
    saveConfig,
    updateConfig,
    getConfig,

    // Getters para compatibilidade
    get channels() { return getConfig('channels'); },
    get roles() { return getConfig('roles'); },
    get colors() { return getConfig('colors'); },
    get images() { return getConfig('images'); },
    get texts() { return getConfig('texts'); },
    get panelTexts() { return getConfig('panelTexts'); },
    get categories() { return getConfig('categories'); },
    get emojis() { return getConfig('emojis'); },
    get bot() { return getConfig('bot'); },
    get tickets() { return getConfig('tickets'); },
};
