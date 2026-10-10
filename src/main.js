// src/main.js
import { startGame } from './game.js';
import { Player } from './player.js';
import { inputState, setInput, configurarControlesToque, limparAcoes } from './input.js';
import {
  LIMITE_QUEDA,
  obterPosicaoInicial,
  obterPontoSeguro,
  verificarCheckpoints,
  limparCheckpoints,
  desenharFase,
} from './level.js';
import { resolverColisoes, verificarEspaco } from './collisions.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const botaoPausar = document.getElementById('botao-pausar');
const menuPausa = document.getElementById('menu-pausa');
const botaoRetomar = document.getElementById('botao-retomar');
const menuVidasEsgotadas = document.getElementById('menu-vidas-esgotadas');
const tituloVidasEsgotadas = document.getElementById('titulo-vidas-esgotadas');
const botaoReiniciar = document.getElementById('botao-reiniciar');
const botaoReiniciarVidas = document.getElementById('botao-reiniciar-vidas');

configurarControlesToque();

const inicio = obterPosicaoInicial();
const player = new Player(inicio.x, inicio.y);

const status = document.getElementById('game-status');
if (status) {
  status.textContent = 'Setas ou A/D para andar, W/espaço para pular, S para agachar. P para pausar, R para reiniciar. Use o botão Pausar para abrir o menu.';
}

// --- Integração (vidas, queda e reinício) -------------------
let mensagem = '';
let mensagemAte = 0;
// Estados da partida: jogando, pausado e aguardandoEscolha.
let estadoDaPartida = 'jogando';

function reposicionar(ponto) {
  player.retornar(ponto.x, ponto.y);
}

function reiniciarJogo() {
  limparCheckpoints();
  const pontoInicial = obterPosicaoInicial();
  player.vidas = 3;
  player.retornar(pontoInicial.x, pontoInicial.y);
  limparAcoes();
  mensagem = 'Fase reiniciada';
  mensagemAte = performance.now() + 1500;

  if (estadoDaPartida !== 'jogando') {
    estadoDaPartida = 'jogando';
    menuPausa.hidden = true;
    menuVidasEsgotadas.hidden = true;
    botaoPausar.hidden = false;
    controleDoJogo.start();
    botaoPausar.focus({ preventScroll: true });
  }
}

// ---------------------------------------------------------------------------

const dependenciasDoJogo = {
  readActions: () => inputState,

  updatePlayer: (actions, deltaTime) => {
    if (actions.pausa) {
      actions.pausa = false;
      pausarPartida();
      return;
    }
    player.atualizar(deltaTime, verificarEspaco, LIMITE_QUEDA, aguardarEscolhaDoJogador);
  },

  resolveCollisions: (deltaTime) => {
    resolverColisoes(player, deltaTime);

    const checkpoint = verificarCheckpoints(player);
    if (checkpoint) {
      mensagem = 'Checkpoint salvo';
      mensagemAte = performance.now() + 1500;
    }

    if (player.y > LIMITE_QUEDA) {
      reposicionar(obterPontoSeguro());
      mensagem = 'Queda: retorno ao ponto seguro';
      mensagemAte = performance.now() + 1500;
    }
  },

  drawScene: (ctx) => {
    desenharFase(ctx);
    player.desenhar(ctx);

    if (mensagem && performance.now() < mensagemAte) {
      ctx.fillStyle = '#1d3557';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(mensagem, 24, 40);
    }
  },
};

const controleDoJogo = startGame(canvas, context, dependenciasDoJogo);

// Será chamada na integração quando Pedro informar que as vidas acabaram.
function aguardarEscolhaDoJogador() {
  if (estadoDaPartida !== 'jogando') return;

  estadoDaPartida = 'aguardandoEscolha';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  menuVidasEsgotadas.hidden = false;
  tituloVidasEsgotadas.focus({ preventScroll: true });
}

function pausarPartida() {
  if (estadoDaPartida !== 'jogando') return;

  estadoDaPartida = 'pausado';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = false;
  botaoRetomar.focus({ preventScroll: true });
}

function retomarPartida() {
  if (estadoDaPartida !== 'pausado') return;

  limparAcoes();
  estadoDaPartida = 'jogando';
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  controleDoJogo.start();
  botaoPausar.focus({ preventScroll: true });
}

// O evento click atende tanto ao mouse quanto ao toque nos botões.
botaoPausar.addEventListener('click', pausarPartida);
botaoRetomar.addEventListener('click', retomarPartida);

if (botaoReiniciar) {
  botaoReiniciar.disabled = false;
  botaoReiniciar.addEventListener('click', reiniciarJogo);
}
if (botaoReiniciarVidas) {
  botaoReiniciarVidas.disabled = false;
  botaoReiniciarVidas.addEventListener('click', reiniciarJogo);
}

// Atalhos de teclado: P para pausar/retomar, R para reiniciar
window.addEventListener('keydown', (evento) => {
  if (evento.key === 'p' || evento.key === 'P' || evento.key === 'Escape') {
    if (estadoDaPartida === 'jogando') {
      pausarPartida();
    } else if (estadoDaPartida === 'pausado') {
      retomarPartida();
    }
  }

  if (evento.key === 'r' || evento.key === 'R') {
    reiniciarJogo();
  }
});
