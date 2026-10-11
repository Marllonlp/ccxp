// src/main.js
import { startGame } from './game.js';
import { Player, desenharVidas } from './player.js';
import { inputState, setInput, configurarControlesToque, limparAcoes } from './input.js';
import {
  LIMITE_QUEDA,
  obterPosicaoInicial,
  obterPontoSeguro,
  verificarCheckpoints,
  limparCheckpoints,
  desenharFase,
  calcularCamera,
} from './level.js';
import { resolverColisoes, verificarEspaco } from './collisions.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const botaoPausar = document.getElementById('botao-pausar');
const menuPausa = document.getElementById('menu-pausa');
const botaoRetomar = document.getElementById('botao-retomar');
const botaoReiniciar = document.getElementById('botao-reiniciar');
const telaInicio = document.getElementById('tela-inicio');
const botaoJogar = document.getElementById('botao-jogar');
const botaoOrientacao = document.getElementById('botao-orientacao');

configurarControlesToque();

async function solicitarTelaHorizontal() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch {
    // Alguns navegadores só permitem a rotação pelas configurações do aparelho.
  }
}

botaoOrientacao?.addEventListener('click', solicitarTelaHorizontal);

const inicio = obterPosicaoInicial();
const player = new Player(inicio.x, inicio.y);

const status = document.getElementById('game-status');
if (status) {
  status.textContent = 'Setas ou A/D para andar, W/espaço para pular, S para agachar. P para pausar, R para reiniciar. Use o botão Pausar para abrir o menu.';
}

// --- Integração (vidas, queda e reinício) -------------------
let mensagem = '';
let mensagemAte = 0;
// Estados da partida:
// - inicio: tela inicial, aberta ao carregar o jogo e quando as vidas acabam.
// - jogando, pausado: partida em andamento ou com o menu de pausa aberto.
let estadoDaPartida = 'inicio';

function reposicionar(ponto) {
  player.retornar(ponto.x, ponto.y);
}

/** Zera a partida: vidas, checkpoints e posição inicial. Não mexe nos menus. */
function prepararNovaPartida() {
  limparCheckpoints();
  const pontoInicial = obterPosicaoInicial();
  player.vidas = 3;
  player.retornar(pontoInicial.x, pontoInicial.y);
  limparAcoes();
}

/** Esconde a tela inicial e os menus, e começa a partida do zero. */
function iniciarPartida() {
  prepararNovaPartida();
  estadoDaPartida = 'jogando';
  telaInicio.hidden = true;
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  controleDoJogo.start();
  botaoPausar.focus({ preventScroll: true });
}

/** Abre a tela inicial e para o jogo. Usada ao carregar a página e ao perder todas as vidas. */
function mostrarTelaInicio() {
  estadoDaPartida = 'inicio';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaInicio.hidden = false;
  botaoJogar.focus({ preventScroll: true });
}

function reiniciarJogo() {
  // Na tela inicial não há fase em andamento para reiniciar.
  if (estadoDaPartida === 'inicio') return;

  iniciarPartida();
  mensagem = 'Fase reiniciada';
  mensagemAte = performance.now() + 1500;
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
    const cameraX = calcularCamera(player.x, player.largura);
    desenharFase(ctx, cameraX);

    // O personagem usa coordenadas do mundo, então é desenhado com a mesma câmera.
    ctx.save();
    ctx.translate(-cameraX, 0);
    player.desenhar(ctx);
    ctx.restore();

    // Vidas e mensagens ficam fixas na tela.
    desenharVidas(ctx, player.vidas);

    if (mensagem && performance.now() < mensagemAte) {
      ctx.fillStyle = '#1d3557';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(mensagem, 24, 80);
    }
  },
};

const controleDoJogo = startGame(canvas, context, dependenciasDoJogo);
// O jogo começa parado: a tela inicial é exibida até o jogador clicar em Jogar.
mostrarTelaInicio();

// Chamada pelo jogo quando as vidas acabam: volta à tela inicial.
function aguardarEscolhaDoJogador() {
  if (estadoDaPartida !== 'jogando') return;
  mostrarTelaInicio();
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
botaoJogar.addEventListener('click', iniciarPartida);
botaoPausar.addEventListener('click', pausarPartida);
botaoRetomar.addEventListener('click', retomarPartida);

if (botaoReiniciar) {
  botaoReiniciar.disabled = false;
  botaoReiniciar.addEventListener('click', reiniciarJogo);
}

// Atalhos de teclado: P para pausar/retomar, R para reiniciar.
// Na tela inicial, nenhum atalho age: só o botão Jogar.
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
