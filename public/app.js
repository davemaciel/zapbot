const container = document.getElementById('summaries-container');
let lastSummaryId = 0;

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
}

function createCard(summary) {
    const card = document.createElement('div');
    card.className = 'card';

    // Ícone baseado no tipo
    let icon = '💬';
    if (summary.type === 'Áudio') icon = '🎤';
    if (summary.type === 'Imagem') icon = '🖼️';

    card.innerHTML = `
        <div class="card-header">
            <div class="sender">${icon} ${summary.sender}</div>
            <div class="meta">
                <span class="type-badge">${summary.type}</span>
                <span class="time">${formatDate(summary.timestamp)}</span>
            </div>
        </div>
        <div class="card-content">
            <h3>Resumo IA</h3>
            <div class="summary-text">${summary.summary}</div>
            
            <details>
                <summary style="cursor: pointer; color: var(--text-secondary); font-size: 0.85rem;">Ver Original</summary>
                <div class="original-text" style="margin-top: 10px;">
                    ${summary.originalText}
                </div>
            </details>
        </div>
    `;
    return card;
}

async function fetchSummaries() {
    try {
        const response = await fetch('/api/summaries');
        const summaries = await response.json();

        if (summaries.length === 0) {
            if (container.innerHTML.includes('loading')) return;
            // Se não tiver nada e não tiver loading, deixa como está ou mostra msg
            return;
        }

        // Se tivermos novos resumos (comparando IDs ou apenas renderizando tudo por simplicidade neste protótipo)
        // Para simplificar e garantir ordem correta sem duplicatas complexas, vamos limpar e renderizar
        // Mas para evitar "piscar", podemos verificar se mudou algo.

        // Estratégia simples: Renderizar tudo. O React faria melhor, mas aqui é Vanilla.
        // Melhoria: Verificar se o ID do mais recente mudou.

        if (summaries.length > 0) {
            const newestId = summaries[0].id;
            if (newestId !== lastSummaryId) {
                lastSummaryId = newestId;
                container.innerHTML = ''; // Limpa tudo
                summaries.forEach(summary => {
                    container.appendChild(createCard(summary));
                });
            }
        }
    } catch (error) {
        console.error('Erro ao buscar resumos:', error);
    }
}

// Buscar a cada 2 segundos
setInterval(fetchSummaries, 2000);

// Busca inicial
fetchSummaries();
