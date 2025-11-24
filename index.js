const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');

// Configuração da API (OpenRouter)
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

async function summarizeText(text) {
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: 'x-ai/grok-4.1-fast:free',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente pessoal inteligente. Seu objetivo é ler a mensagem recebida e fornecer um resumo conciso, direto e útil em português. Se a mensagem for curta, apenas explique o contexto. Destaque pontos importantes.'
                },
                { role: 'user', content: `Resuma esta mensagem do WhatsApp: "${text}"` }
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
            return response.data.choices[0].message.content;
        } else {
            return 'Não foi possível gerar o resumo (resposta vazia).';
        }
    } catch (error) {
        console.error('Erro ao chamar Grok:', error.response ? error.response.data : error.message);
        return 'Erro ao gerar resumo com Grok.';
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
                    }

                    // 3. Se tivermos texto (original ou transcrito), resumir
                    if (textToSummarize) {
                        console.log('\n===================================================');
                        console.log(`📩 Nova mensagem (${messageType}) de: ${sender}`);
                        if (messageType === 'Texto') console.log(`📝 Conteúdo: ${textToSummarize}`);
                        console.log('🤖 Gerando resumo com Grok 4.1...');

                        const summary = await summarizeText(textToSummarize);

                        console.log('\n✨ RESUMO IA:');
                        console.log(summary);
                        console.log('===================================================\n');
                    }
                }
            }
        }
    });
}

connectToWhatsApp();
