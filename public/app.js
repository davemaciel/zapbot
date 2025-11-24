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
    if (activeChats.length === 0) {
        if (!chatListEl.querySelector('.loading-state')) {
            chatListEl.innerHTML = '<div class="loading-state" style="padding:20px; text-align:center; color:#666;">Nenhuma conversa ativa</div>';
        }
        return;
    }

    // Remover estado de loading se existir
    const loadingState = chatListEl.querySelector('.loading-state');
    if (loadingState) loadingState.remove();

    // Sincronizar lista
    activeChats.forEach(chat => {
        let chatItem = document.getElementById(`chat-item-${chat.id}`);

        // Se não existe, cria
        if (!chatItem) {
            chatItem = document.createElement('div');
            chatItem.id = `chat-item-${chat.id}`;
            chatItem.className = 'chat-item';
            chatItem.onclick = () => selectChat(chat.id);
            chatListEl.appendChild(chatItem);
        }

        // Atualiza classe active
        if (chat.id === selectedChatId) {
            chatItem.classList.add('active');
        } else {
            chatItem.classList.remove('active');
        }

        const lastMsg = chat.messages[chat.messages.length - 1];
        const previewText = lastMsg ? (lastMsg.type === 'Texto' ? lastMsg.text : `[${lastMsg.type}]`) : 'Sem mensagens';
        const avatarLetter = chat.name.charAt(0).toUpperCase();

        // Atualiza conteúdo apenas se mudou (para evitar flicker)
        const newHTML = `
            <div class="avatar-placeholder">${avatarLetter}</div>
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-preview">${previewText}</div>
            </div>
        `;

        if (chatItem.innerHTML !== newHTML) {
            chatItem.innerHTML = newHTML;
        }
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

// Envio de Mensagens
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !selectedChatId) return;

    // Limpar input imediatamente
    messageInput.value = '';

    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId: selectedChatId,
                text: text
            })
        });

        if (response.ok) {
            // Atualizar chat imediatamente (o backend já adicionou ao array, então o próximo fetch pegaria, 
            // mas podemos forçar um fetch agora para garantir a responsividade visual)
            fetchChats();
        } else {
            console.error('Erro ao enviar mensagem');
            alert('Erro ao enviar mensagem. Verifique a conexão.');
        }
    } catch (error) {
        console.error('Erro na requisição de envio:', error);
    }
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
