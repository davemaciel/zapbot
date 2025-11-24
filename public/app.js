let activeChats = [];
let selectedChatId = null;

const chatListEl = document.getElementById('chat-list');
const emptyStateEl = document.getElementById('empty-state');
const activeChatContainerEl = document.getElementById('active-chat-container');
const headerNameEl = document.getElementById('header-name');
const headerAvatarEl = document.getElementById('header-avatar');
const messagesAreaEl = document.getElementById('messages-area');
const summaryContentEl = document.getElementById('summary-content');

// Formatar hora
function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Renderizar lista de chats na sidebar
function renderChatList() {
    // Salvar scroll position se necessário, mas para lista simples ok recriar ou diff
    // Para simplificar e evitar bugs na lista, vamos recriar (lista não pulsa tanto quanto mensagens)
    chatListEl.innerHTML = '';

    if (activeChats.length === 0) {
        chatListEl.innerHTML = '<div class="loading-state" style="padding:20px; text-align:center; color:#666;">Nenhuma conversa ativa</div>';
        return;
    }

    activeChats.forEach(chat => {
        const div = document.createElement('div');
        div.className = `chat-item ${chat.id === selectedChatId ? 'active' : ''}`;
        div.onclick = () => selectChat(chat.id);

        const lastMsg = chat.messages[chat.messages.length - 1];
        const previewText = lastMsg ? (lastMsg.type === 'Texto' ? lastMsg.text : `[${lastMsg.type}]`) : 'Sem mensagens';

        div.innerHTML = `
            <div class="avatar-placeholder">${chat.name.charAt(0).toUpperCase()}</div>
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-preview">${previewText}</div>
            </div>
        `;
        chatListEl.appendChild(div);
    });
}

// Selecionar um chat
function selectChat(chatId) {
    if (selectedChatId !== chatId) {
        selectedChatId = chatId;
        messagesAreaEl.innerHTML = ''; // Limpa mensagens anteriores ao trocar de chat
        emptyStateEl.classList.add('hidden');
        activeChatContainerEl.classList.remove('hidden');
        renderChatList(); // Atualizar active state na lista
        renderActiveChat();
    }
}

// Renderizar o chat selecionado (Mensagens e Resumo)
function renderActiveChat() {
    const chat = activeChats.find(c => c.id === selectedChatId);
    if (!chat) return;

    // Header
    headerNameEl.textContent = chat.name;
    headerAvatarEl.textContent = chat.name.charAt(0).toUpperCase();

    // Mensagens
    // Otimização: Adicionar apenas mensagens novas para evitar "pulsar" (re-renderizar tudo)
    chat.messages.forEach(msg => {
        // Verifica se a mensagem já existe no DOM
        const msgId = `msg-${msg.id}`;
        if (document.getElementById(msgId)) return;

        const bubble = document.createElement('div');
        bubble.id = msgId; // ID único para evitar duplicatas
        bubble.className = `message-bubble ${msg.sender === chat.name ? 'incoming' : 'outgoing'}`;

        let content = msg.text;
        if (msg.type !== 'Texto') {
            content = `<span class="media-label">${msg.type === 'Áudio' ? '🎤 Áudio Transcrito' : '🖼️ Imagem Analisada'}</span>${msg.text}`;
        }

        bubble.innerHTML = `
            ${content}
            <div class="message-meta">${formatTime(msg.timestamp)}</div>
        `;
        messagesAreaEl.appendChild(bubble);

        // Scroll para o final apenas quando chegar mensagem nova
        messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight;
    });

    // Resumo
    if (chat.summary) {
        // Apenas atualiza se o texto mudou para evitar flicker se houver seleção de texto
        if (summaryContentEl.textContent !== chat.summary) {
            summaryContentEl.textContent = chat.summary;
        }
    } else {
        if (!summaryContentEl.querySelector('.placeholder-text')) {
            summaryContentEl.innerHTML = '<p class="placeholder-text">Aguardando análise da IA...</p>';
        }
    }
}

// Buscar dados da API
async function fetchChats() {
    try {
        const response = await fetch('/api/chats');
        const data = await response.json();

        // Atualiza activeChats
        activeChats = data;

        renderChatList();
        if (selectedChatId) {
            renderActiveChat();
        }
    } catch (error) {
        console.error('Erro ao buscar chats:', error);
    }
}

// Polling a cada 2s
setInterval(fetchChats, 2000);
fetchChats();
