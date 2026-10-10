// Responsável: Pedro. Arquivo reservado para o módulo de teclado e toque.
// A integração espera as ações: esquerda, direita, pulo e agachamento.
// Os elementos de toque estão em index.html, identificados por data-action.
// Implemente a captura aqui e conecte a leitura em main.js, conforme o README.

export const inputState = {
    esquerda: false,
    direita: false,
    pulo: false,
    agachamento: false,
    pausa: false
};

// Exige um novo acionamento do botão/tecla para cada salto e pausa
let puloLiberado = true;
let pausaLiberada = true;

export function setInput(acao, estado) {
    if (acao === 'pulo') {
        if (estado && puloLiberado) {
            inputState.pulo = true;
            puloLiberado = false;
        } else if (!estado) {
            inputState.pulo = false;
            puloLiberado = true;
        }
    } else if (acao === 'pausa') {
        if (estado && pausaLiberada) {
            inputState.pausa = true;
            pausaLiberada = false;
        } else if (!estado) {
            inputState.pausa = false;
            pausaLiberada = true;
        }
    } else if (acao) {
        inputState[acao] = estado;
    }
}

export function limparAcoes() {
    for (const acao of Object.keys(inputState)) {
        inputState[acao] = false;
    }
    puloLiberado = true;
    pausaLiberada = true;
}

// Mapeamento de teclas para ações
const keyMap = {
    'ArrowLeft': 'esquerda',
    'a': 'esquerda',
    'ArrowRight': 'direita',
    'd': 'direita',
    'ArrowUp': 'pulo',
    'w': 'pulo',
    ' ': 'pulo',
    'ArrowDown': 'agachamento',
    's': 'agachamento',
    'Escape': 'pausa',
    'p': 'pausa',
    'P': 'pausa',
    'Enter': 'pausa'
};

window.addEventListener('keydown', (e) => {
    const acao = keyMap[e.key];
    if (acao) setInput(acao, true);
});

window.addEventListener('keyup', (e) => {
    const acao = keyMap[e.key];
    if (acao) setInput(acao, false);
});

// Limpa as ações se a janela do jogo perder o foco
window.addEventListener('blur', limparAcoes);

// Configuração dinâmica lendo o HTML
export function configurarControlesToque() {
    const botoes = document.querySelectorAll('.mobile-controls button[data-action]');

    botoes.forEach(botao => {
        botao.disabled = false; // Ativa os botões na interface

        const acao = botao.getAttribute('data-action');

        botao.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setInput(acao, true);
        });

        botao.addEventListener('touchend', (e) => {
            e.preventDefault();
            setInput(acao, false);
        });

        botao.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            limparAcoes();
        });
    });
}