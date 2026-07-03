// Aguarda o HTML carregar antes de rodar
document.addEventListener('DOMContentLoaded', () => {
    
    // --- ETAPA 1: CONFIGURAÇÃO ---
    // A SUA URL DA PLANILHA JÁ ESTÁ COLADA AQUI!
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-w0r2V7VBPQr3L-6IahMta9GdAXiapgaJNpBoMIsPfz9xoRVSRP0CjdDyOxAQioSWck2NNnV5HcQP/pub?output=csv';

    const container = document.getElementById('reviews-list-container');
    const loadingMessage = document.getElementById('loading-message');

    // --- ETAPA 2: BUSCAR OS DADOS (FETCH) ---
    fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados');
            }
            return response.text();
        })
        .then(csvText => {
            // Esconde a mensagem "Carregando..."
            loadingMessage.style.display = 'none';
            
            // Converte o texto CSV em um array
            const data = parseCSV(csvText);

            // 'data' é um array de arrays. ex:
            // [
            //   ["Carimbo de data/hora", "ID do Espaço", "Nota Geral", ...], // Linha 0 (Header)
            //   ["26/10/2025", "sala_a", "5", ...], // Linha 1 (Review)
            // ]

            // Pula a linha 0 (o cabeçalho) e processa o resto
            // Itera de trás para frente para mostrar os mais novos primeiro
            for (let i = data.length - 1; i >= 1; i--) {
                const review = data[i];
                
                // Mapeia as colunas com base no seu formulário
                // Coluna 0 = Carimbo de data/hora
                // Coluna 1 = ID do Espaço (entry.771112235)
                // Coluna 2 = Nota Geral (entry.1948864566)
                // Coluna 3 = Propósito (entry.1958159279)
                // Coluna 4 = Houve Problema? (entry.1106367887)
                // Coluna 5 = Detalhes do Problema (entry.1189940137)
                // Coluna 6 = Sugestões de Melhoria (entry.1480821103)
                // Coluna 7 = Anônimo? (entry.673090461)

                // Vamos pegar os dados que queremos mostrar
                const timestamp = review[0];
                const spaceID = review[1];
                const rating = review[2];
                const feedback = review[6]; // Coluna "Sugestões de Melhoria"
                const isAnonymous = review[7];

                // Cria o HTML para este card de avaliação
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card'; // Vamos estilizar isso
                
                // Constrói o HTML interno do card
                reviewCard.innerHTML = `
                    <div class="review-card-header">
                        <span class="review-space-name">${getSpaceName(spaceID)}</span>
                        <div class="review-rating">
                            <span>${rating}</span>
                            <span class="material-symbols-outlined">star</span>
                        </div>
                    </div>
                    <p class="review-feedback">${feedback || "<i>(Nenhum comentário de melhoria foi deixado)</i>"}</p>
                    <span class="review-date">${timestamp.split(' ')[0]}</span>
                `; // .split(' ')[0] pega só a data (ex: 26/10/2025)

                // Adiciona o novo card ao contêiner
                container.appendChild(reviewCard);
            }
        })
        .catch(error => {
            console.error('Falha ao carregar avaliações:', error);
            loadingMessage.textContent = 'Falha ao carregar avaliações. Tente novamente mais tarde.';
        });
});

// --- FUNÇÃO AJUDANTE 1: Converter CSV para Array ---
function parseCSV(text) {
    // Esta função é simples e pode falhar se seu CSV tiver vírgulas "dentro" de um campo.
    // Mas para o Google Forms, geralmente funciona.
    const rows = text.split('\n').map(row => row.trim());
    return rows.map(row => row.split(','));
}

// --- FUNÇÃO AJUDANTE 2: Deixar o nome do espaço bonito ---
function getSpaceName(spaceID) {
    // Isso traduz o 'id' (ex: 'sala_a') para o nome bonito
    switch (spaceID) {
        case 'sala_a':
            return 'Sala de Reunião A';
        case 'cabine_b':
            return 'Cabine Foco B';
        case 'auditorio':
            return 'Auditório';
        case 'espaco_cafe':
            return 'Espaço Café';
        default:
            return spaceID; // Retorna o ID se não for reconhecido
    }
}