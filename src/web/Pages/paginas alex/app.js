document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA 1: PREENCHER NOME DO ESPAÇO ---
    const spaceNamePlaceholder = document.getElementById('space-name-placeholder');
    const spaceIdInput = document.getElementById('space-id-input');
    if (spaceNamePlaceholder && spaceIdInput) {
        const urlParams = new URLSearchParams(window.location.search);
        const spaceName = urlParams.get('nome');
        const spaceId = urlParams.get('id');
        if (spaceName) {
            spaceNamePlaceholder.textContent = spaceName;
            spaceIdInput.value = spaceId; // O ID vai para o input escondido
        } else {
            window.location.href = 'escolher-espaco.html';
        }
    }

    // --- LÓGICA 2: WIDGET DE ESTRELAS ---
    const starWidget = document.getElementById('star-widget');
    if (starWidget) {
        const stars = starWidget.querySelectorAll('.star-icon');
        const ratingInput = document.getElementById('rating-value');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                ratingInput.value = value;
                stars.forEach(s => {
                    if (s.getAttribute('data-value') <= value) {
                        s.classList.add('filled');
                    } else {
                        s.classList.remove('filled');
                    }
                });
            });
            star.addEventListener('mouseover', function() {
                const value = this.getAttribute('data-value');
                stars.forEach(s => {
                    if (s.getAttribute('data-value') <= value) {
                        s.style.fontVariationSettings = "'FILL' 1";
                    } else {
                        s.style.fontVariationSettings = "'FILL' 0";
                    }
                });
            });
        });
        starWidget.addEventListener('mouseout', function() {
            const savedValue = ratingInput.value;
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= savedValue) {
                    s.classList.add('filled');
                    s.style.fontVariationSettings = "'FILL' 1";
                } else {
                    s.classList.remove('filled');
                    s.style.fontVariationSettings = "'FILL' 0";
                }
            });
        });
    }

    // --- LÓGICA 3: CAMPO CONDICIONAL DE PROBLEMA ---
    const radioSim = document.getElementById('problema_sim');
    const radioNao = document.getElementById('problema_nao');
    const problemContainer = document.getElementById('problem-details-container');
    if (radioSim && radioNao && problemContainer) {
        radioSim.addEventListener('click', function() {
            problemContainer.style.display = 'flex';
        });
        radioNao.addEventListener('click', function() {
            problemContainer.style.display = 'none';
        });
    }

    // --- LÓGICA 4: ENVIO PARA O GOOGLE FORMS E REDIRECIONAMENTO ---
    const form = document.getElementById('evaluation-form');
    const submitButton = document.getElementById('submit-button');

    if (form && submitButton) {
        submitButton.addEventListener('click', async function(e) {
            e.preventDefault(); // Impede o envio padrão

            // 
            // *** SUA URL JÁ FOI INSERIDA AQUI ***
            //
            const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfVu2vt6wuYLXbR1-IMotKbtc3s6EBBQ5gZfwWpFYqxwzVOeQ/formResponse';
            
            const formData = new FormData(form);
            submitButton.textContent = 'ENVIANDO...';
            submitButton.disabled = true;

            try {
                // Envia os dados para o Google em segundo plano
                await fetch(GOOGLE_FORM_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors' // Modo 'no-cors' é necessário para o Google Forms
                });
                
                // Redireciona para a página de obrigado
                window.location.href = 'obrigado.html';

            } catch (error) {
                // Se der erro (ex: sem internet)
                console.error('Erro ao enviar formulário:', error);
                submitButton.textContent = 'ERRO, TENTE NOVAMENTE';
                submitButton.disabled = false;
            }
        });
    }
});