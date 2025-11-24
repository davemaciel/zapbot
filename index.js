const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');
const express = require('express');
require('dotenv').config(); // Carregar variáveis de ambiente

const app = express();
const PORT = process.env.PORT || 3000;

// Armazenamento em memória para os chats ativos
// Estrutura: { remoteJid: { name, avatar, messages: [], summary: "", lastUpdate: Date } }
const activeChats = {};

// Variável global para o socket do WhatsApp
let globalSock;

// Middleware para parsear JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static('public'));

// API para obter chats e resumos
app.get('/api/chats', (req, res) => {
    // Converter objeto para array para o frontend
    const chatsArray = Object.entries(activeChats).map(([id, chat]) => ({
        id,
        ...chat
    })).sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

    res.json(chatsArray);
});

// API para enviar mensagens
app.post('/api/messages/send', async (req, res) => {
    const { chatId, text } = req.body;

    if (!globalSock) {
        return res.status(503).json({ error: 'WhatsApp não conectado' });
    }

    if (!chatId || !text) {
        return res.status(400).json({ error: 'ChatId e texto são obrigatórios' });
    }

    try {
        await globalSock.sendMessage(chatId, { text: text });

        // Adicionar mensagem enviada ao histórico local imediatamente para refletir no frontend
        if (activeChats[chatId]) {
            activeChats[chatId].messages.push({
                id: Date.now(), // ID temporário
                timestamp: new Date().toISOString(),
                sender: 'Você', // Ou nome do bot
                type: 'Texto',
                text: text
            });
            activeChats[chatId].lastUpdate = new Date().toISOString();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Falha ao enviar mensagem' });
    }
});

app.listen(port, () => {
    console.log(`🌐 Servidor web rodando em http://localhost:${port}`);
});

// Configuração da API (OpenRouter)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
    console.error('❌ ERRO: Chave da API não encontrada. Verifique o arquivo .env');
    process.exit(1);
}


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function transcribeAudio(mediaBuffer, mimeType) {
    // Estratégia: Tentar o modelo principal com backoff exponencial
    const attempts = [
        { model: 'google/gemini-2.0-flash-exp:free', delay: 0 },
        { model: 'google/gemini-2.0-flash-exp:free', delay: 3000 },
        { model: 'google/gemini-2.0-flash-exp:free', delay: 6000 },
        { model: 'google/gemini-2.0-flash-thinking-exp:free', delay: 5000 }
    ];

    const base64Audio = mediaBuffer.toString('base64');

    for (const attempt of attempts) {
        if (attempt.delay > 0) {
            console.log(`⏳ Aguardando ${attempt.delay}ms para tentar novamente...`);
            await sleep(attempt.delay);
        }

        try {
            console.log(`🎙️ Tentando transcrever com modelo: ${attempt.model}...`);
            const response = await axios.post(OPENROUTER_URL, {
                model: attempt.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Transcreva este áudio fielmente para português. Apenas o texto, sem comentários adicionais.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Audio}`
                                }
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'WhatsApp AI Summary'
                }
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
        } catch (error) {
            const status = error.response ? error.response.status : 'unknown';
            console.warn(`⚠️ Falha com ${attempt.model} (Status: ${status}).`);
        }
    }

    console.error('❌ Todas as tentativas de transcrição falharam.');
    return null;
}

async function analyzeImage(mediaBuffer, mimeType) {
    const base64Image = mediaBuffer.toString('base64');

    // Estratégia: Tentar o modelo principal com backoff exponencial
    // Adicionando fallback para o modelo 'thinking' que às vezes tem cotas diferentes
    const attempts = [
        { model: 'google/gemini-2.0-flash-exp:free', delay: 0 },
        { model: 'google/gemini-2.0-flash-exp:free', delay: 3000 },
        { model: 'google/gemini-2.0-flash-exp:free', delay: 6000 },
        { model: 'google/gemini-2.0-flash-thinking-exp:free', delay: 5000 }
    ];

    for (const attempt of attempts) {
        if (attempt.delay > 0) {
            console.log(`⏳ Aguardando ${attempt.delay}ms para tentar analisar imagem novamente...`);
            await sleep(attempt.delay);
        }

        try {
            console.log(`🖼️ Tentando analisar imagem com modelo: ${attempt.model}...`);
            const response = await axios.post(OPENROUTER_URL, {
                model: attempt.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Descreva esta imagem detalhadamente e resuma seu conteúdo em português. Se houver texto na imagem, transcreva-o também.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'WhatsApp AI Summary'
                }
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
        } catch (error) {
            const status = error.response ? error.response.status : 'unknown';
            console.warn(`⚠️ Falha na análise de imagem com ${attempt.model} (Status: ${status}).`);
            // Se for erro 429, o loop continuará e tentará novamente após o delay
        }
    }

    console.error('❌ Todas as tentativas de análise de imagem falharam.');
    return null;
}

async function updateChatSummary(chatId) {
    const chat = activeChats[chatId];
    if (!chat || chat.messages.length === 0) return;

    // Pegar as últimas 20 mensagens para contexto
    const recentMessages = chat.messages.slice(-20);
    const messagesText = recentMessages.map(m => `[${m.sender} - ${m.type}]: ${m.text}`).join('\n');
    const currentSummary = chat.summary || "Nenhum resumo anterior.";

    try {
        console.log(`🤖 Atualizando resumo para o chat: ${chat.name}...`);
        const response = await axios.post(OPENROUTER_URL, {
            model: 'x-ai/grok-4.1-fast:free',
            messages: [
                {
                    role: 'system',
                    content: `Você é um assistente de atendimento de elite. Seu objetivo é gerar um "Resumo Executivo" da conversa para que o atendente entenda TUDO sem precisar ler as mensagens.

                    DIRETRIZES DO RESUMO:
                    1. **NÃO** narre a conversa cronologicamente ("Ele disse oi, depois disse isso").
                    2. **ESTRUTURE** a resposta em seções claras usando Markdown:
                       - 🎯 **Objetivo Principal**: O que o cliente quer? (Em 1 frase).
                       - 📝 **Pontos Chave**: Lista com bullet points dos detalhes importantes (produtos, valores, datas, problemas).
                       - 🚦 **Status/Ação Necessária**: O que precisa ser feito agora? (Ex: "Responder sobre estoque", "Aguardando cliente").
                       - 🧠 **Contexto/Humor**: O cliente está irritado? Com pressa? (Se relevante).

                    3. **ATUALIZE** o resumo anterior incorporando as novas informações. Se o assunto mudou, crie um novo tópico.
                    4. Seja direto e profissional. Use Português do Brasil.`
                },
                {
                    role: 'user',
                    content: `Resumo Anterior:\n"${currentSummary}"\n\nNovas Mensagens (Contexto Recente):\n${messagesText}\n\nGere o novo Resumo Executivo Estruturado:`
                }
            ],
            reasoning: { enabled: true }
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'WhatsApp AI Summary'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            chat.summary = response.data.choices[0].message.content;
            console.log(`✨ Resumo atualizado para ${chat.name}`);
        }
    } catch (error) {
        console.error('Erro ao atualizar resumo:', error.response ? error.response.data : error.message);
    }
}

async function connectToWhatsApp() {
    console.log('Iniciando conexão com WhatsApp...');
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Gamingflix AI', 'Chrome', '1.0.0']
    });

    globalSock = sock;

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Escaneie o QR Code abaixo para conectar:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Reconectando em 3s...', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ Conexão aberta com sucesso!');
            console.log('Aguardando novas mensagens...');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.key.fromMe) {
                    const sender = msg.pushName || msg.key.remoteJid.split('@')[0];
                    let textToSummarize = '';
                    let messageType = 'Texto';

                    // 1. Tentar extrair texto direto
                    const text = msg.message?.conversation ||
                        msg.message?.extendedTextMessage?.text ||
                        msg.message?.imageMessage?.caption ||
                        msg.message?.videoMessage?.caption;

                    if (text) {
                        textToSummarize = text;
                    }

                    // 2. Se for áudio, transcrever
                    const audioMessage = msg.message?.audioMessage;
                    const imageMessage = msg.message?.imageMessage;

                    if (audioMessage) {
                        messageType = 'Áudio';
                        console.log(`\n🎤 Áudio recebido de ${sender}. Baixando e transcrevendo...`);

                        try {
                            const buffer = await downloadMediaMessage(
                                msg,
                                'buffer',
                                {},
                                {
                                    logger: pino({ level: 'silent' }),
                                    reuploadRequest: sock.updateMediaMessage
                                }
                            );

                            const transcript = await transcribeAudio(buffer, audioMessage.mimetype);
                            if (transcript) {
                                console.log(`📝 Transcrição: ${transcript}`);
                                textToSummarize = `[Transcrição de Áudio]: ${transcript}`;
                            } else {
                                console.log('❌ Falha na transcrição.');
                            }
                        } catch (err) {
                            console.error('Erro ao processar áudio:', err);
                        }
                    } else if (imageMessage) {
                        messageType = 'Imagem';
                        console.log(`\n🖼️ Imagem recebida de ${sender}. Baixando e analisando...`);

                        try {
                            const buffer = await downloadMediaMessage(
                                msg,
                                'buffer',
                                {},
                                {
                                    logger: pino({ level: 'silent' }),
                                    reuploadRequest: sock.updateMediaMessage
                                }
                            );

                            const description = await analyzeImage(buffer, imageMessage.mimetype);
                            if (description) {
                                console.log(`📝 Descrição da Imagem: ${description}`);
                                textToSummarize = `[Descrição da Imagem]: ${description}`;
                                // Se houver legenda na imagem, adicionar também
                                if (imageMessage.caption) {
                                    textToSummarize += `\n[Legenda Original]: ${imageMessage.caption}`;
                                }
                            } else {
                                console.log('❌ Falha na análise da imagem.');
                            }
                        } catch (err) {
                            console.error('Erro ao processar imagem:', err);
                        }
                    }

                    // 3. Processar mensagem e atualizar chat
                    if (textToSummarize) {
                        const chatId = msg.key.remoteJid;

                        // Inicializar chat se não existir
                        if (!activeChats[chatId]) {
                            activeChats[chatId] = {
                                name: sender, // Nome inicial, pode melhorar depois
                                messages: [],
                                summary: '',
                                lastUpdate: new Date().toISOString()
                            };
                        }

                        // Adicionar mensagem ao histórico
                        activeChats[chatId].messages.push({
                            id: msg.key.id,
                            timestamp: new Date().toISOString(),
                            sender: sender,
                            type: messageType,
                            text: textToSummarize
                        });

                        activeChats[chatId].lastUpdate = new Date().toISOString();
                        activeChats[chatId].name = sender; // Atualiza nome caso mude

                        console.log('\n===================================================');
                        console.log(`📩 Nova mensagem (${messageType}) de: ${sender}`);
                        if (messageType === 'Texto') console.log(`📝 Conteúdo: ${textToSummarize}`);

                        // Atualizar resumo (Debounce simples poderia ser aplicado aqui, mas faremos direto por enquanto)
                        await updateChatSummary(chatId);
                        console.log('===================================================\n');
                    }
                }
            }
        }
    });
}

connectToWhatsApp();

// Iniciar servidor HTTP
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📡 Aguardando conexão com WhatsApp...\n`);
});
