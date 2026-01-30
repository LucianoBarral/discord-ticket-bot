/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║       SISTEMA DE SUPORTE/TICKET PROFISSIONAL                  ║
 * ║                   Discord.js v14+                             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 * 
 * Desenvolvido para gerenciamento de tickets de suporte
 * com interface visual elegante e sistema de transcrições.
 * 
 * Configuração via .env (token e guild) + Discord (/config)
 */

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
const config = require('./config');

// Eventos
const readyEvent = require('./events/ready');
const interactionEvent = require('./events/interactionCreate');

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO DO CLIENT
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE EVENTOS
// ═══════════════════════════════════════════════════════════════
client.once(readyEvent.name, (...args) => readyEvent.execute(...args, client));
client.on(interactionEvent.name, (...args) => interactionEvent.execute(...args));

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE SLASH COMMANDS
// ═══════════════════════════════════════════════════════════════
const { importCommand } = require('./commands/backup');

const commands = [
    new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('📬 Envia o painel de suporte para abrir tickets')
        .setDefaultMemberPermissions(0x8) // Administrator
        .toJSON(),
    new SlashCommandBuilder()
        .setName('config')
        .setDescription('⚙️ Abre o painel de configuração do sistema de tickets')
        .setDefaultMemberPermissions(0x8) // Administrator
        .toJSON(),
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Exibe estatísticas do sistema de tickets')
        .setDefaultMemberPermissions(0x20) // ManageGuild
        .toJSON(),
    importCommand
];

async function registerCommands() {
    try {
        console.log('🔄 Registrando comandos slash...');

        const rest = new REST({ version: '10' }).setToken(config.token);

        await rest.put(
            Routes.applicationGuildCommands(client.user.id, config.guildId),
            { body: commands }
        );

        console.log('✅ Comandos registrados com sucesso!');
        console.log('   📬 /setup-ticket - Envia o painel de tickets');
        console.log('   ⚙️  /config - Configura o sistema via Discord');
        console.log('   📊 /stats - Estatísticas do sistema');
        console.log('   📥 /import - Importar backup');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// TRATAMENTO DE ERROS GLOBAL
// ═══════════════════════════════════════════════════════════════
process.on('unhandledRejection', (error) => {
    console.error('❌ [UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [UNCAUGHT EXCEPTION]', error);
});

client.on('error', (error) => {
    console.error('❌ [CLIENT ERROR]', error);
});

// ═══════════════════════════════════════════════════════════════
// INICIAR BOT
// ═══════════════════════════════════════════════════════════════
client.once('clientReady', async () => {
    await registerCommands();
});

// Verificar token
if (!config.token || config.token === 'SEU_TOKEN_AQUI') {
    console.error('╔═══════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ ERRO: Token do bot não configurado!                       ║');
    console.error('║                                                               ║');
    console.error('║  Por favor, edite o arquivo .env e adicione seu token.        ║');
    console.error('║  Exemplo:                                                     ║');
    console.error('║    DISCORD_TOKEN=seu_token_aqui                               ║');
    console.error('║    GUILD_ID=id_do_servidor                                    ║');
    console.error('║                                                               ║');
    console.error('║  Obtenha o token em: https://discord.com/developers           ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝');
    process.exit(1);
}

if (!config.guildId || config.guildId === 'ID_DO_SERVIDOR') {
    console.error('╔═══════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ ERRO: Guild ID não configurado!                           ║');
    console.error('║                                                               ║');
    console.error('║  Por favor, edite o arquivo .env e adicione o Guild ID.       ║');
    console.error('║  Exemplo:                                                     ║');
    console.error('║    GUILD_ID=123456789012345678                                ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝');
    process.exit(1);
}

client.login(config.token);
