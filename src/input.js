// Teclado e controles de toque, ligados aos botões data-action do index.html.

// A mesma detecção orienta os controles, as instruções e o terminal.
export const tecladoPrincipal = window.matchMedia('(hover: hover) and (pointer: fine)');

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
const ponteirosPorBotao = new Map();

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
    ponteirosPorBotao.forEach(ponteiros => ponteiros.clear());
    document.querySelectorAll('.mobile-controls .pressionado').forEach(botao => botao.classList.remove('pressionado'));
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
document.addEventListener('visibilitychange', () => {
    if (document.hidden) limparAcoes();
});

// Configuração dinâmica lendo o HTML
export function configurarControlesToque() {
    const areaDoJogo = document.querySelector('.game-shell');
    let ultimoToque = null;
    areaDoJogo.addEventListener('dragstart', evento => evento.preventDefault());
    areaDoJogo.addEventListener('contextmenu', evento => {
        if (evento.pointerType === 'touch' || !tecladoPrincipal.matches) evento.preventDefault();
    });
    areaDoJogo.querySelectorAll('img').forEach(imagem => { imagem.draggable = false; });

    // No iOS, o segundo toque ainda pode acionar zoom apesar do touch-action.
    // Cancela apenas esse gesto na partida; o movimento continua pelos Pointer Events.
    areaDoJogo.addEventListener('touchend', (evento) => {
        if (evento.changedTouches.length !== 1
            || evento.target.closest('#tela-terminal, #tela-desafio, #confirmar-vida')
            || !['jogando', 'chefe'].includes(areaDoJogo.dataset.estado)) {
            ultimoToque = null;
            return;
        }

        const toque = evento.changedTouches[0];
        const agora = performance.now();
        if (ultimoToque && agora - ultimoToque.tempo < 350
            && Math.hypot(toque.clientX - ultimoToque.x, toque.clientY - ultimoToque.y) < 32) {
            evento.preventDefault();
        }
        ultimoToque = { tempo: agora, x: toque.clientX, y: toque.clientY };
    }, { passive: false });

    areaDoJogo.addEventListener('touchcancel', () => {
        ultimoToque = null;
    }, { passive: true });

    const botoes = document.querySelectorAll('.mobile-controls button[data-action]');

    botoes.forEach(botao => {
        botao.disabled = false; // Ativa os botões na interface

        const acao = botao.getAttribute('data-action');

        const ponteiros = new Set();
        ponteirosPorBotao.set(botao, ponteiros);
        botao.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            ponteiros.add(e.pointerId);
            botao.setPointerCapture(e.pointerId);
            botao.classList.add('pressionado');
            setInput(acao, true);
        });

        const liberar = (e) => {
            ponteiros.delete(e.pointerId);
            if (ponteiros.size === 0) {
                botao.classList.remove('pressionado');
                setInput(acao, false);
            }
        };
        botao.addEventListener('pointerup', liberar);
        botao.addEventListener('pointercancel', liberar);
        botao.addEventListener('lostpointercapture', liberar);
    });
}
