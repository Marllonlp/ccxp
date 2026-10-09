// src/main.js
import { startGame } from './game.js';
import { Player } from './player.js';
import { inputState, configurarControlesToque } from './input.js';
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

configurarControlesToque();

const inicio = obterPosicaoInicial();
const player = new Player(inicio.x, inicio.y);

const status = document.getElementById('game-status');
if (status) {
  status.textContent = 'Setas ou A/D para andar, W/espaço para pular, S para agachar, R para reiniciar.';
}

// --- Integração provisória (pertence ao Marlon e ao Pedro) -------------------
// O retorno e o reinício abaixo existem apenas para validar os checkpoints e as
// colisões enquanto as vidas (RF04) e o controle da partida (RF07) não chegam.
let mensagem = '';
let mensagemAte = 0;

function reposicionar(ponto) {
  player.x = ponto.x;
  player.y = ponto.y;
  player.vx = 0;
  player.vy = 0;
  player.agachado = false;
  player.altura = player.alturaNormal;
  player.noChao = false;
}

window.addEventListener('keydown', (evento) => {
  if (evento.key !== 'r' && evento.key !== 'R') return;
  limparCheckpoints();
  reposicionar(obterPosicaoInicial());
  mensagem = 'Fase reiniciada';
  mensagemAte = performance.now() + 1500;
});
// ---------------------------------------------------------------------------

const dependenciasDoJogo = {
  readActions: () => inputState,

  updatePlayer: (actions, deltaTime) => {
    player.atualizar(deltaTime, verificarEspaco);
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

startGame(canvas, context, dependenciasDoJogo);
